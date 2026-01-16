/**
 * Environment Configuration
 * .envファイルからAI Provider設定を読み込む
 */

import type { ProviderType, OpenAICompatibleConfig } from "../types";

/**
 * サポートされているAIプロバイダー
 */
export const SUPPORTED_PROVIDERS: ProviderType[] = [
  "anthropic",
  "gemini",
  "openai",
  "deepseek",
  "glm",
  "local",
  "mock",
];

/**
 * 環境変数からAIプロバイダータイプを取得
 */
export function getProviderFromEnv(): ProviderType {
  const provider = process.env.AI_PROVIDER;

  if (!provider) {
    // デフォルトはmock（テスト用）
    return "mock";
  }

  const normalized = provider.toLowerCase() as ProviderType;

  if (!SUPPORTED_PROVIDERS.includes(normalized)) {
    throw new Error(
      `Unsupported AI provider: ${provider}. Supported: ${SUPPORTED_PROVIDERS.join(", ")}`
    );
  }

  return normalized;
}

/**
 * DeepSeek設定を環境変数から取得
 */
export function getDeepSeekConfig(): OpenAICompatibleConfig {
  const apiKey = process.env.DEEPSEEK_API_KEY;

  if (!apiKey) {
    throw new Error("DEEPSEEK_API_KEY is required for DeepSeek provider");
  }

  return {
    baseURL: "https://api.deepseek.com/v1",
    apiKey,
    model: process.env.DEEPSEEK_MODEL || "deepseek-chat",
  };
}

/**
 * Anthropic設定を環境変数から取得
 */
export function getAnthropicConfig(): { apiKey: string; model: string } {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY is required for Anthropic provider");
  }

  return {
    apiKey,
    model: process.env.ANTHROPIC_MODEL || "claude-3-haiku-20240307",
  };
}

/**
 * Gemini設定を環境変数から取得
 */
export function getGeminiConfig(): { apiKey: string; model: string } {
  const apiKey = process.env.GOOGLE_API_KEY;

  if (!apiKey) {
    throw new Error("GOOGLE_API_KEY is required for Gemini provider");
  }

  return {
    apiKey,
    model: process.env.GEMINI_MODEL || "gemini-1.5-flash",
  };
}

/**
 * OpenAI設定を環境変数から取得
 */
export function getOpenAIConfig(): { apiKey: string; model: string } {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is required for OpenAI provider");
  }

  return {
    apiKey,
    model: process.env.OPENAI_MODEL || "gpt-4",
  };
}

/**
 * GLM設定を環境変数から取得
 */
export function getGLMConfig(): OpenAICompatibleConfig {
  const apiKey = process.env.GLM_API_KEY;

  if (!apiKey) {
    throw new Error("GLM_API_KEY is required for GLM provider");
  }

  return {
    baseURL: "https://open.bigmodel.cn/api/paas/v4",
    apiKey,
    model: process.env.GLM_MODEL || "glm-4",
  };
}

/**
 * Local LLM設定を環境変数から取得
 */
export function getLocalLLMConfig(): OpenAICompatibleConfig {
  const baseURL = process.env.LOCAL_LLM_BASE_URL || "http://localhost:1234/v1";
  const model = process.env.LOCAL_LLM_MODEL || "local-model";

  return {
    baseURL,
    apiKey: "not-needed", // Local LLMでは不要
    model,
  };
}

/**
 * コスト追跡設定
 */
export interface CostTrackingConfig {
  enabled: boolean;
  alertThreshold: number;
}

/**
 * コスト追跡設定を環境変数から取得
 */
export function getCostTrackingConfig(): CostTrackingConfig {
  const enabled = process.env.ENABLE_COST_TRACKING === "true";
  const alertThreshold = parseFloat(
    process.env.COST_ALERT_THRESHOLD || "10.0"
  );

  return {
    enabled,
    alertThreshold,
  };
}

/**
 * レート制限設定
 */
export interface RateLimitConfig {
  perMinute: number;
  perHour: number;
}

/**
 * レート制限設定を環境変数から取得
 */
export function getRateLimitConfig(): RateLimitConfig {
  const perMinute = parseInt(
    process.env.AI_REQUEST_LIMIT_PER_MINUTE || "10",
    10
  );
  const perHour = parseInt(
    process.env.AI_REQUEST_LIMIT_PER_HOUR || "100",
    10
  );

  return {
    perMinute,
    perHour,
  };
}

/**
 * 全体設定
 */
export interface AIConfig {
  provider: ProviderType;
  costTracking: CostTrackingConfig;
  rateLimit: RateLimitConfig;
  timeout: number;
  verboseLogging: boolean;
}

/**
 * 全体設定を環境変数から取得
 */
export function getAIConfig(): AIConfig {
  return {
    provider: getProviderFromEnv(),
    costTracking: getCostTrackingConfig(),
    rateLimit: getRateLimitConfig(),
    timeout: parseInt(process.env.AI_REQUEST_TIMEOUT || "30000", 10),
    verboseLogging: process.env.VERBOSE_AI_LOGGING === "true",
  };
}
