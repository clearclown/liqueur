import Anthropic from "@anthropic-ai/sdk";
import type { ProviderConfig } from "../types";
import { BaseAIProvider } from "./BaseAIProvider";

/**
 * Anthropic Provider (Claude 3 family)
 * Official Anthropic API
 */
export class AnthropicProvider extends BaseAIProvider {
  public readonly name = "anthropic";
  private client: Anthropic;

  constructor(config: ProviderConfig) {
    super(config);
    this.client = new Anthropic({
      apiKey: config.apiKey || "",
      timeout: config.timeout || 30000,
      maxRetries: config.maxRetries || 3,
    });
  }

  /**
   * Call Anthropic API with prompt and system message
   */
  protected async callAPI(prompt: string, systemPrompt: string): Promise<string> {
    const response = await this.client.messages.create({
      model: this.config.model,
      max_tokens: 4096,
      temperature: 0.7,
      system: systemPrompt,
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    // Extract text content
    const content = response.content[0];
    if (content.type !== "text") {
      throw new Error("Unexpected response type from Anthropic API");
    }

    return content.text;
  }

  /**
   * Get cost per input token based on model
   * Source: https://www.anthropic.com/pricing
   */
  protected getCostPerInputToken(): number {
    if (this.config.model.includes("claude-3-5-sonnet")) {
      return 3.0 / 1_000_000; // $3.00 per MTok
    }
    if (this.config.model.includes("claude-3-5-haiku")) {
      return 1.0 / 1_000_000; // $1.00 per MTok
    }
    if (this.config.model.includes("claude-3-haiku")) {
      return 0.25 / 1_000_000; // $0.25 per MTok
    }
    if (this.config.model.includes("claude-3-sonnet")) {
      return 3.0 / 1_000_000; // $3.00 per MTok
    }
    if (this.config.model.includes("claude-3-opus")) {
      return 15.0 / 1_000_000; // $15.00 per MTok
    }
    return 0.25 / 1_000_000; // default to Haiku
  }

  /**
   * Get cost per output token based on model
   */
  protected getCostPerOutputToken(): number {
    if (this.config.model.includes("claude-3-5-sonnet")) {
      return 15.0 / 1_000_000; // $15.00 per MTok
    }
    if (this.config.model.includes("claude-3-5-haiku")) {
      return 5.0 / 1_000_000; // $5.00 per MTok
    }
    if (this.config.model.includes("claude-3-haiku")) {
      return 1.25 / 1_000_000; // $1.25 per MTok
    }
    if (this.config.model.includes("claude-3-sonnet")) {
      return 15.0 / 1_000_000; // $15.00 per MTok
    }
    if (this.config.model.includes("claude-3-opus")) {
      return 75.0 / 1_000_000; // $75.00 per MTok
    }
    return 1.25 / 1_000_000; // default to Haiku
  }
}
