import type { LiquidViewSchema } from '@liqueur/protocol';
import type {
  AIProvider,
  DatabaseMetadata,
  ValidationResult,
  CostEstimate,
  ProviderConfig,
} from '../types';
import { SchemaValidator } from '../validators/SchemaValidator';

/**
 * Base class for AI providers with common validation and cost estimation logic
 * Reduces code duplication between Anthropic, Gemini, and other providers
 */
export abstract class BaseAIProvider implements AIProvider {
  public abstract readonly name: string;
  protected config: ProviderConfig;

  constructor(config: ProviderConfig) {
    this.config = config;
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

    // Call provider-specific API
    const textContent = await this.callAPI(prompt, systemPrompt);

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
    return SchemaValidator.validateResponse(response);
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
   * Common across all AI providers
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
   * Provider-specific API call implementation
   * @param prompt User prompt
   * @param systemPrompt Generated system prompt with metadata
   * @returns Raw text response from AI
   */
  protected abstract callAPI(prompt: string, systemPrompt: string): Promise<string>;

  /**
   * Get cost per input token based on model
   * Provider-specific pricing
   */
  protected abstract getCostPerInputToken(): number;

  /**
   * Get cost per output token based on model
   * Provider-specific pricing
   */
  protected abstract getCostPerOutputToken(): number;
}
