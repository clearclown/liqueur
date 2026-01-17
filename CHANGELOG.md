# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

---

## [0.1.0] - 2026-01-18

### Initial Public Release

Project Liquidの初回公開リリース。AI駆動の動的UI生成システム。

#### Highlights

- **Server-Driven UI**: JSONスキーマベース（コード実行なし）
- **マルチAIプロバイダー**: OpenAI, Anthropic, Gemini, DeepSeek, GLM, Local LLM対応
- **Row-Level Security**: ユーザー権限の強制適用
- **95%+テストカバレッジ**: 322ユニット + 38 E2Eテスト

#### Packages

| パッケージ | バージョン | 説明 |
|-----------|----------|------|
| @liqueur/protocol | 0.1.0 | コア型定義・バリデーター |
| @liqueur/react | 0.1.0 | Reactコンポーネントライブラリ |
| @liqueur/ai-provider | 0.1.0 | AIプロバイダー抽象化 |
| @liqueur/artifact-store | 0.1.0 | スキーマ永続化 |
| @liqueur/auth | 0.1.0 | 認証・認可 |
| @liqueur/db-adapter | 0.1.0 | DBイントロスペクション |

#### Added

- **Core Protocol**
  - `LiquidViewSchema` - UI定義の型安全なスキーマ
  - `DataSource` - 宣言的なデータ取得定義
  - `SchemaValidator` - 厳格なスキーマ検証

- **React Components**
  - `LiquidRenderer` - JSONからReactへの変換
  - `ChartComponent` - 4種のチャート（bar, line, pie, area）
  - `TableComponent` - TanStack Table統合
  - `GridLayout` / `StackLayout` - レイアウトコンポーネント

- **AI Integration**
  - `ProviderFactory` - プロバイダー自動選択
  - 6つのAIプロバイダー実装
  - レート制限・キャッシング

- **Security**
  - Row-Level Security強制適用
  - 入力検証
  - Fail Fast設計

- **Documentation**
  - 哲学ドキュメント（docs/philosophy/why-liquid.md）
  - クイックスタートチュートリアル
  - コア概念解説
  - セキュリティポリシー
  - コントリビューションガイド

#### Quality Metrics

```
Tests:     322 unit + 38 E2E (100% pass rate)
Coverage:  97.76% statements
Build:     Production build successful
Type:      100% TypeScript compliance
```

---

### TypeScript Configuration Unification (Phase 68, 2025-01-16)

#### Changed
- **packages/protocol/tsconfig.json**:
  - Added `declarationMap: true` for source map support
- **packages/react/tsconfig.json**:
  - Added `composite: true` to enable project references
  - Added `declarationMap: true` for source map support
  - Added `references: [{ "path": "../protocol" }]` for proper dependency tracking

#### Benefits
- **IDE Support**: Better jump-to-definition and intellisense across packages
- **Build Performance**: TypeScript can incrementally build dependent packages with `tsc --build`
- **Source Maps**: Declaration maps enable precise navigation to original TypeScript source
- **Type Safety**: Proper project references ensure correct type resolution across packages
- **Consistency**: All 4 packages now use identical TypeScript configuration pattern

#### Technical Details
- `composite: true`: Enables TypeScript's project references feature for monorepo builds
- `declarationMap: true`: Generates .d.ts.map files alongside .d.ts declaration files
- Project references: Allow TypeScript to understand inter-package dependencies and build order
- This configuration is essential for efficient monorepo development with multiple TypeScript packages

#### All Packages Now Have
- `composite: true` (enables project references)
- `declarationMap: true` (source maps for declarations)
- `references: [...]` (where applicable - packages depending on @liqueur/protocol)

#### Verification (Phase 68)
- ✅ All tests passing: 98/98 (7 test files)
- ✅ Type checking: Zero TypeScript errors with `tsc --build`
- ✅ Lint: All packages pass ESLint checks
- ✅ Project references: Properly configured for protocol → react/ai-provider/artifact-store

---

### Package Scripts Unification (Phase 65, 2025-01-16)

#### Changed
- **packages/ai-provider/package.json** - `docs` script:
  - Changed from `typedoc --out docs` to `typedoc src/index.ts --out docs`
  - Now matches format used by protocol, react, and artifact-store packages

#### Benefits
- **Consistency**: All 4 packages now use identical docs script format
- **Explicit Entry Point**: Entry point (src/index.ts) is explicitly specified in command
- **Maintainability**: Uniform script structure makes cross-package changes easier
- **Documentation Quality**: Explicit entry point ensures consistent documentation generation

