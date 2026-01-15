# Contributing Guide

Project Liquidへのコントリビューションを歓迎します！このガイドでは、コントリビューションの手順とルールを説明します。

## 行動規範

すべてのコントリビューターは以下を遵守してください：

- 敬意を持った建設的なコミュニケーション
- 多様性と包括性の尊重
- セキュリティ問題の責任ある開示

## コントリビューションの種類

### 1. Issue報告

バグ、機能要望、質問はGitHub Issuesで報告してください。

**Issueテンプレート**:
- **Bug Report**: バグの詳細、再現手順、期待される動作
- **Feature Request**: 機能の説明、ユースケース、実装案
- **Question**: 質問内容、既存ドキュメントで見つからなかった理由

### 2. Pull Request

コードの貢献は以下の手順で行ってください。

---

## 開発環境セットアップ

### 1. リポジトリをフォーク

```bash
# GitHubでリポジトリをフォーク
# フォークしたリポジトリをクローン
git clone https://github.com/YOUR_USERNAME/liqueur.git
cd liqueur
```

### 2. 上流リポジトリを追加

```bash
git remote add upstream https://github.com/ablaze/liqueur.git
git fetch upstream
```

### 3. 依存関係をインストール

```bash
# Git submodule
git submodule update --init --recursive

# TypeScript
npm install

# Rust
cargo build --workspace
```

### 4. テスト実行

```bash
# TypeScript
npm test

# Rust
cargo test --workspace
```

すべてのテストがパスすることを確認してください。

---

## ブランチ戦略

### ブランチ命名規則

```
feature/機能名       # 新機能
fix/バグ名          # バグ修正
docs/ドキュメント名  # ドキュメント更新
refactor/説明       # リファクタリング
test/テスト名       # テスト追加
```

**例**:
- `feature/calendar-component`
- `fix/validation-error-handling`
- `docs/getting-started-tutorial`

### ブランチ作成

```bash
# mainから最新を取得
git checkout main
git pull upstream main

# 新しいブランチ作成
git checkout -b feature/your-feature-name
```

---

## コーディング規約

### TypeScript

- **ESLint**: 全ルール遵守
- **Prettier**: コード自動フォーマット
- **型安全性**: strictモード必須、`any`禁止

```bash
# 型チェック
npm run typecheck

# リンター
npm run lint

# フォーマット
npm run format
```

### Rust

- **rustfmt**: コード自動フォーマット
- **clippy**: 全警告解消必須

```bash
# フォーマット
cargo fmt --all

# Linter
cargo clippy --workspace --all-features -- -D warnings
```

---

## TDD開発（必須）

### Red-Green-Refactor

すべてのコード変更は以下の手順で行ってください：

1. **🔴 Red**: 失敗するテストを先に書く
2. **🟢 Green**: 最小実装でテストをパス
3. **🔵 Refactor**: コード改善
4. **✅ Coverage**: カバレッジ95%以上確認

詳細は [TDD Guide](tdd-guide.md) を参照してください。

### カバレッジ要件

- **行カバレッジ**: 95%以上（必須）
- **分岐カバレッジ**: 90%以上（推奨）
- **関数カバレッジ**: 100%（推奨）

CIでカバレッジ95%未満はビルド失敗します。

---

## コミットメッセージ

### フォーマット

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Type**:
- `feat`: 新機能
- `fix`: バグ修正
- `docs`: ドキュメント更新
- `test`: テスト追加
- `refactor`: リファクタリング
- `chore`: ビルド設定等

**例**:
```
feat(protocol): add between filter operator

- Add FilterOperator::Between enum variant
- Implement converter logic for between operator
- Add validation tests

Closes #123
```

---

## Pull Request手順

### 1. 変更をコミット

```bash
git add .
git commit -m "feat(protocol): add between filter operator"
```

### 2. テストとリンターを実行

```bash
# TypeScript
npm run typecheck
npm test -- --coverage
npm run lint

# Rust
cargo fmt --all --check
cargo clippy --workspace --all-features
cargo test --workspace
cargo tarpaulin --workspace --out Html
```

すべてパスすることを確認してください。

### 3. プッシュ

```bash
git push origin feature/your-feature-name
```

### 4. Pull Request作成

GitHubでPull Requestを作成します。

**PRテンプレート**:
```markdown
## 概要
<!-- 変更内容の簡潔な説明 -->

## 関連Issue
Closes #123

## 変更内容
- [ ] 新機能追加
- [ ] バグ修正
- [ ] テスト追加
- [ ] ドキュメント更新

## テスト
<!-- テスト手順、カバレッジスクリーンショット -->

## チェックリスト
- [ ] TDD手順を遵守（Red-Green-Refactor）
- [ ] カバレッジ95%以上
- [ ] 型チェックパス（TypeScript）
- [ ] clippy警告なし（Rust）
- [ ] ドキュメント更新（必要な場合）
- [ ] CLAUDE.md更新（API変更の場合）
```

---

## コードレビュー

### レビュアー向け

- **機能**: 仕様を満たしているか
- **テスト**: カバレッジ95%以上、エッジケース網羅
- **セキュリティ**: SQLインジェクション、XSS等のリスク
- **パフォーマンス**: 不要な計算、メモリリーク
- **ドキュメント**: API変更時の更新確認

### レビュイー向け

- フィードバックを建設的に受け止める
- 質問には丁寧に回答
- レビュー指摘には迅速に対応

---

## リリースプロセス

### バージョニング

Semantic Versioning (MAJOR.MINOR.PATCH) を採用：

- **MAJOR**: 破壊的変更
- **MINOR**: 後方互換性のある機能追加
- **PATCH**: バグ修正

### リリース手順

1. **CHANGELOGを更新**
   ```markdown
   ## [1.1.0] - 2024-01-15
   ### Added
   - Calendar component support
   ### Fixed
   - Validation error handling
   ```

2. **バージョンアップ**
   ```bash
   # TypeScript
   npm version minor

   # Rust
   # Cargo.tomlのバージョンを手動更新
   ```

3. **タグ作成**
   ```bash
   git tag v1.1.0
   git push origin v1.1.0
   ```

4. **GitHub Release作成**
   - Release Notesを記載
   - バイナリ添付（必要な場合）

---

## ドキュメント更新

### 更新が必要な場合

- 新しいコンポーネント追加
- 新しいフィルタ演算子追加
- APIの変更
- 設定オプションの追加

### 更新対象ファイル

- `README.md`: プロジェクト概要
- `CLAUDE.md`: 機能要件マッピング表
- `docs/architecture/protocol-spec.md`: Protocol仕様
- `docs/getting-started.md`: チュートリアル
- API Reference: TypeDoc/cargo doc

---

## 質問とサポート

### 質問方法

1. **ドキュメントを確認**: README, docs/, CLAUDE.md
2. **既存Issueを検索**: 同じ質問がないか確認
3. **GitHub Discussions**: 一般的な質問
4. **Issue作成**: バグ報告、機能要望

### サポートチャネル

- **GitHub Discussions**: コミュニティサポート
- **GitHub Issues**: バグ報告、機能要望
- **Email**: セキュリティ問題の報告

---

## ライセンス

コントリビューションはMITライセンスの下で公開されます。

詳細は [LICENSE](../../LICENSE) を参照してください。

---

**ありがとうございます！あなたのコントリビューションがProject Liquidをより良いものにします。**
