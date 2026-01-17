/**
 * Demo Page E2E Tests - Phase 3/4 統合テスト
 * 3カラムレイアウト、チャットUI、バージョン管理
 */

import { test, expect } from "@playwright/test";

test.describe("Demo Page - 3カラムレイアウト", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/demo");
    await page.waitForLoadState("networkidle");
  });

  test("should display 3-column layout on desktop", async ({ page }) => {
    // デモページがロードされることを確認
    await expect(page.locator(".demo-page")).toBeVisible();

    // ヘッダーが表示されることを確認
    await expect(page.locator(".demo-header")).toBeVisible();
    await expect(page.locator(".demo-title")).toContainText("Project Liquid");

    // 3カラムが表示されることを確認
    await expect(page.locator(".demo-sidebar--left")).toBeVisible();
    await expect(page.locator(".demo-chat")).toBeVisible();
    await expect(page.locator(".demo-sidebar--right")).toBeVisible();
  });

  test("should display conversation list", async ({ page }) => {
    // 会話一覧が表示されることを確認
    await expect(page.getByTestId("conversation-list")).toBeVisible();
    await expect(page.getByTestId("conversation-list-header")).toBeVisible();

    // 新規ボタンが表示されることを確認
    await expect(page.getByTestId("conversation-list-new-button")).toBeVisible();

    // 空の状態が表示されることを確認（初期状態）
    await expect(page.getByTestId("conversation-list-empty")).toBeVisible();
  });

  test("should display chat container", async ({ page }) => {
    // チャットコンテナが表示されることを確認
    await expect(page.getByTestId("chat-container")).toBeVisible();
    await expect(page.getByTestId("chat-header")).toBeVisible();

    // 空状態のメッセージリストが表示されることを確認
    await expect(page.getByTestId("message-list-empty")).toBeVisible();

    // 入力欄が表示されることを確認
    await expect(page.getByTestId("chat-input-container")).toBeVisible();
  });

  test("should display preview area", async ({ page }) => {
    // プレビューエリアが表示されることを確認
    await expect(page.locator(".demo-preview")).toBeVisible();
    await expect(page.locator(".demo-preview-header")).toBeVisible();

    // 空の状態が表示されることを確認
    await expect(page.locator(".demo-preview-empty")).toBeVisible();
  });
});

test.describe("Demo Page - チャット機能", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/demo");
    await page.waitForLoadState("networkidle");
  });

  test("should be able to type in chat input", async ({ page }) => {
    const input = page.getByTestId("chat-input-textarea");

    await input.fill("月別の支出をグラフで表示して");
    await expect(input).toHaveValue("月別の支出をグラフで表示して");
  });

  test("should have send button", async ({ page }) => {
    const sendButton = page.getByTestId("chat-input-send-button");
    await expect(sendButton).toBeVisible();
  });

  test("should have disabled send button when input is empty", async ({
    page,
  }) => {
    const sendButton = page.getByTestId("chat-input-send-button");
    await expect(sendButton).toBeDisabled();
  });
});

test.describe("Demo Page - 会話管理", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/demo");
    await page.waitForLoadState("networkidle");
  });

  test("should be able to start new conversation", async ({ page }) => {
    const newButton = page.getByTestId("conversation-list-new-button");

    await expect(newButton).toBeVisible();
    await expect(newButton).toBeEnabled();

    // 新規ボタンをクリック
    await newButton.click();

    // 入力欄がフォーカスされることを確認（UX改善の余地）
    // 現時点では空状態が表示されることを確認
    await expect(page.getByTestId("message-list-empty")).toBeVisible();
  });
});

test.describe("Demo Page - バージョン管理", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/demo");
    await page.waitForLoadState("networkidle");
  });

  test("should display version timeline area", async ({ page }) => {
    // バージョンエリアが表示されることを確認
    await expect(page.locator(".demo-versions")).toBeVisible();

    // 初期状態では空
    await expect(page.getByTestId("version-timeline-empty")).toBeVisible();
  });
});

test.describe("Demo Page - レスポンシブデザイン", () => {
  test("should show chat only on mobile", async ({ page }) => {
    // モバイルビューポートに設定
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/demo");
    await page.waitForLoadState("networkidle");

    // チャットエリアが表示されることを確認
    await expect(page.locator(".demo-chat")).toBeVisible();

    // サイドバーが非表示になることを確認（レスポンシブCSS）
    // 注: 現在の実装ではdisplay:noneで非表示になる
    const leftSidebar = page.locator(".demo-sidebar--left");
    await expect(leftSidebar).toBeHidden();
  });
});

test.describe("Demo Page - アクセシビリティ", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/demo");
    await page.waitForLoadState("networkidle");
  });

  test("should have proper ARIA attributes", async ({ page }) => {
    // 会話一覧の新規ボタンにaria-labelがあることを確認
    const newButton = page.getByTestId("conversation-list-new-button");
    await expect(newButton).toHaveAttribute("aria-label", "新しい会話を開始");
  });

  test("should be keyboard navigable", async ({ page }) => {
    // 新規ボタンにフォーカスできることを確認
    const newButton = page.getByTestId("conversation-list-new-button");
    await newButton.focus();
    await expect(newButton).toBeFocused();

    // Enterキーでアクションが実行できることを確認
    await page.keyboard.press("Enter");
  });
});
