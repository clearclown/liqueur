# TDD Guide - Test-Driven Development

Project LiquidにおけるTest-Driven Development (TDD)の実践ガイドです。

## TDD の基本原則

### Red-Green-Refactor Cycle

```
1. 🔴 Red:   失敗するテストを書く
2. 🟢 Green: 最小実装でテストをパスさせる
3. 🔵 Refactor: コードを改善（テストは全てパス）
4. ✅ Coverage: カバレッジ95%以上を確認
```

### なぜTDDか？

- **構築忘れ防止**: テストケースが仕様書として機能
- **品質保証**: リファクタリング時の回帰テスト防止
- **設計改善**: テスト可能な設計を強制
- **ドキュメント**: テストコードが使用例となる

---

## TypeScript TDD

### セットアップ

```bash
cd packages/protocol
npm run test:watch  # ウォッチモード起動
```

### Red: 失敗するテストを書く

```typescript
// tests/validator.test.ts
import { describe, it, expect } from "vitest";
import { SchemaValidator } from "../src/validators/schema";

describe("SchemaValidator", () => {
  it("should reject invalid layout type", () => {
    const schema = {
      version: "1.0",
      layout: { type: "invalid_type" },
      components: [],
      data_sources: {}
    };

    const validator = new SchemaValidator();
    const result = validator.validate(schema);

    expect(result.valid).toBe(false);
    expect(result.errors).toContainEqual(
      expect.objectContaining({ code: "INVALID_LAYOUT_TYPE" })
    );
  });
});
```

**実行**: テストが失敗することを確認

```bash
❌ FAIL  tests/validator.test.ts
  Expected: false
  Received: true
```

### Green: 最小実装

```typescript
// src/validators/schema.ts
private validateLayout(layout: any, errors: ValidationError[]): void {
  const validTypes = ["grid", "stack", "flex"];
  if (!validTypes.includes(layout.type)) {
    errors.push(new ValidationError(
      "INVALID_LAYOUT_TYPE",
      `Invalid layout type: ${layout.type}`,
      "layout.type"
    ));
  }
}
```

**実行**: テストが成功することを確認

```bash
✅ PASS  tests/validator.test.ts
```

### Refactor: コード改善

```typescript
// 定数を外部に抽出
const VALID_LAYOUT_TYPES = ["grid", "stack", "flex"] as const;

private validateLayout(layout: any, errors: ValidationError[]): void {
  if (!VALID_LAYOUT_TYPES.includes(layout.type)) {
    errors.push(new ValidationError(
      "INVALID_LAYOUT_TYPE",
      `Invalid layout type: ${layout.type}. Valid types: ${VALID_LAYOUT_TYPES.join(", ")}`,
      "layout.type"
    ));
  }
}
```

### Coverage: カバレッジ確認

```bash
npm run test -- --coverage

-----------------------------------
File                | % Stmts | % Branch | % Funcs | % Lines
-----------------------------------
validators/schema.ts|   96.4  |   92.5   |  100    |   96.4
-----------------------------------
```

**目標達成**: 95%以上 ✅

---

## Rust TDD

### セットアップ

```bash
cd crates/liquid-protocol
cargo watch -x test
```

### Red: 失敗するテストを書く

```rust
// tests/validator_test.rs
use liquid_protocol::{schema::*, validator::*};

#[test]
fn test_unsupported_version() {
    let schema = LiquidViewSchema {
        version: "2.0".to_string(),
        layout: Layout::Grid {
            props: GridProps { columns: 1, gap: None },
            children: vec![],
        },
        data_sources: HashMap::new(),
    };

    let validator = SchemaValidator::new();
    let result = validator.validate(&schema);

    assert!(result.is_err());
    assert!(matches!(
        result.unwrap_err()[0],
        ValidationError::UnsupportedVersion(_)
    ));
}
```

**実行**: テストが失敗することを確認

```bash
❌ test test_unsupported_version ... FAILED
```

### Green: 最小実装

```rust
// src/validator.rs
pub fn validate(&self, schema: &LiquidViewSchema) -> Result<(), Vec<ValidationError>> {
    let mut errors = Vec::new();

    if !self.supported_versions.contains(&schema.version) {
        errors.push(ValidationError::UnsupportedVersion(schema.version.clone()));
    }

    if errors.is_empty() {
        Ok(())
    } else {
        Err(errors)
    }
}
```

**実行**: テストが成功することを確認

```bash
✅ test test_unsupported_version ... ok
```

