import { NextResponse } from 'next/server';
import { createProviderFromEnv, ArtifactGenerator } from '@liqueur/ai-provider';
import { SchemaValidator } from '@liqueur/protocol';
import { householdBudgetMetadata } from '@/lib/database-metadata';
import { requireAuth } from '@/lib/auth';

// Simple rate limiting (in production, use Redis or similar)
const requestCounts = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT = 10; // requests per minute
const RATE_WINDOW = 60 * 1000; // 1 minute

function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  const record = requestCounts.get(userId);

  if (!record || now > record.resetTime) {
    requestCounts.set(userId, { count: 1, resetTime: now + RATE_WINDOW });
    return true;
  }

  if (record.count >= RATE_LIMIT) {
    return false;
  }

  record.count++;
  return true;
}

// Prompt sanitization
function sanitizePrompt(prompt: string): string {
  // Max length limit
  if (prompt.length > 500) {
    throw new Error('Prompt too long (max 500 characters)');
  }

  // Detect dangerous patterns
  const dangerousPatterns = [
    /DROP\s+TABLE/i,
    /DELETE\s+FROM/i,
    /<script>/i,
    /javascript:/i,
    /data:/i,
  ];

  for (const pattern of dangerousPatterns) {
    if (pattern.test(prompt)) {
      throw new Error('Invalid prompt: contains potentially dangerous content');
    }
  }

  return prompt.trim();
}

export async function POST(request: Request) {
  try {
    // Authentication check
    const user = await requireAuth(request);

    // Rate limiting
    if (!checkRateLimit(user.id)) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please try again later.' },
        { status: 429 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { prompt } = body;

    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json(
        { error: 'Missing or invalid prompt' },
        { status: 400 }
      );
    }

    // Sanitize prompt
    const sanitizedPrompt = sanitizePrompt(prompt);

    // Add current date context to the prompt
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;
    const promptWithContext = `Current date: ${now.toISOString().split('T')[0]} (Year: ${currentYear}, Month: ${currentMonth})

User request: ${sanitizedPrompt}

IMPORTANT: When filtering by date, use the current year (${currentYear}) and appropriate month. For "this month" use ${currentYear}-${String(currentMonth).padStart(2, '0')}.`;

    // Create AI provider from environment
    const provider = createProviderFromEnv();

    // Create artifact generator
    const generator = new ArtifactGenerator(provider);

    // Generate schema with household budget context
    const result = await generator.generateArtifact({
      userRequest: promptWithContext,
      metadata: {
        tables: householdBudgetMetadata.tables.map((table) => ({
          name: table.name,
          description: table.description,
          columns: table.columns.map((col) => ({
            name: col.name,
            type: col.type,
            nullable: col.nullable,
            isPrimaryKey: col.primaryKey || false,
            isForeignKey: col.name.endsWith('Id') && col.name !== 'id',
          })),
        })),
      },
    });

    // Validate generated schema
    const validator = new SchemaValidator();
    const validationResult = validator.validate(result.schema);

    if (!validationResult.valid) {
      console.error('Generated schema validation failed:', validationResult.errors);
      return NextResponse.json(
        {
          error: 'Generated schema is invalid',
          details: validationResult.errors,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      schema: result.schema,
      estimatedCost: result.estimatedCost,
    });
  } catch (error) {
    console.error('Generate error:', error);

    if (error instanceof Error) {
      if (error.message === 'Unauthorized') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Generation failed' },
      { status: 500 }
    );
  }
}
