import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright E2E Test Configuration
 * Project Liquid - End-to-End Testing
 */
export default defineConfig({
  testDir: "./tests/e2e",

  // 並列実行設定
  fullyParallel: true,

  // CI環境でのリトライ設定
  retries: process.env.CI ? 2 : 0,

  // 並列ワーカー数
  workers: process.env.CI ? 1 : undefined,

  // レポーター設定
  reporter: [
    ["html", { outputFolder: "playwright-report" }],
    ["list"],
  ],

  // 全テスト共通設定
  use: {
    // ベースURL
    baseURL: "http://localhost:3000",

    // トレース設定（失敗時のみ）
    trace: "on-first-retry",

    // スクリーンショット（失敗時のみ）
    screenshot: "only-on-failure",

    // ビデオ（失敗時のみ）
    video: "retain-on-failure",
  },

  // プロジェクト設定（複数ブラウザ）
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },

    {
      name: "firefox",
      use: { ...devices["Desktop Firefox"] },
    },

    {
      name: "webkit",
      use: { ...devices["Desktop Safari"] },
    },

    // モバイルテスト
    {
      name: "Mobile Chrome",
      use: { ...devices["Pixel 5"] },
    },
    {
      name: "Mobile Safari",
      use: { ...devices["iPhone 12"] },
    },
  ],

  // ローカル開発サーバー設定
  webServer: {
    command: "npm run dev --workspace packages/playground",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000, // 2分
  },
});