#### Context
All packages already had the following unified script set:
- `build`, `test`, `test:watch`, `test:coverage`, `typecheck`, `lint`, `format`, `docs`

Phase 65 completes the unification by standardizing the docs script content.

#### Verification (Phase 65)
- ✅ All tests passing: 98/98 (7 test files)
- ✅ Type checking: Zero TypeScript errors
- ✅ Lint: All packages pass ESLint checks
- ✅ docs generation: ai-provider successfully generates HTML documentation

---

### Workspace Dependencies Unification (Phase 63, 2025-01-16)

#### Changed
- **packages/ai-provider/package.json** - `@liqueur/protocol` dependency:
  - Changed from `file:../protocol` to `^0.1.0` (version reference)
- **packages/artifact-store/package.json** - `@liqueur/protocol` dependency:
  - Changed from `file:../protocol` to `^0.1.0` (version reference)
- **packages/react/package.json** - `@liqueur/protocol` dependency:
  - Already using `^0.1.0` (no change, serves as reference)

#### Benefits
- **Consistency**: All workspace packages use the same dependency format (version references)
- **npm Workspaces Compatibility**: Version references work seamlessly with npm workspaces auto-linking
- **Publication Ready**: Proper versioning for potential npm registry publication
- **Simplified Management**: Uniform dependency declaration across monorepo

#### Technical Details
- npm workspaces automatically creates symlinks for local packages during `npm install`
- Version references (`^0.1.0`) are resolved to local workspace packages in development
- On publication, these references remain as-is for npm registry compatibility
- Eliminates inconsistency between `file:` protocol and version references

#### Verification (Phase 63)
- ✅ All tests passing: 98/98 (7 test files)
- ✅ Type checking: Zero TypeScript errors
- ✅ Lint: All packages pass ESLint checks
- ✅ package-lock.json updated correctly with workspace links

---

### Package README Repository URL Fix (Phase 61, 2025-01-16)

#### Fixed
- **All 4 TypeScript packages** - Repository URL in Contributing section:
  - packages/protocol/README.md:99
  - packages/react/README.md:193
  - packages/ai-provider/README.md:249
  - packages/artifact-store/README.md:262
  - Replaced placeholder `your-org` with actual `ablaze` organization name

#### Benefits
- **Correct Links**: Contributors can now navigate to actual repository
- **Documentation Accuracy**: All package READMEs point to correct GitHub URL
- **Consistency**: Uniform repository URLs across all packages

#### Verification (Phase 61)
- ✅ All 4 package READMEs updated correctly
- ✅ URLs now point to: https://github.com/ablaze/liqueur

---

### Package Metadata Unification (Phase 59, 2025-01-16)

#### Added
- **All 4 TypeScript packages** - npm registry metadata:
  - `repository`: Git URL with `directory` field for monorepo packages
  - `bugs`: GitHub issues tracker URL
  - `homepage`: GitHub repository homepage URL

#### Modified
- **packages/protocol/package.json**: Added repository, bugs, homepage
- **packages/react/package.json**: Added repository, bugs, homepage
- **packages/ai-provider/package.json**: Added repository, bugs, homepage
- **packages/artifact-store/package.json**: Added repository, bugs, homepage

#### Benefits
- **npm Registry Integration**: Source code and issue tracker links displayed on npm
- **Developer Experience**: Easy navigation from npm to GitHub repository
- **Consistency**: Uniform metadata structure across all packages
- **Monorepo Support**: `directory` field correctly points to package location

#### Verification (Phase 59)
- ✅ All tests passing: 98/98 (7 test files)
- ✅ Type checking: Zero TypeScript errors
- ✅ All 4 packages have complete metadata

---

### API Documentation Setup (Phase 57, 2025-01-16)

#### Added
- **TypeDoc** (Phase 57):
  - `typedoc: ^0.27.5` to root devDependencies
  - `docs` script to all 4 TypeScript packages: `typedoc src/index.ts --out docs`
  - `docs/` to .gitignore (generated documentation excluded from Git)

#### Benefits
- **API Documentation**: Automated generation for all TypeScript packages
- **Workspace-Wide Command**: `npm run docs` generates docs for all packages
- **Version Control**: Generated docs excluded from Git (docs/ in .gitignore)
- **Latest Features**: TypeDoc v0.27+ with modern documentation features

