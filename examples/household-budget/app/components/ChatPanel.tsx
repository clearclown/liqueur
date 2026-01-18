'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useDashboard } from '../contexts/DashboardContext';
import type { LiquidViewSchema } from '@liqueur/protocol';
import type { StreamChunk } from '@liqueur/ai-provider';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  schema?: LiquidViewSchema;
  timestamp: Date;
  isStreaming?: boolean;
}

const samplePrompts = [
  '円グラフに変更して',
  '棒グラフで比較して',
  '今月の食費だけ見せて',
  '日付順に並べ替え',
];

/**
 * チャットパネル
 * AI会話を通じてダッシュボードを編集
 * ストリーミング対応でリアルタイム表示
 */
export function ChatPanel() {
  const { schema, setSchema, loading: dashboardLoading } = useDashboard();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '0',
      role: 'assistant',
      content: 'こんにちは！ダッシュボードの編集をお手伝いします。どのように変更しますか？例：「今月の支出を円グラフで見せて」',
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [streamingText, setStreamingText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, streamingText]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
    };
  }, []);

  const handleStreamingSubmit = useCallback(async (prompt: string) => {
    setIsLoading(true);
    setStreamingText('');

    // Add streaming message placeholder
    const streamingMessageId = (Date.now() + 1).toString();
    setMessages((prev) => [...prev, {
      id: streamingMessageId,
      role: 'assistant',
      content: '',
      timestamp: new Date(),
      isStreaming: true,
    }]);

    abortControllerRef.current = new AbortController();

    try {
      const response = await fetch('/api/liquid/generate/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, currentSchema: schema }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'スキーマの生成に失敗しました');
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('ストリームの取得に失敗しました');
      }

      const decoder = new TextDecoder();
      let accumulatedText = '';
      let finalSchema: LiquidViewSchema | undefined;
      let reading = true;

      while (reading) {
        const { done, value } = await reader.read();
        if (done) {
          reading = false;
          continue;
        }

        const text = decoder.decode(value, { stream: true });
        const lines = text.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const chunk: StreamChunk = JSON.parse(line.slice(6));

              switch (chunk.type) {
                case 'text':
                  accumulatedText += chunk.content || '';
                  setStreamingText(accumulatedText);
                  break;
                case 'schema':
                  finalSchema = chunk.schema;
                  break;
                case 'done':
                  // Update message with final content
                  setMessages((prev) =>
                    prev.map((msg) =>
                      msg.id === streamingMessageId
                        ? {
                            ...msg,
                            content: 'ダッシュボードを更新しました！',
                            schema: finalSchema,
                            isStreaming: false,
                          }
                        : msg
                    )
                  );
                  if (finalSchema) {
                    setSchema(finalSchema);
                  }
                  break;
                case 'error':
                  throw new Error(chunk.error || '不明なエラー');
              }
            } catch (parseError) {
              // Ignore parse errors for incomplete chunks
              if (parseError instanceof SyntaxError) continue;
              throw parseError;
            }
          }
        }
      }
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        // User cancelled
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === (Date.now() + 1).toString()
              ? { ...msg, content: 'キャンセルされました', isStreaming: false }
              : msg
          )
        );
      } else {
        // Error occurred
        setMessages((prev) =>
          prev.map((msg) =>
            msg.isStreaming
              ? {
                  ...msg,
                  content: `エラーが発生しました: ${err instanceof Error ? err.message : '不明なエラー'}`,
                  isStreaming: false,
                }
              : msg
          )
        );
      }
    } finally {
      setIsLoading(false);
      setStreamingText('');
      abortControllerRef.current = null;
    }
  }, [setSchema]);

  const handleFallbackSubmit = useCallback(async (prompt: string) => {
    setIsLoading(true);

    try {
      const res = await fetch('/api/liquid/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'スキーマの生成に失敗しました');
      }

      const { schema } = await res.json();

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'ダッシュボードを更新しました！',
        schema,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
      setSchema(schema);
    } catch (err) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `エラーが発生しました: ${err instanceof Error ? err.message : '不明なエラー'}`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  }, [setSchema]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    const prompt = input.trim();
    setInput('');

    // Try streaming first, fallback to non-streaming
    try {
      await handleStreamingSubmit(prompt);
    } catch {
      // If streaming fails (e.g., 501 Not Supported), fallback
      await handleFallbackSubmit(prompt);
    }
  };

  const handleCancel = () => {
    abortControllerRef.current?.abort();
  };

  const handleSampleClick = (sample: string) => {
    setInput(sample);
  };

  return (
    <div className="chat-panel">
      <div className="chat-header">
        <h3 className="text-lg font-semibold">AI アシスタント</h3>
        {isLoading && (
          <span className="text-xs text-blue-500 animate-pulse ml-2">
            ストリーミング中...
          </span>
        )}
      </div>

      <div className="chat-messages">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`chat-message ${message.role === 'user' ? 'chat-message-user' : 'chat-message-assistant'}`}
          >
            <div className="chat-message-content">
              {message.isStreaming ? (
                <div>
                  <span className="text-gray-400">生成中: </span>
                  <span className="font-mono text-xs break-all">
                    {streamingText.slice(-100)}
                    {streamingText.length > 100 && '...'}
                  </span>
                  <span className="animate-pulse">▌</span>
                </div>
              ) : (
                message.content
              )}
            </div>
            {message.schema && !message.isStreaming && (
              <details className="mt-2 text-xs">
                <summary className="cursor-pointer text-gray-500 hover:text-gray-700">
                  生成されたスキーマ
                </summary>
                <pre className="mt-1 p-2 bg-gray-50 rounded text-xs overflow-x-auto max-h-32">
                  {JSON.stringify(message.schema, null, 2)}
                </pre>
              </details>
            )}
            {!message.isStreaming && (
              <div className="chat-message-time">
                {message.timestamp.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })}
              </div>
            )}
          </div>
        ))}

        <div ref={messagesEndRef} />
      </div>

      {/* サンプルプロンプト */}
      <div className="chat-samples">
        {samplePrompts.map((sample) => (
          <button
            key={sample}
            onClick={() => handleSampleClick(sample)}
            className="chat-sample-chip"
            disabled={isLoading || dashboardLoading}
          >
            {sample}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="chat-input-form">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="ダッシュボードを編集..."
          className="chat-input"
          disabled={isLoading || dashboardLoading}
        />
        {isLoading ? (
          <button
            type="button"
            onClick={handleCancel}
            className="chat-submit-btn bg-red-500 hover:bg-red-600"
            title="キャンセル"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        ) : (
          <button
            type="submit"
            disabled={!input.trim() || dashboardLoading}
            className="chat-submit-btn"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        )}
      </form>
    </div>
  );
}
