/**
 * useConversation Hook
 * 会話全体の管理
 */

import { useState, useCallback } from "react";
import type { Message, Conversation } from "../types/chat";
import type { LiquidViewSchema } from "@liqueur/protocol";
import type { DatabaseMetadata } from "@liqueur/ai-provider";

export interface UseConversationOptions {
  /** 初期会話ID */
  conversationId?: string;
  /** データベースメタデータ */
  metadata: DatabaseMetadata;
  /** Generate API URL */
  generateApiUrl?: string;
  /** Follow-up API URL */
  followUpApiUrl?: string;
}

export interface UseConversationReturn {
  /** 会話データ */
  conversation: Conversation | null;
  /** メッセージリスト */
  messages: Message[];
  /** 現在のArtifact */
  currentArtifact: LiquidViewSchema | null;
  /** メッセージ送信 */
  sendMessage: (content: string) => Promise<void>;
  /** 再生成 */
  regenerate: () => Promise<void>;
  /** 会話をクリア */
  clear: () => void;
  /** ローディング中かどうか */
  isLoading: boolean;
  /** エラーメッセージ */
  error: string | null;
}

/**
 * useConversation - 会話全体を管理するhook
 */
export function useConversation(options: UseConversationOptions): UseConversationReturn {
  const {
    conversationId = `conv-${Date.now()}`,
    metadata,
    generateApiUrl = "/api/liquid/generate",
    followUpApiUrl = "/api/liquid/follow-up",
  } = options;

  const [conversation, setConversation] = useState<Conversation>({
    id: conversationId,
    messages: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * メッセージを送信
   */
  const sendMessage = useCallback(
    async (content: string) => {
      if (!content.trim() || isLoading) return;

      const userMessageId = `msg-${Date.now()}`;
      const userMessage: Message = {
        id: userMessageId,
        role: "user",
        content: content.trim(),
        timestamp: new Date(),
        status: "sent",
      };

      // ユーザーメッセージを追加
      setConversation((prev) => ({
        ...prev,
        messages: [...prev.messages, userMessage],
        updatedAt: new Date(),
      }));

      setIsLoading(true);
      setError(null);

      try {
        const isFollowUp = conversation.messages.length > 0 && conversation.currentArtifactId;
        const apiUrl = isFollowUp ? followUpApiUrl : generateApiUrl;

        // Follow-upかどうかでリクエストボディを変える
        const requestBody = isFollowUp
          ? {
              conversationId: conversation.id,
              message: content,
              currentSchema: conversation.messages
                .slice()
                .reverse()
                .find((m) => m.schema)?.schema,
              metadata,
            }
          : {
              prompt: content,
              metadata,
            };

        const response = await fetch(apiUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(requestBody),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error?.message || "Failed to generate schema");
        }

        const data = await response.json();
        const assistantMessageId = `msg-${Date.now()}-ai`;

        const assistantMessage: Message = {
          id: assistantMessageId,
          role: "assistant",
          content: isFollowUp
            ? "ダッシュボードを更新しました。"
            : "ダッシュボードを生成しました。",
          schema: data.schema,
          artifactId: data.artifactId,
          timestamp: new Date(),
          status: "sent",
        };

        setConversation((prev) => ({
          ...prev,
          messages: [...prev.messages, assistantMessage],
          currentArtifactId: data.artifactId,
          updatedAt: new Date(),
        }));
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Unknown error";
        setError(errorMessage);

        // エラーメッセージを追加
        const errorMessageId = `msg-${Date.now()}-error`;
        const errorMsg: Message = {
          id: errorMessageId,
          role: "assistant",
          content: "エラーが発生しました。",
          timestamp: new Date(),
          status: "error",
          error: errorMessage,
        };

        setConversation((prev) => ({
          ...prev,
          messages: [...prev.messages, errorMsg],
          updatedAt: new Date(),
        }));
      } finally {
        setIsLoading(false);
      }
    },
    [conversation, metadata, generateApiUrl, followUpApiUrl, isLoading]
  );

  /**
   * 最後のユーザーメッセージを再生成
   */
  const regenerate = useCallback(async () => {
    const lastUserMessage = conversation.messages
      .slice()
      .reverse()
      .find((m) => m.role === "user");

    if (!lastUserMessage) return;

    // 最後のAIメッセージを削除
    const messagesWithoutLastAI = conversation.messages.filter((m) => {
      const isLastAI = m.role === "assistant" && m.timestamp > lastUserMessage.timestamp;
      return !isLastAI;
    });

    setConversation((prev) => ({
      ...prev,
      messages: messagesWithoutLastAI,
    }));

    // 再送信
    await sendMessage(lastUserMessage.content);
  }, [conversation.messages, sendMessage]);

  /**
   * 会話をクリア
   */
  const clear = useCallback(() => {
    setConversation({
      id: `conv-${Date.now()}`,
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    setError(null);
  }, []);

  // 現在のArtifactを取得
  const currentArtifact =
    conversation.messages
      .slice()
      .reverse()
      .find((m) => m.schema)?.schema || null;

  return {
    conversation,
    messages: conversation.messages,
    currentArtifact,
    sendMessage,
    regenerate,
    clear,
    isLoading,
    error,
  };
}