### Refactor: コード改善

```rust
// 定数化
const SUPPORTED_VERSIONS: &[&str] = &["1.0"];

impl SchemaValidator {
    pub fn new() -> Self {
        Self {
            supported_versions: SUPPORTED_VERSIONS.iter().map(|s| s.to_string()).collect(),
        }
    }
}
```

### Coverage: カバレッジ確認

```bash
cargo tarpaulin --out Html
open tarpaulin-report.html

validator.rs: 97.2% coverage ✅
```

---

## テストパターン集

### パターン1: 境界値テスト

```typescript
it("should validate minimum columns", () => {
  const schema = { layout: { type: "grid", columns: 1 } };
  expect(validator.validate(schema).valid).toBe(true);
});

it("should reject zero columns", () => {
  const schema = { layout: { type: "grid", columns: 0 } };
  expect(validator.validate(schema).valid).toBe(false);
});

it("should reject negative columns", () => {
  const schema = { layout: { type: "grid", columns: -1 } };
  expect(validator.validate(schema).valid).toBe(false);
});
```

### パターン2: 配列テスト

```typescript
it("should validate empty components array", () => {
  const schema = { components: [] };
  expect(validator.validate(schema).valid).toBe(true);
});

it("should validate multiple components", () => {
  const schema = { components: [component1, component2] };
  expect(validator.validate(schema).valid).toBe(true);
});
```

### パターン3: null/undefined テスト

```typescript
it("should handle missing optional field", () => {
  const schema = { layout: { type: "grid", columns: 2 } };  // gapなし
  expect(validator.validate(schema).valid).toBe(true);
});

it("should reject null required field", () => {
  const schema = { layout: { type: null } };
  expect(validator.validate(schema).valid).toBe(false);
});
```

### パターン4: Rust Roundtrip テスト

```rust
#[test]
fn test_serde_roundtrip() {
    let original = LiquidViewSchema { ... };
    let json = serde_json::to_string(&original).unwrap();
    let deserialized: LiquidViewSchema = serde_json::from_str(&json).unwrap();
    assert_eq!(original, deserialized);
}
```

---

## カバレッジ計測

### TypeScript

```bash
# カバレッジ付きテスト実行
npm test -- --coverage

# HTMLレポート生成
open coverage/index.html
```

**設定** (`vitest.config.ts`):
```typescript
coverage: {
  provider: 'v8',
  thresholds: {
    lines: 95,
    functions: 100,
    branches: 90,
    statements: 95
  }
}
```

### Rust

```bash
# tarpaulinインストール（初回のみ）
cargo install cargo-tarpaulin

# カバレッジ計測
cargo tarpaulin --workspace --out Html

# レポート確認
open tarpaulin-report.html
```

---

## CI/CD での強制

### TypeScript CI

```yaml
- name: Check coverage threshold
  run: |
    COVERAGE=$(jq '.total.lines.pct' coverage/coverage-summary.json)
    if (( $(echo "$COVERAGE < 95" | bc -l) )); then
      echo "Coverage $COVERAGE% is below 95%"
      exit 1
    fi
```

### Rust CI

```yaml
- name: Check coverage threshold
  run: |
    COVERAGE=$(grep -oP 'line-rate="\K[0-9.]+' cobertura.xml | head -1)
    COVERAGE_PCT=$(echo "$COVERAGE * 100" | bc)
    if (( $(echo "$COVERAGE_PCT < 95" | bc -l) )); then
      exit 1
    fi
```

---

## ベストプラクティス

### DO ✅

- テストを先に書く（Red-Green-Refactor）
- 1つのテストで1つの側面のみ検証
- テスト名は明確に（`should_reject_invalid_layout_type`）
- AAA Pattern: Arrange, Act, Assert
- エッジケースを網羅（境界値、null、空配列）

### DON'T ❌

- 実装を先に書いてテストを後から書く
- テストをスキップして実装を進める
- カバレッジ95%未満でPRを出す
- テストでモック/スタブを乱用

---

## まとめ

Project LiquidのTDD開発：

1. **Red-Green-Refactor** サイクルを厳守
2. **カバレッジ95%以上** 必須（CI強制）
3. **エッジケース網羅** で堅牢性確保
4. **テストがドキュメント** となるよう明確に記述

次のステップ:
- [Contributing Guide](contributing.md) - コントリビューション手順
- [CLAUDE.md](../../CLAUDE.md) - 開発者ガイド