#### Verification (Phase 57)
- ✅ All packages generate docs successfully (protocol, react, ai-provider, artifact-store)
- ✅ All tests passing: 98/98 (7 test files)
- ✅ Type checking: Zero TypeScript errors
- ✅ HTML documentation created in packages/*/docs/

---

### Documentation Enhancement (Phase 55, 2025-01-16)

#### Changed
- **README.md**:
  - Added "コード品質" section under "開発"
  - Documented lint, format, and format:check commands
  - Aligned with Phase 53 root scripts expansion

#### Benefits
- **Developer Experience**: Easy discovery of code quality commands
- **Documentation Completeness**: All new commands properly documented
- **Consistency**: Follows existing README structure and style

#### Verification (Phase 55)
- ✅ Documentation accurate and complete
- ✅ Commands work as documented

---

### Root Scripts Expansion (Phase 53, 2025-01-16)

#### Added
- **Root package.json** - Workspace-wide operation scripts:
  - `lint` script: `npm run lint --workspaces`
  - `format` script: `npm run format --workspaces`
  - `format:check` script: `prettier --check "packages/*/src/**/*.{ts,tsx}" "packages/*/tests/**/*.{ts,tsx}"`
  - `prettier: ^3.1.0` to devDependencies

#### Changed
- **All TypeScript Files** (54 files):
  - Automatically formatted with Prettier
  - Code style unified across all packages (ai-provider, artifact-store, protocol, react)

#### Benefits
- **Workspace-Wide Commands**: Single command for linting/formatting all packages
- **Code Style Consistency**: All files follow Prettier standards
- **Development Efficiency**: No need to cd into each package for formatting
- **Root-Level Prettier**: Available for workspace-wide operations

#### Verification (Phase 53)
- ✅ All tests passing: 98/98 (7 test files)
- ✅ Type checking: Zero TypeScript errors
- ✅ All lint checks passing: 4/4 packages
- ✅ Format check passing: All files use Prettier code style

---

### Configuration Refinement (Phase 47-51, 2025-01-16)

#### Changed
- **.gitignore** (Phase 47):
  - Added `.claude/plans/` - Plan mode generated files
  - Added `*-worktrees/` - Git worktree directories pattern
  - Added `*.min.js` and `*.min.css` - Minified build artifacts
  - Reorganized Claude Code section for clarity

- **Cargo.toml** (Phase 51):
  - Fixed repository URL: `clearclown/liqueur` → `ablaze/liqueur`
  - Aligned with package.json repository URL for consistency

#### Benefits
- **Cleaner Repository**: Development artifacts automatically excluded from Git
- **Metadata Consistency**: Repository URLs unified across TypeScript and Rust configurations
- **Better Organization**: .gitignore patterns logically grouped by category

#### Verification (Phase 48, 51)
- ✅ All TypeScript tests passing: 98/98 (7 test files)
- ✅ All TypeScript builds successful: 4/4 packages
- ✅ All Rust tests passing: 25/25 (6 + 9 + 10 tests)
- ✅ Type checking: Zero TypeScript errors
- ✅ All lint checks passing: 4/4 packages

---

### Package Scripts Unification (Phase 49, 2025-01-16)

#### Changed
- **packages/react/package.json**:
  - Added `format` script: `prettier --write "src/**/*.{ts,tsx}" "tests/**/*.{ts,tsx}"`
  - Added `prettier: ^3.1.0` to devDependencies

- **packages/ai-provider/package.json**:
  - Updated `test:watch`: `vitest` → `vitest watch` (explicit watch command)
  - Reordered scripts: build, test, test:watch, test:coverage, typecheck, lint, format
  - Added `format` script: `prettier --write "src/**/*.ts" "tests/**/*.ts"`
  - Added `prettier: ^3.1.0` to devDependencies

- **packages/artifact-store/package.json**:
  - Updated `test:watch`: `vitest` → `vitest watch` (explicit watch command)
  - Reordered scripts: build, test, test:watch, test:coverage, typecheck, lint, format
  - Added `format` script: `prettier --write "src/**/*.ts" "tests/**/*.ts"`
  - Added `prettier: ^3.1.0` to devDependencies

#### Benefits
- **Command Consistency**: All packages now have identical script command sets
- **Script Order Consistency**: Standardized order improves readability
- **Code Formatting**: All packages can now be formatted with `npm run format`
- **Explicit Commands**: `test:watch` now explicitly uses `vitest watch` for clarity

#### Verification (Phase 49)
- ✅ All tests passing: 98/98 (7 test files)
- ✅ All builds successful: 4/4 packages
- ✅ Dependencies installed successfully

---

### Dependency Optimization (Phase 45, 2025-01-16)

#### Changed
- **Root package.json** - Added common development dependencies:
  - `@typescript-eslint/eslint-plugin: ^6.13.0`
  - `@typescript-eslint/parser: ^6.13.0`
  - `eslint: ^8.55.0`

