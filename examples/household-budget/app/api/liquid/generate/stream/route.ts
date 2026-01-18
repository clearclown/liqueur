import { createProviderFromEnv, type StreamChunk } from '@liqueur/ai-provider';
import { householdBudgetMetadata } from '@/lib/database-metadata';
import { requireAuth } from '@/lib/auth';

// Rate limiting (shared with non-streaming endpoint)
const requestCounts = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT = 10;
const RATE_WINDOW = 60 * 1000;

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
  if (prompt.length > 500) {
    throw new Error('Prompt too long (max 500 characters)');
  }

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
      return new Response(
        JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
        { status: 429, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Parse request body
    const body = await request.json();
    const { prompt, currentSchema } = body;

    if (!prompt || typeof prompt !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Missing or invalid prompt' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Sanitize prompt
    const sanitizedPrompt = sanitizePrompt(prompt);

    // Add current date and schema context
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;

    // Build context with current schema if available
    let promptWithContext = `Current date: ${now.toISOString().split('T')[0]} (Year: ${currentYear}, Month: ${currentMonth})

`;

    if (currentSchema) {
      promptWithContext += `CURRENT DASHBOARD SCHEMA (modify this based on user request):
${JSON.stringify(currentSchema, null, 2)}

`;
    }

    promptWithContext += `User request: ${sanitizedPrompt}

IMPORTANT INSTRUCTIONS:
- When filtering by date, use the current year (${currentYear}) and appropriate month
- For "this month" use ${currentYear}-${String(currentMonth).padStart(2, '0')}
- If user says "全て" or "all", remove date filters to show all data
- Preserve the general structure of the current schema unless user asks for a complete change
- Only modify the parts that the user explicitly asks to change`;

    // Create AI provider
    const provider = createProviderFromEnv();

    // Check if streaming is supported
    if (!provider.supportsStreaming?.() || !provider.generateSchemaStream) {
      // Fall back to non-streaming response
      return new Response(
        JSON.stringify({ error: 'Streaming not supported for this provider' }),
        { status: 501, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Prepare metadata
    const metadata = {
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
    };

    // Create SSE stream
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          const generator = provider.generateSchemaStream!(promptWithContext, metadata);

          for await (const chunk of generator) {
            const sseData = `data: ${JSON.stringify(chunk)}\n\n`;
            controller.enqueue(encoder.encode(sseData));

            // End stream on done or error
            if (chunk.type === 'done' || chunk.type === 'error') {
              break;
            }
          }
        } catch (error) {
          const errorChunk: StreamChunk = {
            type: 'error',
            error: error instanceof Error ? error.message : 'Stream error',
          };
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(errorChunk)}\n\n`));
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    console.error('Stream generate error:', error);

    if (error instanceof Error) {
      if (error.message === 'Unauthorized') {
        return new Response(
          JSON.stringify({ error: 'Unauthorized' }),
          { status: 401, headers: { 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ error: error.message }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Stream generation failed' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
