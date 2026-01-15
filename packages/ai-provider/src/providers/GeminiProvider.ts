import { GoogleGenerativeAI } from '@google/generative-ai';
import type { LiquidViewSchema } from '@liqueur/protocol';
import type {
  AIProvider,
  DatabaseMetadata,
  ValidationResult,
  CostEstimate,
  ProviderConfig,
} from '../types';

/**
 * Google Gemini Provider (Gemini 1.5 Flash, Gemini 1.5 Pro, etc.)
 * Official Google Generative AI API
 */
export class GeminiProvider implements AIProvider {
  public readonly name = 'gemini';
  private client: GoogleGenerativeAI;
  private config: ProviderConfig;

  constructor(config: ProviderConfig) {
    this.config = config;
    this.client = new GoogleGenerativeAI(config.apiKey || '');
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

    // Get generative model
    const model = this.client.getGenerativeModel({
      model: this.config.model,
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 4096,
        responseMimeType: 'application/json',
      },
    });

    // Call Gemini API
    const result = await model.generateContent([
      { text: systemPrompt },
      { text: prompt },
    ]);

    const response = result.response;
    const textContent = response.text();

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
   * Source: https://ai.google.dev/pricing
   */
  private getCostPerInputToken(): number {
    // Gemini 2.0 Flash Experimental - Free
    if (this.config.model.includes('gemini-2.0-flash-exp')) {
      return 0;
    }
    // Gemini 1.5 Flash
    if (this.config.model.includes('gemini-1.5-flash')) {
      return 0.075 / 1_000_000; // $0.075 per MTok (≤128k tokens)
    }
    // Gemini 1.5 Pro
    if (this.config.model.includes('gemini-1.5-pro')) {
      return 1.25 / 1_000_000; // $1.25 per MTok (≤128k tokens)
    }
    // Default to Flash pricing
    return 0.075 / 1_000_000;
  }

  /**
   * Get cost per output token based on model
   */
  private getCostPerOutputToken(): number {
    // Gemini 2.0 Flash Experimental - Free
    if (this.config.model.includes('gemini-2.0-flash-exp')) {
      return 0;
    }
    // Gemini 1.5 Flash
    if (this.config.model.includes('gemini-1.5-flash')) {
      return 0.30 / 1_000_000; // $0.30 per MTok
    }
    // Gemini 1.5 Pro
    if (this.config.model.includes('gemini-1.5-pro')) {
      return 5.0 / 1_000_000; // $5.00 per MTok
    }
    // Default to Flash pricing
    return 0.30 / 1_000_000;
  }
}
