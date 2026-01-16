import type { ProviderConfig } from "../types";
import type { OpenAICompatibleConfig } from "../providers/BaseOpenAIProvider";

/**
 * Environment variable parsing helpers for ProviderFactory
 * Eliminates duplicated parsing logic across provider types
 */

/**
 * Parse OpenAI-compatible provider configuration from environment variables
 * @param prefix Environment variable prefix (e.g., 'OPENAI', 'DEEPSEEK', 'GLM')
 * @param required Whether API key and model are required (default: true for both)
 * @returns OpenAICompatibleConfig
 * @throws Error if required variables are missing
 */
export function getOpenAICompatibleConfig(
  prefix: string,
  required: { apiKey?: boolean; model?: boolean } = {}
): OpenAICompatibleConfig {
  const requireApiKey = required.apiKey !== false;
  const requireModel = required.model !== false;

  const apiKey = process.env[`${prefix}_API_KEY`];
  const model = process.env[`${prefix}_MODEL`];
  const baseURL = process.env[`${prefix}_BASE_URL`];

  if (requireApiKey && !apiKey) {
    throw new Error(`${prefix} API key is required: set ${prefix}_API_KEY`);
  }
  if (requireModel && !model) {
    throw new Error(`${prefix} model is required: set ${prefix}_MODEL`);
  }

  return {
    apiKey,
    model: model || "default-model",
    baseURL,
  };
}

/**
 * Parse basic provider configuration from environment variables
 * @param apiKeyEnvVar API key environment variable name
 * @param modelEnvVar Model environment variable name
 * @returns ProviderConfig
 * @throws Error if required variables are missing
 */
export function getBasicProviderConfig(apiKeyEnvVar: string, modelEnvVar: string): ProviderConfig {
  const apiKey = process.env[apiKeyEnvVar];
  const model = process.env[modelEnvVar];

  if (!apiKey) {
    throw new Error(`API key is required: set ${apiKeyEnvVar}`);
  }
  if (!model) {
    throw new Error(`Model is required: set ${modelEnvVar}`);
  }

  return {
    apiKey,
    model,
  };
}

/**
 * Parse local LLM configuration with sensible defaults
 * @returns OpenAICompatibleConfig with default values
 */
export function getLocalLLMConfig(): OpenAICompatibleConfig {
  const model = process.env.LOCAL_LLM_MODEL || "local-model";
  const baseURL = process.env.LOCAL_LLM_BASE_URL || "http://localhost:1234/v1";

  return {
    model,
    baseURL,
  };
}
