/**
 * TypingIndicator Component
 * AI入力中のアニメーション表示
 */

import React from "react";

export interface TypingIndicatorProps {
  /** カスタムメッセージ */
  message?: string;
  /** カスタムクラス名 */
  className?: string;
}

/**
 * TypingIndicator - AI入力中の表示
 */
export const TypingIndicator: React.FC<TypingIndicatorProps> = ({
  message = "AI is thinking...",
  className = "",
}) => {
  return (
    <div
      className={`typing-indicator ${className}`}
      data-testid="typing-indicator"
      role="status"
      aria-label={message}
    >
      <div className="typing-indicator-content">
        <div className="typing-indicator-avatar" data-testid="typing-indicator-avatar">
          🤖
        </div>
        <div className="typing-indicator-bubbles" data-testid="typing-indicator-bubbles">
          <div className="typing-indicator-bubble typing-indicator-bubble-1"></div>
          <div className="typing-indicator-bubble typing-indicator-bubble-2"></div>
          <div className="typing-indicator-bubble typing-indicator-bubble-3"></div>
        </div>
        <span className="typing-indicator-message">{message}</span>
      </div>
    </div>
  );
};
