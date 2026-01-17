import type { LiquidViewSchema } from "@liqueur/protocol";

/**
 * Visibility level for artifacts
 */
export type ArtifactVisibility = "private" | "public" | "team";

/**
 * Artifact - AI-generated persistent LiquidView schema
 */
export interface Artifact {
  /** Unique identifier (UUID) */
  id: string;

  /** Owner user ID */
  userId: string;

  /** Human-readable title */
  title: string;

  /** Optional description */
  description?: string;

  /** LiquidView schema */
  schema: LiquidViewSchema;

  /** Version number (starts at 1, increments on update) */
  version: number;

  /** Creation timestamp */
  createdAt: Date;

  /** Last update timestamp */
  updatedAt: Date;

  /** Tags for categorization */
  tags: string[];

  /** Visibility level */
  visibility: ArtifactVisibility;
}

/**
 * Artifact creation input (without auto-generated fields)
 */
export interface CreateArtifactInput {
  title: string;
  description?: string;
  schema: LiquidViewSchema;
  tags?: string[];
  visibility?: ArtifactVisibility;
}

/**
 * Artifact update input (partial update)
 */
export interface UpdateArtifactInput {
  title?: string;
  description?: string;
  schema?: LiquidViewSchema;
  tags?: string[];
  visibility?: ArtifactVisibility;
}

/**
 * Artifact list query parameters
 */
export interface ListArtifactsQuery {
  /** Filter by user ID (defaults to current user) */
  userId?: string;

  /** Filter by tags (AND logic) */
  tags?: string[];

  /** Filter by visibility */
  visibility?: ArtifactVisibility;

  /** Search in title/description */
  search?: string;

  /** Pagination: offset */
  offset?: number;

  /** Pagination: limit */
  limit?: number;

  /** Sort field */
  sortBy?: "createdAt" | "updatedAt" | "title";

  /** Sort direction */
  sortOrder?: "asc" | "desc";
}

/**
 * Paginated artifact list response
 */
export interface ListArtifactsResponse {
  artifacts: Artifact[];
  total: number;
  offset: number;
  limit: number;
}

/**
 * Artifact version - snapshot of an artifact at a specific version
 */
export interface ArtifactVersion {
  /** Version number */
  version: number;

  /** LiquidView schema at this version */
  schema: LiquidViewSchema;

  /** Commit message describing changes */
  message?: string;

  /** Version creation timestamp */
  createdAt: Date;

  /** Author user ID */
  authorId: string;
}

/**
 * Create version input
 */
export interface CreateVersionInput {
  schema: LiquidViewSchema;
  message?: string;
}

/**
 * Version diff - changes between two versions
 */
export interface VersionDiff {
  fromVersion: number;
  toVersion: number;
  changes: VersionChange[];
}

/**
 * Single change in version diff
 */
export interface VersionChange {
  type: "add" | "remove" | "modify";
  path: string; // JSON path (e.g., "components.0.title")
  oldValue?: any;
  newValue?: any;
  description?: string;
}

/**
 * Artifact store client interface
 */
export interface ArtifactStore {
  /**
   * Create a new artifact
   * @param input - Artifact creation input
   * @param userId - Owner user ID (from auth context)
   */
  create(input: CreateArtifactInput, userId: string): Promise<Artifact>;

  /**
   * Get artifact by ID
   */
  get(id: string): Promise<Artifact | null>;

  /**
   * List artifacts with optional filters
   */
  list(query?: ListArtifactsQuery): Promise<ListArtifactsResponse>;

  /**
   * Update artifact
   */
  update(id: string, input: UpdateArtifactInput): Promise<Artifact>;

  /**
   * Delete artifact
   */
  delete(id: string): Promise<void>;

  /**
   * Get all versions of an artifact
   */
  listVersions(artifactId: string): Promise<ArtifactVersion[]>;

  /**
   * Get specific version of an artifact
   */
  getVersion(artifactId: string, version: number): Promise<ArtifactVersion | null>;

  /**
   * Create new version (commit current schema)
   */
  createVersion(artifactId: string, input: CreateVersionInput, userId: string): Promise<ArtifactVersion>;

  /**
   * Delete specific version
   */
  deleteVersion(artifactId: string, version: number): Promise<void>;

  /**
   * Get diff between two versions
   */
  getDiff(artifactId: string, fromVersion: number, toVersion: number): Promise<VersionDiff>;

  /**
   * Restore artifact to specific version
   */
  restoreVersion(artifactId: string, version: number): Promise<Artifact>;
}
