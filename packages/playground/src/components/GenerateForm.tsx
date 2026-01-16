/**
 * AI Generation Form Component
 * ユーザープロンプトを受け付けてAI生成をトリガーするフォーム
 */

"use client";

import React, { useState, useEffect } from "react";
import type { DatabaseMetadata } from "@liqueur/protocol";

/**
 * GenerateForm Props
 */
export interface GenerateFormProps {
  /** Database metadata for context */
  metadata: DatabaseMetadata;

  /** Callback when generation is triggered */
  onGenerate: (prompt: string, metadata: DatabaseMetadata) => void;

  /** Loading state */
  loading?: boolean;

  /** Error message */
  error?: string | null;

  /** Success flag to clear form */
  success?: boolean;
}

/**
 * GenerateForm Component
 * AI生成リクエストフォーム
 */
export default function GenerateForm({
  metadata,
  onGenerate,
  loading = false,
  error = null,
  success = false,
}: GenerateFormProps) {
  const [prompt, setPrompt] = useState("");

  // 生成成功時にプロンプトをクリア
  useEffect(() => {
    if (success) {
      setPrompt("");
    }
  }, [success]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (prompt.trim()) {
      onGenerate(prompt, metadata);
    }
  };

  const isDisabled = !prompt.trim() || loading;

  return (
    <form onSubmit={handleSubmit} className="generate-form">
      {/* Error Alert */}
      {error && (
        <div role="alert" className="error-message">
          {error}
        </div>
      )}

      {/* Prompt Input */}
      <div className="form-field">
        <label htmlFor="prompt" className="form-label">
          Prompt
        </label>
        <textarea
          id="prompt"
          placeholder="Enter your request (e.g., 'Show me monthly expenses')"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          disabled={loading}
          rows={3}
          className="form-textarea"
        />
      </div>

      {/* Database Metadata Section */}
      <div className="metadata-section">
        <h3>Available Tables</h3>
        <ul>
          {metadata.tables.map((table) => (
            <li key={table.name}>
              <strong>{table.name}</strong>
              {table.description && ` - ${table.description}`}
            </li>
          ))}
        </ul>
      </div>

      {/* Submit Button */}
      <button type="submit" disabled={isDisabled} className="submit-button">
        {loading ? "Generating..." : "Generate"}
      </button>
    </form>
  );
}
