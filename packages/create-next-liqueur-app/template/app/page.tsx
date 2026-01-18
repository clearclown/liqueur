'use client';

import { useState } from 'react';
import { LiquidRenderer } from '@liqueur/react';
import type { LiquidViewSchema } from '@liqueur/protocol';

const defaultSchema: LiquidViewSchema = {
  version: '1.0',
  layout: { type: 'grid', columns: 2 },
  components: [
    {
      type: 'chart',
      chart_type: 'bar',
      title: 'Sample Chart',
      data_source: 'sample',
    },
  ],
  data_sources: {
    sample: {
      resource: 'data',
    },
  },
};

const sampleData = {
  sample: [
    { name: 'Jan', value: 100 },
    { name: 'Feb', value: 150 },
    { name: 'Mar', value: 120 },
    { name: 'Apr', value: 180 },
    { name: 'May', value: 200 },
  ],
};

export default function Home() {
  const [schema, setSchema] = useState<LiquidViewSchema>(defaultSchema);
  const [data, setData] = useState<Record<string, unknown[]>>(sampleData);
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/liquid/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      });

      const result = await response.json();

      if (result.valid && result.schema) {
        setSchema(result.schema);
      } else {
        setError(result.error || 'Failed to generate schema');
      }
    } catch (err) {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="container">
      <header className="header">
        <h1>Liqueur Dashboard</h1>
        <p>AI-driven dashboard generator</p>
      </header>

      <div className="layout">
        <section className="dashboard">
          <LiquidRenderer schema={schema} data={data} loading={loading} />
        </section>

        <aside className="chat">
          <form onSubmit={handleSubmit} className="chat-form">
            <input
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe your dashboard..."
              disabled={loading}
            />
            <button type="submit" disabled={loading || !prompt.trim()}>
              {loading ? 'Generating...' : 'Generate'}
            </button>
          </form>
          {error && <p className="error">{error}</p>}
          <div className="hint">
            <p>Try:</p>
            <ul>
              <li>"Show a pie chart"</li>
              <li>"Create a line chart"</li>
              <li>"Add a data table"</li>
            </ul>
          </div>
        </aside>
      </div>
    </main>
  );
}
