# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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
