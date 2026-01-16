import type { Artifact, ArtifactVisibility, ListArtifactsQuery } from "../types";

/**
 * Query helper functions for InMemoryArtifactStore
 * Extracts filtering, sorting, and pagination logic for better maintainability
 */

/**
 * Filter artifacts by userId
 */
export function filterByUserId(artifacts: Artifact[], userId?: string): Artifact[] {
  if (!userId) {
    return artifacts;
  }
  return artifacts.filter((a) => a.userId === userId);
}

/**
 * Filter artifacts by tags (AND logic - all tags must be present)
 */
export function filterByTags(artifacts: Artifact[], tags?: string[]): Artifact[] {
  if (!tags || tags.length === 0) {
    return artifacts;
  }
  return artifacts.filter((a) => tags.every((tag) => a.tags.includes(tag)));
}

/**
 * Filter artifacts by visibility
 */
export function filterByVisibility(
  artifacts: Artifact[],
  visibility?: ArtifactVisibility
): Artifact[] {
  if (!visibility) {
    return artifacts;
  }
  return artifacts.filter((a) => a.visibility === visibility);
}

/**
 * Filter artifacts by search term (searches in title and description)
 */
export function filterBySearch(artifacts: Artifact[], search?: string): Artifact[] {
  if (!search) {
    return artifacts;
  }
  const searchLower = search.toLowerCase();
  return artifacts.filter(
    (a) =>
      a.title.toLowerCase().includes(searchLower) ||
      (a.description && a.description.toLowerCase().includes(searchLower))
  );
}

/**
 * Sort artifacts by field and direction
 */
export function sortArtifacts(
  artifacts: Artifact[],
  sortBy: "createdAt" | "updatedAt" | "title" = "createdAt",
  sortOrder: "asc" | "desc" = "desc"
): Artifact[] {
  return artifacts.sort((a, b) => {
    let aValue: any;
    let bValue: any;

    if (sortBy === "title") {
      aValue = a.title.toLowerCase();
      bValue = b.title.toLowerCase();
    } else {
      aValue = a[sortBy].getTime();
      bValue = b[sortBy].getTime();
    }

    if (sortOrder === "asc") {
      return aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
    } else {
      return aValue < bValue ? 1 : aValue > bValue ? -1 : 0;
    }
  });
}

/**
 * Paginate artifacts
 * @returns Paginated artifacts
 */
export function paginateArtifacts(
  artifacts: Artifact[],
  offset: number = 0,
  limit: number = 20
): Artifact[] {
  return artifacts.slice(offset, offset + limit);
}

/**
 * Apply all query filters, sort, and pagination
 * Convenience function that applies all query operations in order
 */
export function applyQuery(
  artifacts: Artifact[],
  query: ListArtifactsQuery
): { artifacts: Artifact[]; total: number; offset: number; limit: number } {
  // Apply filters
  let filtered = filterByUserId(artifacts, query.userId);
  filtered = filterByTags(filtered, query.tags);
  filtered = filterByVisibility(filtered, query.visibility);
  filtered = filterBySearch(filtered, query.search);

  // Sort
  const sorted = sortArtifacts(filtered, query.sortBy, query.sortOrder);

  // Count total before pagination
  const total = sorted.length;

  // Paginate
  const offset = query.offset || 0;
  const limit = query.limit || 20;
  const paginated = paginateArtifacts(sorted, offset, limit);

  return {
    artifacts: paginated,
    total,
    offset,
    limit,
  };
}
