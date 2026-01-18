# Changelog

All notable changes to @liqueur/react will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.2.0] - 2026-01-17

### Added

#### Dashboard Management Features

- **Hooks**:
  - `useDashboards`: Fetch and manage dashboard list with search, sort, and filter capabilities
    - Search by title/description
    - Sort by name, created date, or updated date
    - Filter favorites
    - Pagination support (offset/limit)
  - `useDashboardMutations`: CRUD operations for dashboards
    - Create, update, delete dashboards with loading states
    - Optimistic UI support
    - Success/error callbacks
  - `useFavorites`: Manage favorite dashboards with localStorage persistence
    - Toggle favorites
    - Check favorite status
    - Automatic localStorage sync

- **Components**:
  - `DashboardCard`: Display individual dashboard with metadata and actions
    - Shows title, description, tags, created/updated dates
    - Favorite button with ★/☆ indicator
    - Edit and delete actions
    - Customizable with className
  - `DashboardList`: Grid layout for displaying dashboard cards
    - Responsive grid (auto-fill, min 300px)
    - Loading, error, and empty states
    - Custom card renderer support via `renderCard` prop
  - `DashboardSearch`: Search, sort, and filter controls
    - Debounced search input (300ms)
    - Sort by name/created/updated
    - Ascending/descending order
    - Favorites-only filter

- **Types**:
  - `Dashboard`: Extended Artifact with favorite support
  - `CreateDashboardInput`, `UpdateDashboardInput`: Dashboard creation/update types
  - `DashboardListQuery`: Query parameters for dashboard list
  - Component prop types: `DashboardCardProps`, `DashboardListProps`, `DashboardSearchProps`

#### API Extensions

- **GET /api/liquid/artifacts**: Extended with query parameters
  - `search`: Search by title or description
  - `sortBy`: Sort by title, createdAt, or updatedAt
  - `sortOrder`: asc or desc
  - `offset`, `limit`: Pagination support

### Changed

- Updated TypeScript configuration to include DOM types for better type safety
- Improved test infrastructure with isolated test execution (`--pool=forks`)

### Technical Details

- **Test Coverage**: Added 27 new tests (all passing)
  - 8 tests for useDashboards
  - 8 tests for useDashboardMutations
  - 8 tests for useFavorites
  - 11 tests for DashboardCard component
  - Plus DashboardList and DashboardSearch component tests
- **Total Tests**: 103+ tests passing
- **Code Quality**: Maintained 95%+ test coverage
- **Type Safety**: Full TypeScript support with strict mode

### Documentation

- Comprehensive README updates with:
  - Hook usage examples and API documentation
  - Component usage examples with props
  - Complete integration example
  - Best practices for dashboard management

## [0.1.0] - 2026-01-16

### Added

- Initial release of @liqueur/react
- **Core Components**:
  - `LiquidRenderer`: Main component for rendering LiquidView schemas
  - `ChartComponent`: Bar, line, and pie charts using Recharts
  - `TableComponent`: Interactive tables with @tanstack/react-table
  - `GridLayout`, `StackLayout`: Layout components

- **Hooks**:
  - `useLiquidView`: Data fetching for Liquid schemas

- **Features**:
  - Full TypeScript support
  - Loading state indicators
  - Type-safe schema rendering
  - Responsive layouts

- **Testing**:
  - 68 tests with 95%+ coverage
  - Vitest test infrastructure
  - React Testing Library integration

[0.2.0]: https://github.com/clearclown/liqueur/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/clearclown/liqueur/releases/tag/v0.1.0
