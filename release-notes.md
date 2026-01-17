# Project Liquid v0.1.0

AI駆動の動的UI生成システムの初回公開リリース

## Highlights

- **Server-Driven UI**: JSONスキーマベース（コード実行なし）
- **マルチAIプロバイダー**: OpenAI, Anthropic, Gemini, DeepSeek, GLM, Local LLM対応
- **Row-Level Security**: ユーザー権限の強制適用
- **95%+テストカバレッジ**: 322ユニット + 38 E2Eテスト

## なぜLiquidなのか

従来のAI UI生成ツールは、AIにJavaScript/SQLを直接生成させるため、セキュリティリスクがありました。

**Liquidは違います**:
- AIはJSONスキーマ**のみ**を生成
- Rust型システムで厳格に検証
- 定義外フィールドは即座にエラー（Fail Fast）
- Row-Level Security強制適用

## パッケージ

| パッケージ | 説明 |
|-----------|------|
| @liqueur/protocol | コア型定義・バリデーター |
| @liqueur/react | Reactコンポーネントライブラリ |
| @liqueur/ai-provider | AIプロバイダー抽象化 |
| @liqueur/artifact-store | スキーマ永続化 |
| @liqueur/auth | 認証・認可 |
| @liqueur/db-adapter | DBイントロスペクション |

## クイックスタート

```bash
git clone https://github.com/clearclown/liqueur.git
cd liqueur
npm install
cp .env.example .env
# .envでAI_PROVIDER=deepseekを設定
npm run dev -w @liqueur/playground
```

## ドキュメント

- [Getting Started](docs/tutorials/quickstart.md)
- [Core Concepts](docs/tutorials/concepts.md)
- [Philosophy](docs/philosophy/why-liquid.md)
- [Contributing](CONTRIBUTING.md)
- [Security](SECURITY.md)

## 品質指標

```
Tests:     322 unit + 38 E2E (100% pass rate)
Coverage:  97.76% statements
Build:     Production build successful
Type:      100% TypeScript compliance
```

## ライセンス

MIT

---

Generated with [Claude Code](https://claude.com/claude-code)
