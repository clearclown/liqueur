import { NextRequest, NextResponse } from 'next/server';
import { ProviderFactory } from '@liqueur/ai-provider';
import { SchemaValidator } from '@liqueur/protocol';

const validator = new SchemaValidator();

// Simple database metadata for the template
const metadata = {
  tables: [
    {
      name: 'data',
      columns: [
        { name: 'name', type: 'string' },
        { name: 'value', type: 'number' },
        { name: 'category', type: 'string' },
        { name: 'date', type: 'date' },
      ],
    },
  ],
};

export async function POST(request: NextRequest) {
  try {
    const { prompt } = await request.json();

    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json(
        { valid: false, error: 'Prompt is required' },
        { status: 400 }
      );
    }

    // Check if AI provider is configured
    const hasApiKey = !!(
      process.env.ANTHROPIC_API_KEY ||
      process.env.OPENAI_API_KEY ||
      process.env.GEMINI_API_KEY
    );

    if (!hasApiKey) {
      // Return a mock schema if no API key is configured
      return NextResponse.json({
        valid: true,
        schema: {
          version: '1.0',
          layout: { type: 'grid', columns: 1 },
          components: [
            {
              type: 'chart',
              chart_type: prompt.toLowerCase().includes('pie') ? 'pie' :
                         prompt.toLowerCase().includes('line') ? 'line' : 'bar',
              title: 'Generated Chart',
              data_source: 'sample',
            },
          ],
          data_sources: {
            sample: { resource: 'data' },
          },
        },
        message: 'Using mock schema. Configure API keys for AI generation.',
      });
    }

    const provider = ProviderFactory.fromEnv();
    const result = await provider.generateSchema(prompt, metadata);

    if (result.valid && result.schema) {
      // Validate the generated schema
      const validation = validator.validate(result.schema);
      if (!validation.valid) {
        return NextResponse.json({
          valid: false,
          error: 'Generated schema is invalid',
          errors: validation.errors,
        });
      }
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Generate error:', error);
    return NextResponse.json(
      { valid: false, error: 'Failed to generate schema' },
      { status: 500 }
    );
  }
}
