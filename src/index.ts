/**
 * Universal Search Engine
 * Provides fuzzy search with intelligent scoring, exact match prioritization,
 * and automatic field detection for any object structure.
 */

export interface SearchOptions {
  /** Fields to search in (if not provided, will search all string fields) */
  fields?: string[];
  /** Custom field weights (higher = more important) */
  fieldWeights?: Record<string, number>;
  /** Minimum similarity threshold for fuzzy matching (0-1) */
  fuzzyThreshold?: number;
  /** Minimum query length for fuzzy matching */
  minFuzzyLength?: number;
  /** Maximum number of results to return */
  limit?: number;
  /** Case sensitive search */
  caseSensitive?: boolean;
}

/** Exported default search options */
export const DEFAULT_SEARCH_OPTIONS = {
  fieldWeights: {} as Record<string, number>,
  fuzzyThreshold: 0.7,
  minFuzzyLength: 3,
  limit: 100,
  caseSensitive: false,
};

export interface SearchResult<T> {
  item: T;
  score: number;
  matches: SearchMatch[];
}

export interface SearchMatch {
  field: string;
  value: string;
  score: number;
  type: "exact-start" | "exact-contain" | "fuzzy";
  position?: number;
}

/**
 * Calculate Levenshtein distance between two strings
 * Optimized to use O(min(m,n)) space instead of O(m*n)
 */
function levenshteinDistance(str1: string, str2: string): number {
  // Ensure str1 is the shorter string to minimize memory usage
  if (str1.length > str2.length) {
    [str1, str2] = [str2, str1];
  }

  const len1 = str1.length;
  const len2 = str2.length;

  // Use only two arrays instead of a 2D matrix
  let prevRow = new Array(len1 + 1);
  let currRow = new Array(len1 + 1);

  // Initialize first row
  for (let i = 0; i <= len1; i++) {
    prevRow[i] = i;
  }

  for (let i = 1; i <= len2; i++) {
    currRow[0] = i;

    for (let j = 1; j <= len1; j++) {
      const cost = str1[j - 1] === str2[i - 1] ? 0 : 1;
      currRow[j] = Math.min(
        prevRow[j] + 1,     // deletion
        currRow[j - 1] + 1, // insertion
        prevRow[j - 1] + cost // substitution
      );
    }

    // Swap arrays for next iteration
    [prevRow, currRow] = [currRow, prevRow];
  }

  return prevRow[len1];
}

/**
 * Get nested value from object using dot notation
 */
function getNestedValue(obj: any, path: string): string {
  return (
    path.split(".").reduce((current, key) => {
      if (current && typeof current === "object" && key in current) {
        return current[key];
      }
      return "";
    }, obj) ?? ""
  );
}

// Global cache for field detection to avoid repeated computation
const fieldDetectionCache = new WeakMap<any, string[]>();

// Global cache for processed strings to reduce memory allocation
const stringProcessingCache = new Map<string, string>();
const MAX_STRING_CACHE_SIZE = 500;

// Global cache for field statistics to avoid recomputation  
const fieldStatsCache = new WeakMap<any[], Map<string, { avgLength: number; weight: number }>>();

/**
 * Automatically detect searchable string fields in an object with caching
 */
function detectStringFields(obj: any, prefix = "", maxDepth = 3): string[] {
  if (maxDepth <= 0 || !obj || typeof obj !== "object") {
    return [];
  }

  // Check cache first for the root object
  if (prefix === "" && fieldDetectionCache.has(obj)) {
    return fieldDetectionCache.get(obj)!;
  }

  const fields: string[] = [];

  for (const [key, value] of Object.entries(obj)) {
    const fieldPath = prefix ? `${prefix}.${key}` : key;

    if (typeof value === "string" && value.length > 0) {
      fields.push(fieldPath);
    } else if (
      typeof value === "object" &&
      value !== null &&
      !Array.isArray(value)
    ) {
      fields.push(...detectStringFields(value, fieldPath, maxDepth - 1));
    }
  }

  // Cache the result for the root object
  if (prefix === "") {
    fieldDetectionCache.set(obj, fields);
  }

  return fields;
}

/**
 * Get processed (lowercased) string with caching and aggressive cleanup
 */
function getProcessedString(str: string, caseSensitive: boolean): string {
  if (caseSensitive) return str;

  const cacheKey = `lc:${str}`;
  if (stringProcessingCache.has(cacheKey)) {
    return stringProcessingCache.get(cacheKey)!;
  }

  const processed = str.toLowerCase();

  // More aggressive cache size management
  if (stringProcessingCache.size >= MAX_STRING_CACHE_SIZE) {
    // Clear oldest entries (simple LRU-like behavior)
    const keysToDelete = Array.from(stringProcessingCache.keys()).slice(0, MAX_STRING_CACHE_SIZE / 2);
    keysToDelete.forEach(key => stringProcessingCache.delete(key));
  }

  stringProcessingCache.set(cacheKey, processed);
  return processed;
}

/**
 * Calculate match score for a text field against a query
 * Optimized to reduce memory allocations
 */