- **packages/protocol/package.json** - Removed 6 common dev dependencies:
  - Removed: typescript, vitest, @vitest/coverage-v8, eslint, @typescript-eslint/*
  - Kept: @types/node, prettier (package-specific)

- **packages/react/package.json** - Removed 6 common dev dependencies:
  - Removed: typescript, vitest, @vitest/coverage-v8, eslint, @typescript-eslint/*
  - Kept: @testing-library/*, @types/react, jsdom, react-dom (React-specific)

- **packages/ai-provider/package.json** - Removed 6 common dev dependencies:
  - Removed: typescript, vitest, @vitest/coverage-v8, eslint, @typescript-eslint/*
  - Kept: @anthropic-ai/sdk, @google/generative-ai, @types/node, openai (AI SDK-specific)

- **packages/artifact-store/package.json** - Removed 6 common dev dependencies:
  - Removed: typescript, vitest, @vitest/coverage-v8, eslint, @typescript-eslint/*
  - Kept: @types/node (Node.js type definitions)

#### Benefits
- **Dependency Reduction**: 24 duplicated dependencies → 6 unique dependencies removed
- **Version Management**: Centralized version control for common tools
- **Reduced Package Size**: Smaller package.json files across all packages
- **Faster Installation**: npm install performance improved with fewer duplicates

#### Verification (Phase 45)
- ✅ All tests passing: 98/98 (7 test files)
- ✅ All builds successful: 4/4 packages
- ✅ All lint checks passing: 4/4 packages
- ✅ Type checking: Zero TypeScript errors
- ✅ No breaking changes: All functionality preserved

---

### Documentation and Configuration Refinement (Phase 39-43, 2025-01-16)

#### Added
- **Root TypeScript Configuration** (Phase 42):
  - `tsconfig.json` at project root
  - TypeScript Project References enabled for all 4 packages
  - Unified type checking via `npm run typecheck`

- **README.md Enhancements** (Phase 41):
  - Added ai-provider and artifact-store to project structure
  - Phase 1 completion status with detailed coverage metrics
  - Phase 2 roadmap section with AI integration plans

#### Changed
- **CLAUDE.md** (Phase 40):
  - Updated directory structure with ai-provider package details
  - Updated directory structure with artifact-store package details
  - Added package descriptions and subdirectory structures

- **CONTRIBUTING.md** (Phase 40):
  - Fixed TDD Guide link: `tdd-guide.md` → `docs/development/tdd-guide.md`
  - Corrected relative path for proper documentation navigation

- **README.md** (Phase 41):
  - Updated Phase 1 status from "in progress" to "completed" (2025-01-15)
  - Added test counts and coverage percentages for all components
  - Expanded project structure to include all 4 TypeScript packages

#### Documentation
- **CHANGELOG.md** (Phase 39):
  - Documented Phase 32-38 quality improvements
  - Added comprehensive change history with Added/Changed/Removed/Fixed sections
  - Maintained Keep a Changelog format compliance

#### Verification (Phase 43)
- ✅ All tests passing: 98/98 (7 test files)
- ✅ All builds successful: 4/4 packages (protocol, react, ai-provider, artifact-store)
- ✅ All lint checks passing: 4/4 packages
- ✅ Type checking: Zero TypeScript errors with project references
- ✅ Coverage: 95%+ maintained across all packages

---

### Project Quality Improvements (Phase 32-38, 2025-01-16)

#### Added
- **LICENSE File**: MIT License with proper copyright notice
- **CONTRIBUTING.md**: Contribution guidelines at project root for GitHub integration
- **Editor Configuration**:
  - `.editorconfig` - Cross-editor consistency (charset, indentation, line endings)
  - `.prettierrc` - Code formatting standards (semi, trailing comma, quotes)
  - `.prettierignore` - Formatting exclusion patterns
  - Unified `.eslintrc.json` at root (ES2022, TypeScript support)

- **Project Metadata** (root package.json):
  - `repository` field with GitHub URL
  - `bugs` field with issue tracker URL
  - `homepage` field
  - `keywords` for npm discoverability
  - `author` field (Project Liquid Contributors)
  - `license` field (MIT)

- **Package Configuration Standardization**:
  - `type: "module"` for ES Module support in all packages
  - `exports` field with proper type mappings
  - `engines` field with Node.js version requirement (>=20.0.0)
  - `keywords` for package discoverability
  - `author` field in all packages

#### Changed
- **Dependencies Updated** (root):
  - TypeScript: 5.3.0 → 5.7.3
  - Vitest: 2.0.0 → 3.0.3
  - @vitest/coverage-v8: 2.0.0 → 3.0.3

- **Package Descriptions**: Standardized to English
  - @liqueur/react: "Liquid UI - React component library for rendering LiquidView schemas"

- **Documentation Links**:
  - CONTRIBUTING.md link moved from `docs/development/contributing.md` to root
  - README.md badges consolidated to single quality-gate workflow

#### Removed
- **Redundant CI/CD Workflows**:
  - `.github/workflows/test-ts.yml` (inconsistent 80% coverage threshold)
  - `.github/workflows/test-rust.yml` (inconsistent 80% coverage threshold)
  - Unified on `quality-gate.yml` with strict 95% coverage enforcement

- **Duplicate ESLint Configurations**:
  - `packages/protocol/.eslintrc.json` (29 lines)
  - `packages/react/.eslintrc.json` (29 lines)
  - `packages/ai-provider/.eslintrc.json` (29 lines)
  - `packages/artifact-store/.eslintrc.json` (29 lines)
  - Replaced by single root configuration

#### Fixed
- License field consistency across all packages
- Relative link in CONTRIBUTING.md (../../LICENSE → LICENSE)
- CI/CD coverage threshold inconsistencies (now uniformly 95%)
- ESLint configuration duplication (4 files → 1 unified config)

#### Verification (Phase 37)
- ✅ All tests passing: 98/98 (Protocol: 44/44, React: 54/54)
- ✅ All builds successful: 4/4 packages
- ✅ All lint checks passing: 4/4 packages
- ✅ Type checking: Zero TypeScript errors
- ✅ Coverage: 95%+ across all packages

---

### Phase 1 Complete (2025-01-15)

#### Added
- **Protocol Layer**: Type-safe schema definitions with strict validation
  - `LiquidViewSchema` with flattened layout structure
  - `GridLayout` and `StackLayout` with direct properties
  - `ChartComponent` (bar, line, pie, area variants)
  - `TableComponent` with dynamic column support
  - `DataSource` abstraction for query specification
  - Comprehensive validators with 44 test cases (100% passing)

- **React Components**: Production-ready UI library
  - `LiquidRenderer` - JSON Schema to React transformer
  - `ChartComponent` - Recharts integration (4 variants)
  - `TableComponent` - TanStack Table integration
  - `GridLayout` - CSS Grid-based layout
  - `StackLayout` - Flexbox-based layout
  - `useLiquidView` hook - Data fetching with loading states
  - Mock data generation for Phase 1 development

- **Testing Infrastructure**
  - 98 total tests across Protocol and React packages
  - Protocol: 44/44 tests passing
  - React: 54/54 tests passing
  - Coverage: 92%+ lines, 94%+ functions, 90%+ branches

#### Changed
- **BREAKING**: Layout structure changed from nested to flat
  - `layout.props.columns` → `layout.columns`
  - `layout.props.gap` → `layout.gap`
  - `layout.props.direction` → `layout.direction`
  - `layout.children` → `schema.components` (top-level)
  - `StackLayout.props.spacing` → `StackLayout.gap` (renamed for consistency)

#### Fixed
- Type definition inconsistencies between protocol and implementation
- Validator logic updated for flattened structure
- Removed unused imports in TableComponent
- Test syntax errors in validator test suite
- Coverage configuration optimized (excluded re-export files)

#### Technical Details
- **Lines of Code**: ~3,500+ across TypeScript packages
- **Test Coverage**:
  - Protocol: Lines 95%+, Functions 100%, Branches 90%+
  - React: Lines 92%, Functions 94%, Branches 90%+
- **Type Safety**: Full TypeScript strict mode compliance
- **Build**: Zero TypeScript errors, all packages building successfully

---

## Phase 2 Roadmap

### Planned Features
- Backend API integration with reinhardt-web
- Real data fetching in useLiquidView hook
- DataSource → ORM query conversion
- Row-Level Security implementation
- AI prompt integration for schema generation
- Artifact persistence layer

### Deferred Features (Phase 3+)
- Schema versioning and migration
- Additional component types (Calendar, Map, etc.)
- Advanced aggregation operators
- Real-time data updates (WebSocket)
- Multi-tenant support

---

## [0.1.0] - 2025-01-15

### Initial Release
- Project structure established
- npm workspace configuration
- Monorepo setup with Protocol and React packages
- Development tooling (Vitest, TypeScript, ESLint)
- Git workflow and CI/CD foundation

---

## Contributing

See [CLAUDE.md](./CLAUDE.md) for development guidelines and architecture documentation.

## License

MIT

## Acknowledgments

- Built with Claude Code
- Powered by reinhardt-web for backend queries
- UI components by Recharts and TanStack Table
