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
}
