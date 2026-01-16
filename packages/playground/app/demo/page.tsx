/**
 * Demo Page - Phase 3統合デモ
 * AI生成とArtifact保存の統合フロー
 */

"use client";

import React, { useState } from "react";
import type { LiquidViewSchema } from "@liqueur/protocol";
import type { DatabaseMetadata } from "@liqueur/ai-provider";
import { LiquidRenderer } from "@liqueur/react";

/**
 * モックのデータベースメタデータ
 */
const mockMetadata: DatabaseMetadata = {
  tables: [
    {
      name: "expenses",
      description: "Expense transactions",
      columns: [
        { name: "id", type: "integer", nullable: false, isPrimaryKey: true, isForeignKey: false },
        { name: "category", type: "text", nullable: false, isPrimaryKey: false, isForeignKey: false },
        { name: "amount", type: "decimal", nullable: false, isPrimaryKey: false, isForeignKey: false },
        { name: "date", type: "date", nullable: false, isPrimaryKey: false, isForeignKey: false },
      ],
    },
  ],
};

export default function DemoPage() {
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [schema, setSchema] = useState<LiquidViewSchema | null>(null);
  const [artifactId, setArtifactId] = useState<string | null>(null);
  const [artifacts, setArtifacts] = useState<any[]>([]);

  /**
   * AI生成を実行
   */
  const handleGenerate = async () => {
    if (!prompt.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/liquid/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt,
          metadata: mockMetadata,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || "Failed to generate schema");
      }

      const data = await response.json();
      setSchema(data.schema);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
      setSchema(null);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Artifactとして保存
   */
  const handleSave = async () => {
    if (!schema) return;

    try {
      const response = await fetch("/api/liquid/artifacts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: prompt.substring(0, 50),
          schema,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to save artifact");
      }

      const data = await response.json();
      setArtifactId(data.artifact.id);
      alert(`Artifact saved! ID: ${data.artifact.id}`);
    } catch (err) {
      alert(`Save failed: ${err instanceof Error ? err.message : "Unknown error"}`);
    }
  };

  /**
   * Artifact一覧を取得
   */
  const handleLoadArtifacts = async () => {
    try {
      const response = await fetch("/api/liquid/artifacts");
      if (!response.ok) {
        throw new Error("Failed to load artifacts");
      }

      const data = await response.json();
      setArtifacts(data.artifacts);
    } catch (err) {
      alert(`Load failed: ${err instanceof Error ? err.message : "Unknown error"}`);
    }
  };

  /**
   * Artifactをロード
   */
  const handleLoadArtifact = async (id: string) => {
    try {
      const response = await fetch(`/api/liquid/artifacts/${id}`);
      if (!response.ok) {
        throw new Error("Failed to load artifact");
      }

      const data = await response.json();
      setSchema(data.artifact.schema);
      setArtifactId(id);
      setPrompt(data.artifact.name);
    } catch (err) {
      alert(`Load failed: ${err instanceof Error ? err.message : "Unknown error"}`);
    }
  };

  return (
    <div style={{ padding: "2rem", fontFamily: "system-ui, sans-serif" }}>
      <h1>Phase 3 Integration Demo</h1>

      {/* AI生成セクション */}
      <section style={{ marginBottom: "2rem", border: "1px solid #ccc", padding: "1rem" }}>
        <h2>1. AI Generation</h2>
        <div>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Enter your request (e.g., 'Show me my expenses')"
            rows={3}
            style={{ width: "100%", marginBottom: "0.5rem" }}
            disabled={loading}
          />
          <button onClick={handleGenerate} disabled={loading || !prompt.trim()}>
            {loading ? "Generating..." : "Generate Schema"}
          </button>
        </div>
        {error && (
          <div style={{ color: "red", marginTop: "0.5rem" }}>
            Error: {error}
          </div>
        )}
      </section>

      {/* スキーマ表示とArtifact保存 */}
      {schema && (
        <section style={{ marginBottom: "2rem", border: "1px solid #ccc", padding: "1rem" }}>
          <h2>2. Generated Schema</h2>
          <pre style={{ background: "#f5f5f5", padding: "1rem", overflow: "auto" }}>
            {JSON.stringify(schema, null, 2)}
          </pre>
          <button onClick={handleSave} style={{ marginTop: "0.5rem" }}>
            Save as Artifact
          </button>
          {artifactId && (
            <div style={{ color: "green", marginTop: "0.5rem" }}>
              Saved! Artifact ID: {artifactId}
            </div>
          )}
        </section>
      )}

      {/* Artifact一覧 */}
      <section style={{ marginBottom: "2rem", border: "1px solid #ccc", padding: "1rem" }}>
        <h2>3. Saved Artifacts</h2>
        <button onClick={handleLoadArtifacts}>Load Artifacts</button>
        {artifacts.length > 0 && (
          <ul style={{ marginTop: "1rem" }}>
            {artifacts.map((artifact) => (
              <li key={artifact.id} style={{ marginBottom: "0.5rem" }}>
                <strong>{artifact.name}</strong> (ID: {artifact.id})
                <button
                  onClick={() => handleLoadArtifact(artifact.id)}
                  style={{ marginLeft: "0.5rem" }}
                >
                  Load
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* LiquidViewレンダリング */}
      {schema && (
        <section style={{ marginBottom: "2rem", border: "1px solid #ccc", padding: "1rem" }}>
          <h2>4. LiquidView Rendering</h2>
          <LiquidRenderer schema={schema} />
        </section>
      )}
    </div>
  );
}
