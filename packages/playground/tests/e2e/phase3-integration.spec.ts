/**
 * Phase 3 Integration E2E Tests
 * AI生成とArtifact保存の統合フローのE2Eテスト
 */

import { test, expect } from "@playwright/test";

test.describe("Phase 3 Integration Flow", () => {
  test.beforeEach(async ({ page }) => {
    // デモページにアクセス
    await page.goto("http://localhost:3000/demo");
  });

  test("TC-E2E-001: Complete flow - Generate, Save, and Load", async ({ page }) => {
    // 1. AI生成
    await page.fill('textarea[placeholder*="Enter your request"]', "Show me my expenses");
    await page.click('button:has-text("Generate Schema")');

    // 生成完了まで待機
    await expect(page.locator("h2:has-text('Generated Schema')")).toBeVisible({
      timeout: 10000,
    });

    // 2. Artifactとして保存
    await page.click('button:has-text("Save as Artifact")');

    // 保存完了メッセージを確認
    await expect(page.locator('text=Saved! Artifact ID:')).toBeVisible();

    // 3. Artifact一覧をロード
    await page.click('button:has-text("Load Artifacts")');

    // Artifact一覧が表示されることを確認
    await expect(page.locator("ul li")).toHaveCount(1, { timeout: 5000 });

    // 4. Artifactをロード
    await page.click('button:has-text("Load")').first();

    // スキーマが表示されることを確認
    await expect(page.locator("h2:has-text('Generated Schema')")).toBeVisible();
    await expect(page.locator("pre")).toContainText("version");
  });

  test("TC-E2E-002: Generate schema with AI", async ({ page }) => {
    // プロンプト入力
    await page.fill('textarea[placeholder*="Enter your request"]', "Show me monthly sales");

    // 生成ボタンクリック
    await page.click('button:has-text("Generate Schema")');

    // ローディング状態を確認
    await expect(page.locator('button:has-text("Generating...")')).toBeVisible();

    // 生成完了を確認
    await expect(page.locator("h2:has-text('Generated Schema')")).toBeVisible({
      timeout: 10000,
    });

    // スキーマJSONが表示されることを確認
    const schemaText = await page.locator("pre").textContent();
    expect(schemaText).toContain("version");
    expect(schemaText).toContain("components");
    expect(schemaText).toContain("data_sources");
  });

  test("TC-E2E-003: Save and retrieve artifact", async ({ page }) => {
    // AI生成
    await page.fill('textarea[placeholder*="Enter your request"]', "Show me expenses by category");
    await page.click('button:has-text("Generate Schema")');
    await expect(page.locator("h2:has-text('Generated Schema')")).toBeVisible({
      timeout: 10000,
    });

    // 保存
    await page.click('button:has-text("Save as Artifact")');
    await expect(page.locator('text=Saved! Artifact ID:')).toBeVisible();

    // Artifact IDを取得
    const artifactIdText = await page.locator('text=Saved! Artifact ID:').textContent();
    const artifactId = artifactIdText?.match(/ID: ([\w-]+)/)?.[1];
    expect(artifactId).toBeTruthy();

    // Artifact一覧をロード
    await page.click('button:has-text("Load Artifacts")');

    // 保存したArtifactが一覧に存在することを確認
    await expect(page.locator(`text=${artifactId}`)).toBeVisible();
  });

  test("TC-E2E-004: Validate button states", async ({ page }) => {
    // 初期状態: プロンプトが空の場合、生成ボタンは無効
    await expect(page.locator('button:has-text("Generate Schema")')).toBeDisabled();

    // プロンプト入力後: 生成ボタンが有効になる
    await page.fill('textarea[placeholder*="Enter your request"]', "Show me data");
    await expect(page.locator('button:has-text("Generate Schema")')).toBeEnabled();

    // 生成中: ボタンが無効になり、テキストが変わる
    await page.click('button:has-text("Generate Schema")');
    await expect(page.locator('button:has-text("Generating...")')).toBeVisible();
    await expect(page.locator('button:has-text("Generating...")')).toBeDisabled();
  });

  test("TC-E2E-005: Render LiquidView", async ({ page }) => {
    // AI生成
    await page.fill('textarea[placeholder*="Enter your request"]', "Show me expenses");
    await page.click('button:has-text("Generate Schema")');
    await expect(page.locator("h2:has-text('Generated Schema')")).toBeVisible({
      timeout: 10000,
    });

    // LiquidViewレンダリングセクションが表示されることを確認
    await expect(page.locator("h2:has-text('LiquidView Rendering')")).toBeVisible();
  });
});
