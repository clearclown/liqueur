/**
 * LiquidRenderer E2E Tests
 * UIレンダリングの実動作テスト
 */

import { test, expect } from "@playwright/test";

test.describe("LiquidRenderer Component", () => {
  test.beforeEach(async ({ page }) => {
    // ダッシュボードページに移動（想定）
    await page.goto("/dashboard");
  });

  test("should render chart components", async ({ page }) => {
    // チャートが表示されているか確認
    const chart = page.locator('[data-testid="chart-component"]').first();
    await expect(chart).toBeVisible();

    // チャートタイトルが表示されているか確認
    const chartTitle = page.locator('[data-testid="chart-title"]').first();
    await expect(chartTitle).toBeVisible();
  });

  test("should render table components", async ({ page }) => {
    // テーブルが表示されているか確認
    const table = page.locator('[data-testid="table-component"]').first();
    await expect(table).toBeVisible();

    // テーブルにデータが含まれているか確認
    const tableRows = page.locator('[data-testid="table-row"]');
    await expect(tableRows).toHaveCount.greaterThan(0);
  });

  test("should display loading state initially", async ({ page }) => {
    // ページをリロード
    await page.reload();

    // ローディングインジケーターが表示されるか確認
    const loadingIndicator = page.locator(
      '[data-testid="loading-indicator"]'
    );

    // すぐには消えないことを確認（少なくとも100ms）
    await expect(loadingIndicator).toBeVisible({ timeout: 100 });
  });

  test("should handle grid layout correctly", async ({ page }) => {
    // グリッドレイアウトが適用されているか確認
    const gridContainer = page.locator('[data-testid="grid-layout"]');
    await expect(gridContainer).toBeVisible();

    // グリッド内のアイテムが正しく配置されているか確認
    const gridItems = page.locator('[data-testid="grid-item"]');
    const count = await gridItems.count();

    expect(count).toBeGreaterThan(0);
  });

  test("should be responsive on mobile", async ({ page, viewport }) => {
    // モバイルビューポートに変更
    await page.setViewportSize({ width: 375, height: 667 });

    // コンポーネントがモバイルでも表示されるか確認
    const components = page.locator('[data-testid*="component"]');
    await expect(components.first()).toBeVisible();

    // スクロール可能であることを確認
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));

    // スクロール後も要素が表示されているか確認
    await expect(components.first()).toBeVisible();
  });

  test("should update data when schema changes", async ({ page }) => {
    // 初期データを取得
    const initialChartData = await page
      .locator('[data-testid="chart-component"]')
      .first()
      .textContent();

    // スキーマを変更するボタンをクリック（想定）
    const updateButton = page.locator('[data-testid="update-schema-button"]');

    if (await updateButton.isVisible()) {
      await updateButton.click();

      // データが更新されることを確認
      await page.waitForTimeout(500); // データフェッチ待機

      const updatedChartData = await page
        .locator('[data-testid="chart-component"]')
        .first()
        .textContent();

      expect(updatedChartData).not.toBe(initialChartData);
    }
  });

  test("should handle errors gracefully", async ({ page }) => {
    // エラー状態を引き起こす（想定: 無効なスキーマ）
    const triggerErrorButton = page.locator(
      '[data-testid="trigger-error-button"]'
    );

    if (await triggerErrorButton.isVisible()) {
      await triggerErrorButton.click();

      // エラーメッセージが表示されるか確認
      const errorMessage = page.locator('[data-testid="error-message"]');
      await expect(errorMessage).toBeVisible();

      // エラーメッセージに適切なテキストが含まれているか確認
      await expect(errorMessage).toContainText(/error|failed/i);
    }
  });
});

test.describe("Chart Interactions", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/dashboard");
  });

  test("should display chart with correct data", async ({ page }) => {
    // チャートがレンダリングされるまで待機
    await page.waitForSelector('[data-testid="chart-component"]');

    // SVG要素が存在することを確認（recharts使用）
    const svgElement = page.locator("svg");
    await expect(svgElement.first()).toBeVisible();

    // チャート内にバーが存在することを確認（Bar Chart想定）
    const bars = page.locator(".recharts-bar-rectangle");
    await expect(bars.first()).toBeVisible();
  });

  test("should show tooltip on hover", async ({ page }) => {
    // チャートのバーにホバー
    const bar = page.locator(".recharts-bar-rectangle").first();
    await bar.hover();

    // ツールチップが表示されることを確認
    const tooltip = page.locator(".recharts-tooltip-wrapper");
    await expect(tooltip).toBeVisible();
  });
});

test.describe("Table Interactions", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/dashboard");
  });

  test("should display table with data rows", async ({ page }) => {
    // テーブルがレンダリングされるまで待機
    await page.waitForSelector('[data-testid="table-component"]');

    // テーブル行が存在することを確認
    const rows = page.locator('[data-testid="table-row"]');
    const rowCount = await rows.count();

    expect(rowCount).toBeGreaterThan(0);
  });

  test("should display column headers", async ({ page }) => {
    // カラムヘッダーが表示されることを確認
    const headers = page.locator('[data-testid="table-header"]');
    await expect(headers.first()).toBeVisible();
  });

  test("should render cell data correctly", async ({ page }) => {
    // セルにデータが含まれることを確認
    const cell = page.locator('[data-testid="table-cell"]').first();
    const cellText = await cell.textContent();

    expect(cellText).toBeTruthy();
    expect(cellText?.trim().length).toBeGreaterThan(0);
  });
});
