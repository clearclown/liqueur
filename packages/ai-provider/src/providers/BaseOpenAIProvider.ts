import OpenAI from 'openai';
import type { LiquidViewSchema } from '@liqueur/protocol';
import type {
  AIProvider,
  DatabaseMetadata,
  ValidationResult,
  CostEstimate,
  ProviderConfig,
} from '../types';

/**
 * Base configuration for OpenAI-compatible providers
 */
export interface OpenAICompatibleConfig extends ProviderConfig {
  baseURL?: string;
}

/**
 * Base provider for OpenAI-compatible APIs
 * Used by: OpenAI, DeepSeek, GLM-4.7, LocalLLM
 */
export abstract class BaseOpenAIProvider implements AIProvider {
  protected client: OpenAI;
  protected config: OpenAICompatibleConfig;

  public abstract readonly name: string;

  constructor(config: OpenAICompatibleConfig) {
    this.config = config;
    this.client = new OpenAI({
      apiKey: config.apiKey || 'not-needed',
      baseURL: config.baseURL,
      timeout: config.timeout || 30000,
      maxRetries: config.maxRetries || 3,
    });
  }

  isConfigured(): boolean {
    // For local LLM, API key is not required
    if (this.config.baseURL?.includes('localhost') || this.config.baseURL?.includes('127.0.0.1')) {
      return true;
    }
    return !!this.config.apiKey && this.config.apiKey !== 'not-needed';
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

    // Call OpenAI-compatible API
    const response = await this.client.chat.completions.create({
      model: this.config.model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt },
      ],
      temperature: 0.7,
      max_tokens: 4096,
      response_format: { type: 'json_object' },
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('Empty response from AI provider');
    }

    // Parse JSON
    let parsedSchema: unknown;
    try {
      parsedSchema = JSON.parse(content);
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

    // Cost calculation (varies by provider, override in subclass)
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
   * Can be overridden by subclasses for provider-specific prompts
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
   * Get cost per input token (override in subclass)
   */
  protected abstract getCostPerInputToken(): number;

  /**
   * Get cost per output token (override in subclass)
   */
  protected abstract getCostPerOutputToken(): number;
}
