/**
 * Test Setup
 * Vitestのテスト環境セットアップ
 */

import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

// 各テスト後にクリーンアップ
afterEach(() => {
  cleanup();
});
