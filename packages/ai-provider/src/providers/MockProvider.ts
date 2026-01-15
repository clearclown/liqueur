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
 * Mock AI Provider for testing and development
 * Generates predefined schemas based on simple pattern matching
 */
export class MockProvider implements AIProvider {
  public readonly name = 'mock';
  private config: ProviderConfig;

  constructor(config: ProviderConfig) {
    this.config = config;
  }

  isConfigured(): boolean {
    // Mock provider is always configured
    return true;
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

    // Pattern matching for component types
    const lowerPrompt = prompt.toLowerCase();
    const hasChart = lowerPrompt.includes('chart') || lowerPrompt.includes('graph');
    const hasTable = lowerPrompt.includes('table') || lowerPrompt.includes('list');

    // Use first table from metadata
    const firstTable = metadata.tables[0];
    const dataSourceName = `ds_${firstTable.name}`;

    // Determine chart variant
    let chartVariant: 'bar' | 'line' | 'pie' | 'area' = 'bar';
    if (lowerPrompt.includes('line')) chartVariant = 'line';
    else if (lowerPrompt.includes('pie')) chartVariant = 'pie';
    else if (lowerPrompt.includes('area')) chartVariant = 'area';

    // Build components
    const components: LiquidViewSchema['components'] = [];

    if (hasChart || (!hasChart && !hasTable)) {
      // Default to chart if ambiguous
      components.push({
        type: 'chart',
        variant: chartVariant,
        title: `${firstTable.name.charAt(0).toUpperCase() + firstTable.name.slice(1)} Chart`,
        data_source: dataSourceName,
      });
    }

    if (hasTable) {
      // Get column names from metadata
      const columns = firstTable.columns.map((col) => col.name);
      components.push({
        type: 'table',
        title: `${firstTable.name.charAt(0).toUpperCase() + firstTable.name.slice(1)} Table`,
        columns,
        data_source: dataSourceName,
      });
    }

    // Build schema
    const schema: LiquidViewSchema = {
      version: '1.0',
      layout: {
        type: 'grid',
        columns: components.length,
        gap: 16,
      },
      components,
      data_sources: {
        [dataSourceName]: {
          resource: firstTable.name,
        },
      },
    };

    return schema;
  }

  validateResponse(response: unknown): ValidationResult {
    return SchemaValidator.validateResponse(response);
  }

  estimateCost(prompt: string): CostEstimate {
    // Mock provider has zero cost
    // Estimate tokens based on character count (rough approximation: 4 chars = 1 token)
    const inputTokens = Math.ceil(prompt.length / 4);
    // Assume output is about 2x input for schema generation
    const outputTokens = inputTokens * 2;

    return {
      estimatedCost: 0,
      currency: 'USD',
      model: this.config.model,
      inputTokens,
      outputTokens,
    };
  }
}
