/**
 * LiquidRenderer E2E Tests
 * デモページでのプレビュー表示テスト
 */

import { test, expect } from "@playwright/test";

test.describe("Preview Area - 基本表示", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/demo");
    await page.waitForLoadState("networkidle");
  });

  test("should display empty preview initially", async ({ page }) => {
    // 空のプレビュー状態が表示される
    const emptyPreview = page.locator(".demo-preview-empty");
    await expect(emptyPreview).toBeVisible();
    await expect(emptyPreview).toContainText("プレビューがありません");
  });

  test("should have preview header", async ({ page }) => {
    const previewHeader = page.locator(".demo-preview-header");
    await expect(previewHeader).toBeVisible();
    await expect(previewHeader).toContainText("Live Preview");
  });

  test("should display hint text in empty state", async ({ page }) => {
    const hint = page.locator(".demo-preview-hint");
    await expect(hint).toBeVisible();
    await expect(hint).toContainText("チャットでダッシュボードを生成");
  });
});

test.describe("Version Timeline - 基本表示", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/demo");
    await page.waitForLoadState("networkidle");
  });

  test("should display empty version timeline initially", async ({ page }) => {
    const emptyTimeline = page.getByTestId("version-timeline-empty");
    await expect(emptyTimeline).toBeVisible();
  });

  test("should display version timeline container", async ({ page }) => {
    const versionSection = page.locator(".demo-versions");
    await expect(versionSection).toBeVisible();
  });
});

test.describe("Layout - レスポンシブデザイン", () => {
  test("should display 3-column layout on desktop", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/demo");
    await page.waitForLoadState("networkidle");

    // 3カラムが全て表示される
    await expect(page.locator(".demo-sidebar--left")).toBeVisible();
    await expect(page.locator(".demo-chat")).toBeVisible();
    await expect(page.locator(".demo-sidebar--right")).toBeVisible();
  });

  test("should hide sidebars on mobile", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/demo");
    await page.waitForLoadState("networkidle");

    // チャットエリアのみ表示
    await expect(page.locator(".demo-chat")).toBeVisible();

    // サイドバーは非表示
    await expect(page.locator(".demo-sidebar--left")).toBeHidden();
  });

  test("should be scrollable on mobile", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/demo");
    await page.waitForLoadState("networkidle");

    // スクロールしても要素が表示される
    await page.evaluate(() => window.scrollTo(0, 100));
    await expect(page.locator(".demo-chat")).toBeVisible();
  });
});

test.describe("Conversation List - サイドバー", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/demo");
    await page.waitForLoadState("networkidle");
  });

  test("should display conversation list header", async ({ page }) => {
    const header = page.getByTestId("conversation-list-header");
    await expect(header).toBeVisible();
    await expect(header).toContainText("会話履歴");
  });

  test("should display new conversation button", async ({ page }) => {
    const newButton = page.getByTestId("conversation-list-new-button");
    await expect(newButton).toBeVisible();
    await expect(newButton).toBeEnabled();
  });

  test("should have empty state message", async ({ page }) => {
    const emptyState = page.getByTestId("conversation-list-empty");
    await expect(emptyState).toBeVisible();
    await expect(emptyState).toContainText("会話履歴がありません");
  });
});
