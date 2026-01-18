/**
 * DataSource Executor Utilities
 *
 * Generic utility functions for DataSource execution
 */

import type { FilterOperator } from "@liqueur/protocol";
import {
  VIRTUAL_DATE_FIELDS,
  VALID_AGGREGATION_TYPES,
  type VirtualDateField,
  type AggregationType,
} from "./types";

/**
 * Convert FilterOperator to Prisma where condition
 */
export function convertOperator(
  op: FilterOperator,
  value: unknown
): unknown {
  switch (op) {
    case "eq":
      return value;
    case "neq":
      return { not: value };
    case "gt":
      return { gt: value };
    case "gte":
      return { gte: value };
    case "lt":
      return { lt: value };
    case "lte":
      return { lte: value };
    case "in":
      return { in: value };
    case "contains":
      return { contains: value };
    default:
      return value;
  }
}

/**
 * Normalize a date string to ISO-8601 DateTime format
 */
export function normalizeDate(dateStr: string): string {
  // Already a full ISO datetime with timezone
  if (dateStr.endsWith("Z") || dateStr.includes("+")) {
    return dateStr;
  }
  // Has time but no timezone (e.g., "2026-02-01T00:00:00")
  if (dateStr.includes("T")) {
    // Add milliseconds and Z if missing
    if (dateStr.includes(".")) {
      return `${dateStr}Z`;
    }
    return `${dateStr}.000Z`;
  }
  // Just a date like "2024-02-01" - add time component
  return `${dateStr}T00:00:00.000Z`;
}

/**
 * Convert date strings to proper ISO-8601 DateTime format
 */
export function convertDateValue(
  field: string,
  value: unknown,
  dateFields: string[] = ["date", "createdAt", "updatedAt", "month"]
): unknown {
  // Check if this is a date field
  if (!dateFields.includes(field)) {
    return value;
  }

  // Handle string date values
  if (typeof value === "string") {
    return normalizeDate(value);
  }

  // Handle operator objects like { lt: "2024-02-01" }
  if (typeof value === "object" && value !== null) {
    const converted: Record<string, unknown> = {};
    for (const [op, opValue] of Object.entries(
      value as Record<string, unknown>
    )) {
      if (typeof opValue === "string") {
        converted[op] = normalizeDate(opValue);
      } else {
        converted[op] = opValue;
      }
    }
    return converted;
  }

  return value;
}

/**
 * Convert Prisma Decimal/string to number
 */
export function toNumber(value: unknown): number {
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    const num = Number(value);
    return isNaN(num) ? 0 : num;
  }
  if (value && typeof value === "object" && "toNumber" in value) {
    return (value as { toNumber: () => number }).toNumber();
  }
  return Number(value) || 0;
}

/**
 * Extract date part from a Date object
 */
export function extractDatePart(date: Date, part: VirtualDateField): string {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;

  switch (part) {
    case "year":
      return `${year}`;
    case "month":
      return `${year}-${String(month).padStart(2, "0")}`;
    case "day":
      return `${year}-${String(month).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
    case "week": {
      const firstDayOfYear = new Date(year, 0, 1);
      const pastDaysOfYear =
        (date.getTime() - firstDayOfYear.getTime()) / 86400000;
      const weekNum = Math.ceil(
        (pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7
      );
      return `${year}-W${String(weekNum).padStart(2, "0")}`;
    }
    case "quarter": {
      const quarter = Math.ceil(month / 3);
      return `${year}-Q${quarter}`;
    }
    default:
      return `${year}-${String(month).padStart(2, "0")}`;
  }
}

/**
 * Aggregate data in JavaScript for virtual date fields
 */
export function aggregateInMemory(
  data: Array<Record<string, unknown>>,
  type: AggregationType,
  field: string,
  by: VirtualDateField
): Array<Record<string, unknown>> {
  const groups = new Map<string, number[]>();

  for (const row of data) {
    const date =
      row.date instanceof Date ? row.date : new Date(row.date as string);
    const groupKey = extractDatePart(date, by);
    const value = Number(row[field]) || 0;

    if (!groups.has(groupKey)) {
      groups.set(groupKey, []);
    }
    groups.get(groupKey)!.push(value);
  }

  const results: Array<Record<string, unknown>> = [];

  for (const [groupKey, values] of Array.from(groups.entries())) {
    let aggValue: number;
    switch (type) {
      case "sum":
        aggValue = values.reduce((a, b) => a + b, 0);
        break;
      case "avg":
        aggValue =
          values.length > 0
            ? values.reduce((a, b) => a + b, 0) / values.length
            : 0;
        break;
      case "count":
        aggValue = values.length;
        break;
      case "min":
        aggValue = Math.min(...values);
        break;
      case "max":
        aggValue = Math.max(...values);
        break;
      default:
        aggValue = values.reduce((a, b) => a + b, 0);
    }

    results.push({
      [by]: groupKey,
      [`${field}_${type}`]: aggValue,
    });
  }

  // Sort by date key
  results.sort((a, b) => String(a[by]).localeCompare(String(b[by])));

  return results;
}

/**
 * Build Prisma aggregation options
 */
export function buildAggregationOptions(
  type: AggregationType,
  field: string
): Record<string, Record<string, boolean>> {
  const options: Record<string, Record<string, boolean>> = {};

  if (type === "sum") options._sum = { [field]: true };
  else if (type === "avg") options._avg = { [field]: true };
  else if (type === "count") options._count = { _all: true };
  else if (type === "min") options._min = { [field]: true };
  else if (type === "max") options._max = { [field]: true };

  return options;
}

/**
 * Validate aggregation type
 */
export function validateAggregationType(type: string): type is AggregationType {
  return VALID_AGGREGATION_TYPES.includes(type as AggregationType);
}

/**
 * Check if field is a virtual date field
 */
export function isVirtualDateField(field: string): field is VirtualDateField {
  return VIRTUAL_DATE_FIELDS.includes(field as VirtualDateField);
}

/**
 * Convert enum value using mappings
 */
export function convertEnumValue(
  field: string,
  value: unknown,
  enumMappings?: Record<string, Record<string, unknown>>
): unknown {
  if (!enumMappings || typeof value !== "string") {
    return value;
  }

  const fieldMappings = enumMappings[field];
  if (fieldMappings && value in fieldMappings) {
    return fieldMappings[value];
  }

  return value;
}
