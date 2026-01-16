import type { LiquidViewSchema } from "@liqueur/protocol";

/**
 * Database metadata for AI context
 */
export interface DatabaseMetadata {
  tables: TableMetadata[];
}

export interface TableMetadata {
  name: string;
  columns: ColumnMetadata[];
  rowCount: number;
  sampleData?: unknown[];
}

export interface ColumnMetadata {
  name: string;
  type: string;
  nullable: boolean;
  isPrimaryKey: boolean;
  isForeignKey: boolean;
}

/**
 * Validation result for AI-generated schemas
 */
export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  schema?: LiquidViewSchema;
}

export interface ValidationError {
  code: string;
  message: string;
  path?: string;
}

/**
 * Cost estimation for AI requests
 */
export interface CostEstimate {
  estimatedCost: number;
  currency: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
}

/**
 * AI Provider configuration
 */
export interface ProviderConfig {
  apiKey?: string;
  model: string;
  baseURL?: string;
  timeout?: number;
  maxRetries?: number;
}

/**
 * AI Provider interface
 * All providers must implement this interface
 */
export interface AIProvider {
  /**
   * Provider name for identification
   */
  readonly name: string;

  /**
   * Generate LiquidView schema from user prompt and database metadata
   * @param prompt User's natural language request
   * @param metadata Database schema information
   * @returns Promise resolving to LiquidViewSchema
   * @throws Error if generation fails or schema is invalid
   */
  generateSchema(prompt: string, metadata: DatabaseMetadata): Promise<LiquidViewSchema>;

  /**
   * Validate AI response and parse to schema
   * @param response Raw AI response
   * @returns Validation result with parsed schema or errors
   */
  validateResponse(response: unknown): ValidationResult;

  /**
   * Estimate cost for a given prompt
   * @param prompt User prompt to estimate
   * @returns Cost estimation
   */
  estimateCost(prompt: string): CostEstimate;

  /**
   * Check if provider is properly configured
   * @returns true if ready to use
   */
  isConfigured(): boolean;
}

/**
 * AI Provider factory for creating providers
 */
export type AIProviderFactory = (config: ProviderConfig) => AIProvider;

/**
 * Provider types supported
 */
export type ProviderType =
  | "anthropic"
  | "gemini"
  | "openai"
  | "deepseek"
  | "glm"
  | "local"
  | "mock";
