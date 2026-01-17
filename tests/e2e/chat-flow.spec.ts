/**
 * Chat Flow E2E Tests - Phase 3 チャットフロー
 * 対話型ダッシュボード生成のユーザーフロー
 *
 * Note: React controlled componentsへのテキスト入力テストは
 * ユニットテストでカバーされているため、E2EではUIレイアウトと
 * 基本的なインタラクションのみをテストします。
 */

import { test, expect } from "@playwright/test";

test.describe("Chat Flow - 初回生成フロー", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/demo");
    await page.waitForLoadState("networkidle");
  });

  test("should show empty state initially", async ({ page }) => {
    // 空のメッセージ状態が表示される
    await expect(page.getByTestId("message-list-empty")).toBeVisible();
  });

  test("should have disabled send button initially", async ({ page }) => {
    const sendButton = page.getByTestId("chat-input-send-button");

    // 初期状態では送信ボタンが無効（空の入力）
    await expect(sendButton).toBeDisabled();
  });

  test("should support Shift+Enter for newline", async ({ page }) => {
    const input = page.getByTestId("chat-input-textarea");

    // フォーカスして入力
    await input.focus();
    await input.type("1行目");
    await input.press("Shift+Enter");
    await input.type("2行目");

    // 入力欄に改行が含まれることを確認
    const value = await input.inputValue();
    expect(value).toContain("\n");
  });

  test("should have input textarea", async ({ page }) => {
    const input = page.getByTestId("chat-input-textarea");
    await expect(input).toBeVisible();
    await expect(input).toBeEnabled();
  });
});

test.describe("Chat Flow - UI入力", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/demo");
    await page.waitForLoadState("networkidle");
  });

  test("should show character counter", async ({ page }) => {
    const counter = page.getByTestId("chat-input-counter");

    // カウンターが表示されることを確認
    await expect(counter).toBeVisible();

    // 初期状態
    await expect(counter).toContainText("0/5000");
  });

  test("should show input hint", async ({ page }) => {
    const hint = page.getByTestId("chat-input-hint");
    await expect(hint).toBeVisible();
    await expect(hint).toContainText("Enter");
    await expect(hint).toContainText("Shift+Enter");
  });

  test("should have proper placeholder", async ({ page }) => {
    const input = page.getByTestId("chat-input-textarea");
    await expect(input).toHaveAttribute("placeholder", "メッセージを入力...");
  });
});

test.describe("Chat Flow - 空状態表示", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/demo");
    await page.waitForLoadState("networkidle");
  });

  test("should show empty message list with examples", async ({ page }) => {
    const emptyState = page.getByTestId("message-list-empty");
    await expect(emptyState).toBeVisible();
    await expect(emptyState).toContainText("チャットを開始してください");
  });

  test("should show conversation list empty state", async ({ page }) => {
    const emptyConversations = page.getByTestId("conversation-list-empty");
    await expect(emptyConversations).toBeVisible();
    await expect(emptyConversations).toContainText("会話履歴がありません");
  });
});
