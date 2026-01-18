import { GoogleGenerativeAI } from "@google/generative-ai";
import type { ProviderConfig, DatabaseMetadata, StreamChunk } from "../types";
import { BaseAIProvider } from "./BaseAIProvider";

/**
 * Google Gemini Provider (Gemini 1.5 Flash, Gemini 1.5 Pro, etc.)
 * Official Google Generative AI API
 */
export class GeminiProvider extends BaseAIProvider {
  public readonly name = "gemini";
  private client: GoogleGenerativeAI;

  constructor(config: ProviderConfig) {
    super(config);
    this.client = new GoogleGenerativeAI(config.apiKey || "");
  }

  /**
   * Call Gemini API with prompt and system message
   */
  protected async callAPI(prompt: string, systemPrompt: string): Promise<string> {
    const model = this.client.getGenerativeModel({
      model: this.config.model,
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 4096,
        responseMimeType: "application/json",
      },
    });

    const result = await model.generateContent([{ text: systemPrompt }, { text: prompt }]);

    const response = result.response;
    return response.text();
  }

  /**
   * Get cost per input token based on model
   * Source: https://ai.google.dev/pricing
   */
  protected getCostPerInputToken(): number {
    // Gemini 2.0 Flash Experimental - Free
    if (this.config.model.includes("gemini-2.0-flash-exp")) {
      return 0;
    }
    // Gemini 1.5 Flash
    if (this.config.model.includes("gemini-1.5-flash")) {
      return 0.075 / 1_000_000; // $0.075 per MTok (≤128k tokens)
    }
    // Gemini 1.5 Pro
    if (this.config.model.includes("gemini-1.5-pro")) {
      return 1.25 / 1_000_000; // $1.25 per MTok (≤128k tokens)
    }
    // Default to Flash pricing
    return 0.075 / 1_000_000;
  }

  /**
   * Get cost per output token based on model
   */
  protected getCostPerOutputToken(): number {
    // Gemini 2.0 Flash Experimental - Free
    if (this.config.model.includes("gemini-2.0-flash-exp")) {
      return 0;
    }
    // Gemini 1.5 Flash
    if (this.config.model.includes("gemini-1.5-flash")) {
      return 0.3 / 1_000_000; // $0.30 per MTok
    }
    // Gemini 1.5 Pro
    if (this.config.model.includes("gemini-1.5-pro")) {
      return 5.0 / 1_000_000; // $5.00 per MTok
    }
    // Default to Flash pricing
    return 0.3 / 1_000_000;
  }

  /**
   * Check if streaming is supported
   */
  override supportsStreaming(): boolean {
    return true;
  }

  /**
   * Generate schema with streaming response
   * Uses Gemini's generateContentStream for real-time output
   */
  override async *generateSchemaStream(
    prompt: string,
    metadata: DatabaseMetadata
  ): AsyncGenerator<StreamChunk, void, unknown> {
    // Validation
    if (!prompt || prompt.trim() === "") {
      yield { type: "error", error: "Prompt cannot be empty" };
      return;
    }

    if (!metadata.tables || metadata.tables.length === 0) {
      yield { type: "error", error: "Database metadata cannot be empty" };
      return;
    }

    const systemPrompt = this.buildSystemPrompt(metadata);

    const model = this.client.getGenerativeModel({
      model: this.config.model,
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 4096,
        responseMimeType: "application/json",
      },
    });

    try {
      const streamResult = await model.generateContentStream([
        { text: systemPrompt },
        { text: prompt },
      ]);

      let fullText = "";

      // Stream text chunks
      for await (const chunk of streamResult.stream) {
        const chunkText = chunk.text();
        if (chunkText) {
          fullText += chunkText;
          yield { type: "text", content: chunkText };
        }
      }

      // Parse and validate the complete response
      try {
        const parsedSchema = JSON.parse(fullText);
        const validationResult = this.validateResponse(parsedSchema);

        if (!validationResult.valid) {
          const errorMessages = validationResult.errors
            .map((e) => e.message)
            .join(", ");
          yield { type: "error", error: `Invalid schema: ${errorMessages}` };
          return;
        }

        yield { type: "schema", schema: validationResult.schema! };
        yield { type: "done" };
      } catch (parseError) {
        yield {
          type: "error",
          error: `Failed to parse JSON: ${parseError instanceof Error ? parseError.message : "Unknown error"}`,
        };
      }
    } catch (error) {
      yield {
        type: "error",
        error: error instanceof Error ? error.message : "Streaming failed",
      };
    }
  }
}
