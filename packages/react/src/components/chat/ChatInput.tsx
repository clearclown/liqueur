/**
 * ChatInput Component
 * メッセージ入力欄
 */

import React, { useState, useRef, useEffect, type KeyboardEvent } from "react";

export interface ChatInputProps {
  /** メッセージ送信時のコールバック */
  onSend: (message: string) => void;
  /** 送信中かどうか */
  isLoading?: boolean;
  /** プレースホルダーテキスト */
  placeholder?: string;
  /** 無効化フラグ */
  disabled?: boolean;
  /** 最大文字数 */
  maxLength?: number;
}

/**
 * ChatInput - メッセージ入力欄コンポーネント
 */
export const ChatInput: React.FC<ChatInputProps> = ({
  onSend,
  isLoading = false,
  placeholder = "メッセージを入力...",
  disabled = false,
  maxLength = 5000,
}) => {
  const [message, setMessage] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // テキストエリアの高さを自動調整
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [message]);

  const handleSend = () => {
    const trimmedMessage = message.trim();
    if (!trimmedMessage || isLoading || disabled) return;

    onSend(trimmedMessage);
    setMessage("");

    // テキストエリアの高さをリセット
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    // Shift+Enterで改行、Enterで送信
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const isDisabled = disabled || isLoading;
  const isSendDisabled = isDisabled || !message.trim();

  return (
    <div className="chat-input-container" data-testid="chat-input-container">
      <div className="chat-input-wrapper">
        <textarea
          ref={textareaRef}
          data-testid="chat-input-textarea"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={isLoading ? "AI が応答中..." : placeholder}
          disabled={isDisabled}
          maxLength={maxLength}
          rows={1}
          className="chat-input-textarea"
          aria-label="メッセージ入力"
        />

        <div className="chat-input-actions">
          <span className="chat-input-counter" data-testid="chat-input-counter">
            {message.length}/{maxLength}
          </span>

          <button
            type="button"
            onClick={handleSend}
            disabled={isSendDisabled}
            className="chat-input-send-button"
            data-testid="chat-input-send-button"
            aria-label="メッセージ送信"
          >
            {isLoading ? (
              <span className="chat-input-loading">送信中...</span>
            ) : (
              <span>送信</span>
            )}
          </button>
        </div>
      </div>

      {/* ヒント */}
      <div className="chat-input-hint" data-testid="chat-input-hint">
        <span className="chat-input-hint-text">
          Enter で送信、Shift+Enter で改行
        </span>
      </div>
    </div>
  );
};