function calculateFieldScore(
  text: string,
  query: string,
  fieldWeight: number,
  options: Required<
    Pick<SearchOptions, "fuzzyThreshold" | "minFuzzyLength" | "caseSensitive">
  >,
): SearchMatch | null {
  if (!text || !query) return null;

  const searchText = getProcessedString(text, options.caseSensitive);
  const searchQuery = getProcessedString(query, options.caseSensitive);

  // Exact match from start (highest priority)
  if (searchText.startsWith(searchQuery)) {
    return {
      field: "",
      value: text,
      score: fieldWeight * 20, // Highest multiplier for exact start matches
      type: "exact-start",
      position: 0,
    };
  }

  // Exact match anywhere
  const position = searchText.indexOf(searchQuery);
  if (position !== -1) {
    // Earlier positions get higher scores, with length bonus for shorter strings
    const lengthBonus = Math.max(1, 100 / text.length); // Shorter strings get bonus
    const positionPenalty = position * 0.1;
    const score = fieldWeight * (10 + lengthBonus - positionPenalty);

    return {
      field: "",
      value: text,
      score: Math.max(score, fieldWeight), // Minimum score of base weight
      type: "exact-contain",
      position,
    };
  }

  // Fuzzy matching for misspellings - optimized to reduce string operations
  if (searchQuery.length >= options.minFuzzyLength) {
    // Use a more efficient word splitting approach
    let bestMatch: SearchMatch | null = null;
    let wordStart = 0;

    for (let i = 0; i <= searchText.length; i++) {
      const char = searchText[i];
      if (i === searchText.length || (char && /\s/.test(char))) {
        if (i - wordStart >= 3) {
          const word = searchText.slice(wordStart, i);
          const distance = levenshteinDistance(word, searchQuery);
          const maxLength = Math.max(word.length, searchQuery.length);
          const similarity = (maxLength - distance) / maxLength;

          if (similarity >= options.fuzzyThreshold) {
            const lengthBonus = Math.max(1, 50 / text.length);
            const score = fieldWeight * similarity * (2 + lengthBonus);

            if (!bestMatch || score > bestMatch.score) {
              bestMatch = {
                field: "",
                value: text,
                score,
                type: "fuzzy",
              };
            }
          }
        }
        wordStart = i + 1;
      }
    }

    return bestMatch;
  }

  return null;
}

let searchCallCount = 0;

/**
 * Universal search function that works with any data structure
 * Optimized for memory efficiency and performance
 */
