# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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
