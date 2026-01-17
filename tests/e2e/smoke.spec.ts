/**
 * Smoke Tests - Project Liquid E2E
 * 基本的な動作確認テスト
 */

import { test, expect } from "@playwright/test";

test.describe("Smoke Tests", () => {
  test("should load homepage successfully", async ({ page }) => {
    await page.goto("/");

    // ページが読み込まれているか確認
    const body = page.locator("body");
    await expect(body).toBeVisible();
  });

  test("should load demo page successfully", async ({ page }) => {
    await page.goto("/demo");
    await page.waitForLoadState("networkidle");

    // デモページの主要要素が表示されることを確認
    await expect(page.locator(".demo-page")).toBeVisible();
    await expect(page.locator(".demo-header")).toBeVisible();
  });

  test("should respond within acceptable time", async ({ page }) => {
    const startTime = Date.now();

    await page.goto("/demo");
    await page.waitForLoadState("networkidle");

    const loadTime = Date.now() - startTime;

    // 5秒以内にロードされることを確認
    expect(loadTime).toBeLessThan(5000);
  });

  test("should not have critical JavaScript errors", async ({ page }) => {
    const criticalErrors: string[] = [];

    // 重大なエラーのみをキャプチャ
    page.on("pageerror", (error) => {
      // React開発時の警告や404は除外
      if (
        !error.message.includes("404") &&
        !error.message.includes("Warning:") &&
        !error.message.includes("Failed to load resource")
      ) {
        criticalErrors.push(error.message);
      }
    });

    await page.goto("/demo");
    await page.waitForLoadState("networkidle");

    // 重大なエラーがないことを確認
    expect(criticalErrors).toHaveLength(0);
  });
});

test.describe("Navigation Tests", () => {
  test("should navigate to demo page", async ({ page }) => {
    await page.goto("/");

    // デモページへ遷移
    await page.goto("/demo");
    await page.waitForLoadState("networkidle");

    // デモページが表示されることを確認
    await expect(page.locator(".demo-page")).toBeVisible();
  });

  test("should maintain state across page interactions", async ({ page }) => {
    await page.goto("/demo");
    await page.waitForLoadState("networkidle");

    const input = page.getByTestId("chat-input-textarea");

    // テキストを入力
    await input.fill("状態保持テスト");

    // 入力値が保持されていることを確認
    await expect(input).toHaveValue("状態保持テスト");
  });
});