export function search<T>(
  data: T[],
  query: string,
  options: SearchOptions = {},
): SearchResult<T>[] {
  // Periodic cache cleanup every 100 search calls
  searchCallCount++;
  if (searchCallCount % 100 === 0) {
    // Force a more aggressive cache cleanup
    if (stringProcessingCache.size > MAX_STRING_CACHE_SIZE / 2) {
      const keysToDelete = Array.from(stringProcessingCache.keys()).slice(0, MAX_STRING_CACHE_SIZE / 4);
      keysToDelete.forEach(key => stringProcessingCache.delete(key));
    }
  }

  if (!query.trim())
    return data.map((item) => ({ item, score: 0, matches: [] }));

  const {
    fields,
    fieldWeights = DEFAULT_SEARCH_OPTIONS.fieldWeights,
    fuzzyThreshold = DEFAULT_SEARCH_OPTIONS.fuzzyThreshold,
    minFuzzyLength = DEFAULT_SEARCH_OPTIONS.minFuzzyLength,
    limit = DEFAULT_SEARCH_OPTIONS.limit,
    caseSensitive = DEFAULT_SEARCH_OPTIONS.caseSensitive,
  } = options;

  const searchQuery = query.trim();
  const searchOptions = { fuzzyThreshold, minFuzzyLength, caseSensitive };

  // Auto-detect fields if not provided (with caching)
  const searchFields =
    fields || (data.length > 0 ? detectStringFields(data[0]) : []);

  // Get or calculate field statistics with caching
  let fieldStats: Map<string, { avgLength: number; weight: number }>;

  if (fieldStatsCache.has(data)) {
    fieldStats = fieldStatsCache.get(data)!;
  } else {
    fieldStats = new Map();

    // Calculate average length for each field across all data items
    const calculateFieldStats = (
      fieldPath: string,
    ): { avgLength: number; weight: number } => {
      let totalLength = 0;
      let count = 0;

      // Sample only first 100 items for performance on large datasets
      const sampleSize = Math.min(data.length, 100);
      for (let i = 0; i < sampleSize; i++) {
        const item = data[i];
        const text = getNestedValue(item, fieldPath);
        if (text && typeof text === "string" && text.length > 0) {
          totalLength += text.length;
          count++;
        }
      }

      const avgLength = count > 0 ? totalLength / count : 0;

      // Calculate weight based on field name and average length
      const fieldName = fieldPath.split(".").pop()?.toLowerCase() ?? "";
      let baseWeight = 1;

      // Higher weight for common important fields
      if (["title", "name", "heading"].includes(fieldName)) baseWeight = 5;
      else if (["description", "summary", "subtitle"].includes(fieldName))
        baseWeight = 3;
      else if (["content", "body", "text"].includes(fieldName)) baseWeight = 1;

      // Prioritize fields with shorter average length (likely more important)
      let lengthWeight = 1;
      if (avgLength < 50)
        lengthWeight = 2.0; // Very short fields (titles)
      else if (avgLength < 100)
        lengthWeight = 1.5; // Short fields (subtitles)
      else if (avgLength < 300)
        lengthWeight = 1.2; // Medium fields (descriptions)
      else lengthWeight = 1.0; // Long fields (content)

      return {
        avgLength,
        weight: baseWeight * lengthWeight,
      };
    };

    // Pre-calculate field statistics for weight determination
    for (const field of searchFields) {
      fieldStats.set(field, calculateFieldStats(field));
    }

    // Cache the field stats
    fieldStatsCache.set(data, fieldStats);
  }

  const results: SearchResult<T>[] = [];
  const maxResults = limit ? limit * 3 : data.length; // Get more than needed for better sorting

  for (let itemIndex = 0; itemIndex < data.length; itemIndex++) {
    const item = data[itemIndex];
    if (!item) continue; // Skip undefined items

    const matches: SearchMatch[] = [];
    let totalScore = 0;

    for (const field of searchFields) {
      const text = getNestedValue(item, field);
      if (!text) continue;

      // Determine field weight
      const explicitWeight = fieldWeights[field];
      const fieldStat = fieldStats.get(field);
      const defaultWeight = explicitWeight ?? fieldStat?.weight ?? 1;

      const match = calculateFieldScore(
        text,
        searchQuery,
        defaultWeight,
        searchOptions,
      );

      if (match) {
        match.field = field;
        matches.push(match);
        totalScore += match.score;
      }
    }

    if (matches.length > 0) {
      results.push({
        item,
        score: totalScore,
        matches,
      });
    }

    // Early termination for large datasets
    if (results.length >= maxResults) {
      break;
    }
  }

  // Sort by score (descending), then by total text length (ascending for ties)
  results.sort((a, b) => {
    if (a.score !== b.score) {
      return b.score - a.score;
    }

    // For equal scores, prefer items with shorter total text (likely more relevant)
    const aTotalLength = a.matches.reduce(
      (sum, match) => sum + match.value.length,
      0,
    );
    const bTotalLength = b.matches.reduce(
      (sum, match) => sum + match.value.length,
      0,
    );

    return aTotalLength - bTotalLength;
  });

  return limit ? results.slice(0, limit) : results;
}

/**
 * Simplified search function that returns just the items
 */
export function searchItems<T>(
  data: T[],
  query: string,
  options: SearchOptions = {},
): T[] {
  return search(data, query, options).map((result) => result.item);
}

/**
 * Search with field-specific configuration
 */
export function createSearcher<T>(config: SearchOptions) {
  return (data: T[], query: string, overrides: Partial<SearchOptions> = {}) => {
    return search(data, query, { ...config, ...overrides });
  };
}

/**
 * Create a search function with common default options for documents
 */
export function createDocumentSearcher<T>() {
  return createSearcher<T>({
    fieldWeights: DEFAULT_SEARCH_OPTIONS.fieldWeights,
    fuzzyThreshold: DEFAULT_SEARCH_OPTIONS.fuzzyThreshold,
    minFuzzyLength: DEFAULT_SEARCH_OPTIONS.minFuzzyLength,
    limit: DEFAULT_SEARCH_OPTIONS.limit,
    caseSensitive: DEFAULT_SEARCH_OPTIONS.caseSensitive,
  });
}

/**
 * Quick search function with sensible defaults for most use cases
 */
export function quickSearch<T>(
  data: T[],
  query: string,
  fields?: string[],
): T[] {
  return searchItems(data, query, {
    fields,
    fieldWeights: DEFAULT_SEARCH_OPTIONS.fieldWeights,
    fuzzyThreshold: DEFAULT_SEARCH_OPTIONS.fuzzyThreshold,
    minFuzzyLength: DEFAULT_SEARCH_OPTIONS.minFuzzyLength,
    limit: DEFAULT_SEARCH_OPTIONS.limit,
    caseSensitive: DEFAULT_SEARCH_OPTIONS.caseSensitive,
  });
}

/**
 * Clear all internal caches to free memory
 * Useful for long-running applications or when switching between different datasets
 */
export function clearSearchCaches(): void {
  stringProcessingCache.clear();
  searchCallCount = 0; // Reset counter
  // Note: WeakMaps (fieldDetectionCache, fieldStatsCache) will be cleared automatically by GC
}

/**
 * Get cache statistics for monitoring memory usage
 */
export function getCacheStats(): {
  stringProcessingCacheSize: number;
  searchCallCount: number;
} {
  return {
    stringProcessingCacheSize: stringProcessingCache.size,
    searchCallCount,
  };
}
