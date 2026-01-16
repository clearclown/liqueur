/**
 * Smoke Tests - Project Liquid E2E
 * 基本的な動作確認テスト
 */

import { test, expect } from "@playwright/test";

test.describe("Smoke Tests", () => {
  test("should load homepage successfully", async ({ page }) => {
    await page.goto("/");

    // ページタイトルを確認
    await expect(page).toHaveTitle(/Project Liquid/i);

    // ページが読み込まれているか確認
    const body = page.locator("body");
    await expect(body).toBeVisible();
  });

  test("should have no console errors on page load", async ({ page }) => {
    const errors: string[] = [];

    // コンソールエラーをキャプチャ
    page.on("console", (msg) => {
      if (msg.type() === "error") {
        errors.push(msg.text());
      }
    });

    await page.goto("/");

    // 少し待機（非同期エラーをキャプチャ）
    await page.waitForTimeout(1000);

    // エラーがないことを確認
    expect(errors).toHaveLength(0);
  });

  test("should respond within acceptable time", async ({ page }) => {
    const startTime = Date.now();

    await page.goto("/");
    await page.waitForLoadState("networkidle");

    const loadTime = Date.now() - startTime;

    // 3秒以内にロードされることを確認
    expect(loadTime).toBeLessThan(3000);
  });
});
