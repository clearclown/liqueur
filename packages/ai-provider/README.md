# @liqueur/ai-provider

AI provider abstraction for LiquidView schema generation

## Overview

`@liqueur/ai-provider` provides a unified interface for interacting with multiple AI providers (OpenAI, Anthropic, Google Gemini, DeepSeek, GLM) to generate LiquidView schemas from natural language descriptions and database metadata.

## Features

- **Multi-provider support** - OpenAI, Anthropic Claude, Google Gemini, DeepSeek, GLM, and custom endpoints
- **Unified interface** - Single API across all providers
- **Provider factory** - Automatic provider selection from environment
- **Type-safe** - Full TypeScript support with strict validation
- **Cost estimation** - Calculate API costs before generation
- **Mock provider** - For testing without API calls

## Installation

```bash
npm install @liqueur/ai-provider @liqueur/protocol
```

### Peer Dependencies (optional)

Install only the SDKs you need:

```bash
# For OpenAI/DeepSeek/GLM
npm install openai

# For Anthropic Claude
npm install @anthropic-ai/sdk

# For Google Gemini
npm install @google/generative-ai
```

## Usage

### Provider Factory (Recommended)

```typescript
import { ProviderFactory } from '@liqueur/ai-provider';

// Automatically selects provider from environment
const provider = ProviderFactory.fromEnv();

const metadata = {
  tables: [
    {
      name: 'sales',
      columns: [
        { name: 'month', type: 'string' },
        { name: 'amount', type: 'number' }
      ]
    }
  ]
};

const result = await provider.generateSchema(
  'Create a bar chart showing monthly sales',
  metadata
);

if (result.valid) {
  console.log('Generated schema:', result.schema);
} else {
  console.error('Errors:', result.errors);
}
```

### Environment Variables

```bash
# OpenAI
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4  # Optional, defaults to gpt-3.5-turbo

# Anthropic Claude
ANTHROPIC_API_KEY=sk-ant-...
ANTHROPIC_MODEL=claude-3-5-sonnet-20241022  # Optional

# Google Gemini
GEMINI_API_KEY=...
GEMINI_MODEL=gemini-1.5-pro  # Optional

# DeepSeek
DEEPSEEK_API_KEY=sk-...

# GLM (Zhipu AI)
GLM_API_KEY=...

# Local LLM (OpenAI-compatible)
LOCAL_LLM_BASE_URL=http://localhost:1234/v1
LOCAL_LLM_MODEL=llama3
```

### Direct Provider Instantiation

```typescript
import { OpenAIProvider, AnthropicProvider, GeminiProvider } from '@liqueur/ai-provider';

// OpenAI
const openai = new OpenAIProvider({
  apiKey: process.env.OPENAI_API_KEY!,
  model: 'gpt-4'
});

// Anthropic
const anthropic = new AnthropicProvider({
  apiKey: process.env.ANTHROPIC_API_KEY!,
  model: 'claude-3-5-sonnet-20241022'
});

// Gemini
const gemini = new GeminiProvider({
  apiKey: process.env.GEMINI_API_KEY!,
  model: 'gemini-1.5-pro'
});
```

### Mock Provider (Testing)

```typescript
import { MockProvider } from '@liqueur/ai-provider';

const mock = new MockProvider({
  apiKey: 'mock',
  model: 'mock-model'
});

// Always returns valid schemas for testing
const result = await mock.generateSchema('Create a chart', metadata);
```

### Cost Estimation

```typescript
const cost = provider.estimateCost('Create a dashboard with 3 charts');

console.log(`Estimated cost: $${cost.totalCost.toFixed(4)}`);
console.log(`Input tokens: ${cost.inputTokens}`);
console.log(`Output tokens: ${cost.outputTokens}`);
```

## API Reference

### AIProvider Interface

All providers implement this interface:

```typescript
interface AIProvider {
  generateSchema(
    prompt: string,
    metadata: DatabaseMetadata
  ): Promise<ValidationResult>;

  estimateCost(prompt: string): CostEstimate;
}
```

### Providers

- **OpenAIProvider** - OpenAI GPT models
- **DeepSeekProvider** - DeepSeek API
- **GLMProvider** - Zhipu AI GLM models
- **LocalLLMProvider** - Local OpenAI-compatible endpoints
- **AnthropicProvider** - Anthropic Claude models
- **GeminiProvider** - Google Gemini models
- **MockProvider** - Mock provider for testing

### BaseOpenAIProvider

Base class for OpenAI-compatible providers (OpenAI, DeepSeek, GLM, LocalLLM).

### ProviderFactory

```typescript
class ProviderFactory {
  static fromEnv(): AIProvider;
  static create(type: ProviderType, config: ProviderConfig): AIProvider;
}
```

**Supported ProviderTypes:**
- `'openai'`
- `'anthropic'`
- `'gemini'`
- `'deepseek'`
- `'glm'`
- `'local-llm'`
- `'mock'`

## Types

```typescript
interface DatabaseMetadata {
  tables: TableMetadata[];
}

interface TableMetadata {
  name: string;
  columns: ColumnMetadata[];
}

interface ColumnMetadata {
  name: string;
  type: string;
}

interface CostEstimate {
  inputTokens: number;
  outputTokens: number;
  inputCost: number;
  outputCost: number;
  totalCost: number;
}

interface ValidationResult {
  valid: boolean;
  schema?: LiquidViewSchema;
  errors: ValidationError[];
}
```

## Development

```bash
# Build
npm run build

# Test
npm test

# Test with coverage
npm run test:coverage

# Lint
npm run lint

# Type check
npm run typecheck
```

## Contributing

See the main [repository](https://github.com/your-org/liqueur) for contribution guidelines.

## License

MIT
