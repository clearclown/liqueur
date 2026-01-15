import Anthropic from '@anthropic-ai/sdk';
import type { LiquidViewSchema } from '@liqueur/protocol';
import type {
  AIProvider,
  DatabaseMetadata,
  ValidationResult,
  CostEstimate,
  ProviderConfig,
} from '../types';

/**
 * Anthropic Provider (Claude 3 family)
 * Official Anthropic API
 */
export class AnthropicProvider implements AIProvider {
  public readonly name = 'anthropic';
  private client: Anthropic;
  private config: ProviderConfig;

  constructor(config: ProviderConfig) {
    this.config = config;
    this.client = new Anthropic({
      apiKey: config.apiKey || '',
      timeout: config.timeout || 30000,
      maxRetries: config.maxRetries || 3,
    });
  }

  isConfigured(): boolean {
    return !!this.config.apiKey && this.config.apiKey.trim() !== '';
  }

  async generateSchema(
    prompt: string,
    metadata: DatabaseMetadata
  ): Promise<LiquidViewSchema> {
    // Validation
    if (!prompt || prompt.trim() === '') {
      throw new Error('Prompt cannot be empty');
    }

    if (!metadata.tables || metadata.tables.length === 0) {
      throw new Error('Database metadata cannot be empty');
    }

    // Build system prompt
    const systemPrompt = this.buildSystemPrompt(metadata);

    // Call Anthropic API
    const response = await this.client.messages.create({
      model: this.config.model,
      max_tokens: 4096,
      temperature: 0.7,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    // Extract text content
    const content = response.content[0];
    if (content.type !== 'text') {
      throw new Error('Unexpected response type from Anthropic API');
    }

    const textContent = content.text;

    // Parse JSON
    let parsedSchema: unknown;
    try {
      parsedSchema = JSON.parse(textContent);
    } catch (error) {
      throw new Error(`Failed to parse AI response as JSON: ${error}`);
    }

    // Validate
    const validationResult = this.validateResponse(parsedSchema);
    if (!validationResult.valid) {
      const errorMessages = validationResult.errors.map((e) => e.message).join(', ');
      throw new Error(`Invalid schema generated: ${errorMessages}`);
    }

    return validationResult.schema!;
  }

  validateResponse(response: unknown): ValidationResult {
    // Type guard
    if (!response || typeof response !== 'object') {
      return {
        valid: false,
        errors: [
          {
            code: 'INVALID_RESPONSE_TYPE',
            message: 'Response must be an object',
          },
        ],
      };
    }

    const obj = response as Record<string, unknown>;

    // Check required fields
    const errors: ValidationResult['errors'] = [];

    if (!obj.version) {
      errors.push({
        code: 'MISSING_VERSION',
        message: 'Schema version is required',
        path: 'version',
      });
    }

    if (!obj.layout) {
      errors.push({
        code: 'MISSING_LAYOUT',
        message: 'Schema layout is required',
        path: 'layout',
      });
    }

    if (!obj.components) {
      errors.push({
        code: 'MISSING_COMPONENTS',
        message: 'Schema components are required',
        path: 'components',
      });
    }

    if (!obj.data_sources) {
      errors.push({
        code: 'MISSING_DATA_SOURCES',
        message: 'Schema data_sources are required',
        path: 'data_sources',
      });
    }

    if (errors.length > 0) {
      return {
        valid: false,
        errors,
      };
    }

    // Basic validation passed
    return {
      valid: true,
      errors: [],
      schema: response as LiquidViewSchema,
    };
  }

  estimateCost(prompt: string): CostEstimate {
    // Rough token estimation (4 chars ≈ 1 token)
    const inputTokens = Math.ceil(prompt.length / 4);
    // Assume system prompt adds ~500 tokens
    const totalInputTokens = inputTokens + 500;
    // Assume output is about 1000 tokens for schema generation
    const outputTokens = 1000;

    // Cost calculation based on model
    const costPerInputToken = this.getCostPerInputToken();
    const costPerOutputToken = this.getCostPerOutputToken();

    const estimatedCost =
      totalInputTokens * costPerInputToken + outputTokens * costPerOutputToken;

    return {
      estimatedCost,
      currency: 'USD',
      model: this.config.model,
      inputTokens: totalInputTokens,
      outputTokens,
    };
  }

  /**
   * Build system prompt with database metadata
   */
  protected buildSystemPrompt(metadata: DatabaseMetadata): string {
    const metadataStr = JSON.stringify(metadata, null, 2);

    return `You are a LiquidView schema generator. Your ONLY output is valid JSON conforming to the LiquidViewSchema specification.

RULES:
1. OUTPUT ONLY JSON - No code, no explanations, no markdown
2. VALIDATE against protocol v1.0
3. USE ONLY provided database metadata
4. NEVER generate SQL, JavaScript, or executable code
5. ONLY use: chart (bar/line/pie/area), table components
6. APPLY filters/aggregations through DataSource (no client-side logic)

DATABASE METADATA:
${metadataStr}

SCHEMA SPECIFICATION:
{
  "version": "1.0",
  "layout": { "type": "grid" | "stack", "columns": number, "gap": number },
  "components": [ { "type": "chart" | "table", ... } ],
  "data_sources": { "name": { "resource": "table_name", "filters": [...], "aggregation": {...} } }
}

OUTPUT VALID JSON ONLY.`;
  }

  /**
   * Get cost per input token based on model
   * Source: https://www.anthropic.com/pricing
   */
  private getCostPerInputToken(): number {
    if (this.config.model.includes('claude-3-5-sonnet')) {
      return 3.0 / 1_000_000; // $3.00 per MTok
    }
    if (this.config.model.includes('claude-3-5-haiku')) {
      return 1.0 / 1_000_000; // $1.00 per MTok
    }
    if (this.config.model.includes('claude-3-haiku')) {
      return 0.25 / 1_000_000; // $0.25 per MTok
    }
    if (this.config.model.includes('claude-3-sonnet')) {
      return 3.0 / 1_000_000; // $3.00 per MTok
    }
    if (this.config.model.includes('claude-3-opus')) {
      return 15.0 / 1_000_000; // $15.00 per MTok
    }
    return 0.25 / 1_000_000; // default to Haiku
  }

  /**
   * Get cost per output token based on model
   */
  private getCostPerOutputToken(): number {
    if (this.config.model.includes('claude-3-5-sonnet')) {
      return 15.0 / 1_000_000; // $15.00 per MTok
    }
    if (this.config.model.includes('claude-3-5-haiku')) {
      return 5.0 / 1_000_000; // $5.00 per MTok
    }
    if (this.config.model.includes('claude-3-haiku')) {
      return 1.25 / 1_000_000; // $1.25 per MTok
    }
    if (this.config.model.includes('claude-3-sonnet')) {
      return 15.0 / 1_000_000; // $15.00 per MTok
    }
    if (this.config.model.includes('claude-3-opus')) {
      return 75.0 / 1_000_000; // $75.00 per MTok
    }
    return 1.25 / 1_000_000; // default to Haiku
  }
}
