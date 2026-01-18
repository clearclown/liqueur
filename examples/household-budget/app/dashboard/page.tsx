'use client';

import { useState } from 'react';
import { LiquidRenderer } from '@liqueur/react';
import type { LiquidViewSchema } from '@liqueur/protocol';

const samplePrompts = [
  '今月の支出を円グラフで',
  '月別の支出推移を折れ線グラフで',
  '今月の支出明細を表で',
  '食費と交通費を比較',
  'カテゴリ別支出ランキング',
];

export default function DashboardPage() {
  const [prompt, setPrompt] = useState('');
  const [schema, setSchema] = useState<LiquidViewSchema | null>(null);
  const [data, setData] = useState<Record<string, unknown[]>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveName, setSaveName] = useState('');
  const [showSaveDialog, setShowSaveDialog] = useState(false);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;

    setLoading(true);
    setError(null);
    setSchema(null);
    setData({});

    try {
      // 1. Generate schema from AI
      const genRes = await fetch('/api/liquid/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      });

      if (!genRes.ok) {
        const errorData = await genRes.json();
        throw new Error(errorData.error || 'Schema generation failed');
      }

      const { schema: newSchema } = await genRes.json();
      setSchema(newSchema);

      // 2. Execute data sources
      if (newSchema.data_sources && Object.keys(newSchema.data_sources).length > 0) {
        const dataRes = await fetch('/api/liquid/execute', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ dataSources: newSchema.data_sources }),
        });

        if (!dataRes.ok) {
          const errorData = await dataRes.json();
          throw new Error(errorData.error || 'Data fetch failed');
        }

        const { data: newData } = await dataRes.json();
        setData(newData);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!schema || !saveName.trim()) return;

    try {
      const res = await fetch('/api/liquid/artifacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: saveName, schema }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Save failed');
      }

      setShowSaveDialog(false);
      setSaveName('');
      alert('Dashboard saved successfully!');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Save failed');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !loading) {
      handleGenerate();
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold mb-4">ダッシュボード</h1>
        <p className="text-gray-600 mb-4">
          自然な言葉で家計を分析できます。下のボックスにリクエストを入力してください。
        </p>
      </div>

      {/* Prompt input */}
      <div className="card">
        <div className="flex gap-2">
          <input
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="例: 今月のカテゴリ別支出を円グラフで表示"
            className="input flex-1"
            disabled={loading}
          />
          <button
            onClick={handleGenerate}
            disabled={loading || !prompt.trim()}
            className="btn btn-primary whitespace-nowrap"
          >
            {loading ? '生成中...' : '生成'}
          </button>
        </div>

        {/* Sample prompts */}
        <div className="mt-4 flex flex-wrap gap-2">
          {samplePrompts.map((sample) => (
            <button
              key={sample}
              onClick={() => setPrompt(sample)}
              className="sample-chip"
              disabled={loading}
            >
              {sample}
            </button>
          ))}
        </div>
      </div>

      {/* Error display */}
      {error && (
        <div className="error-message">
          <strong>Error:</strong> {error}
        </div>
      )}

      {/* Loading state */}
      {loading && (
        <div className="card">
          <div className="flex items-center justify-center py-12">
            <div className="animate-pulse text-gray-500">
              AIがダッシュボードを生成中...
            </div>
          </div>
        </div>
      )}

      {/* Dashboard display */}
      {schema && !loading && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">生成されたダッシュボード</h2>
            <button
              onClick={() => setShowSaveDialog(true)}
              className="btn btn-secondary"
            >
              保存
            </button>
          </div>

          <div className="card">
            <LiquidRenderer
              schema={schema}
              data={data}
              loading={false}
            />
          </div>

          {/* Schema preview (collapsible) */}
          <details className="card">
            <summary className="cursor-pointer font-medium text-gray-700">
              生成されたスキーマを表示
            </summary>
            <pre className="mt-4 p-4 bg-gray-100 rounded-md overflow-x-auto text-sm">
              {JSON.stringify(schema, null, 2)}
            </pre>
          </details>
        </div>
      )}

      {/* Save dialog */}
      {showSaveDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">ダッシュボードを保存</h3>
            <input
              type="text"
              value={saveName}
              onChange={(e) => setSaveName(e.target.value)}
              placeholder="ダッシュボード名"
              className="input mb-4"
              autoFocus
            />
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setShowSaveDialog(false)}
                className="btn btn-secondary"
              >
                キャンセル
              </button>
              <button
                onClick={handleSave}
                disabled={!saveName.trim()}
                className="btn btn-primary"
              >
                保存
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
