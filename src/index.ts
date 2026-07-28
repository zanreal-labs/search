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

/** Scoring options once every default has been applied */
type ScoringOptions = Required<
  Pick<SearchOptions, "fuzzyThreshold" | "minFuzzyLength" | "caseSensitive">
>;

/** Pre-computed statistics used to derive a field's default weight */
interface FieldStats {
  avgLength: number;
  weight: number;
}

/** Everything a single item needs in order to be scored against a query */
interface ScoringContext {
  searchQuery: string;
  searchFields: string[];
  fieldWeights: Record<string, number>;
  fieldStats: Map<string, FieldStats>;
  options: ScoringOptions;
}

/** Words shorter than this are never fuzzy matched */
const MIN_FUZZY_WORD_LENGTH = 3;

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
 * Returns whatever the path resolves to, which is not always a string when
 * callers pass explicit field paths, so every caller has to narrow it
 */
function getNestedValue(obj: any, path: string): unknown {
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
const fieldStatsCache = new WeakMap<any[], Map<string, FieldStats>>();

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
 * Check whether the character at "index" ends a word (whitespace or end of text)
 */
function isWordBoundary(text: string, index: number): boolean {
  return index === text.length || /\s/.test(text[index] ?? "");
}

/**
 * Similarity ratio (0-1) of two words, derived from their Levenshtein distance
 */
function wordSimilarity(word: string, query: string): number {
  const distance = levenshteinDistance(word, query);
  const maxLength = Math.max(word.length, query.length);
  return (maxLength - distance) / maxLength;
}

/**
 * Find the closest fuzzy word match inside a text field
 * Walks the text in place instead of allocating an array of words
 */
function findBestFuzzyMatch(
  searchText: string,
  searchQuery: string,
  text: string,
  fieldWeight: number,
  fuzzyThreshold: number,
): SearchMatch | null {
  let bestMatch: SearchMatch | null = null;
  let wordStart = 0;

  for (let i = 0; i <= searchText.length; i++) {
    if (!isWordBoundary(searchText, i)) continue;

    const word = searchText.slice(wordStart, i);
    wordStart = i + 1;

    if (word.length < MIN_FUZZY_WORD_LENGTH) continue;

    const similarity = wordSimilarity(word, searchQuery);
    if (similarity < fuzzyThreshold) continue;

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

  return bestMatch;
}

/**
 * Calculate match score for a text field against a query
 * Optimized to reduce memory allocations
 */
function calculateFieldScore(
  text: string,
  query: string,
  fieldWeight: number,
  options: ScoringOptions,
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
    return findBestFuzzyMatch(
      searchText,
      searchQuery,
      text,
      fieldWeight,
      options.fuzzyThreshold,
    );
  }

  return null;
}

let searchCallCount = 0;

/**
 * Count this search call and periodically shrink the string cache
 */
function trackSearchCall(): void {
  searchCallCount++;

  // Periodic cache cleanup every 100 search calls
  if (searchCallCount % 100 !== 0) return;

  // Force a more aggressive cache cleanup
  if (stringProcessingCache.size > MAX_STRING_CACHE_SIZE / 2) {
    const keysToDelete = Array.from(stringProcessingCache.keys()).slice(0, MAX_STRING_CACHE_SIZE / 4);
    keysToDelete.forEach(key => stringProcessingCache.delete(key));
  }
}

/**
 * Use the requested fields, or auto-detect them from the first item
 */
function resolveSearchFields<T>(data: T[], fields?: string[]): string[] {
  if (fields) return fields;
  return data.length > 0 ? detectStringFields(data[0]) : [];
}

/**
 * Higher weight for field names that usually carry the most meaning
 */
function baseWeightForField(fieldName: string): number {
  if (["title", "name", "heading"].includes(fieldName)) return 5;
  if (["description", "summary", "subtitle"].includes(fieldName)) return 3;
  // "content", "body" and "text" keep the base weight, like any unknown field
  return 1;
}

/**
 * Prioritize fields with shorter average length (likely more important)
 */
function lengthWeightForAvgLength(avgLength: number): number {
  if (avgLength < 50) return 2.0; // Very short fields (titles)
  if (avgLength < 100) return 1.5; // Short fields (subtitles)
  if (avgLength < 300) return 1.2; // Medium fields (descriptions)
  return 1.0; // Long fields (content)
}

/**
 * Calculate average length and weight for a field across the data
 */
function computeFieldStats<T>(data: T[], fieldPath: string): FieldStats {
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

  return {
    avgLength,
    weight: baseWeightForField(fieldName) * lengthWeightForAvgLength(avgLength),
  };
}

/**
 * Get field statistics for a dataset, computing them once and caching the result
 */
function getFieldStats<T>(
  data: T[],
  searchFields: string[],
): Map<string, FieldStats> {
  const cached = fieldStatsCache.get(data);
  if (cached) return cached;

  const fieldStats = new Map<string, FieldStats>();

  // Pre-calculate field statistics for weight determination
  for (const field of searchFields) {
    fieldStats.set(field, computeFieldStats(data, field));
  }

  fieldStatsCache.set(data, fieldStats);
  return fieldStats;
}

/**
 * Score a single item against the query, or null when nothing matched
 */
function scoreItem<T>(item: T, context: ScoringContext): SearchResult<T> | null {
  const { searchQuery, searchFields, fieldWeights, fieldStats, options } =
    context;

  const matches: SearchMatch[] = [];
  let totalScore = 0;

  for (const field of searchFields) {
    const text = getNestedValue(item, field);
    // Explicit field paths can resolve to numbers, booleans or objects
    if (typeof text !== "string" || !text) continue;

    // Determine field weight
    const fieldWeight =
      fieldWeights[field] ?? fieldStats.get(field)?.weight ?? 1;

    const match = calculateFieldScore(text, searchQuery, fieldWeight, options);
    if (!match) continue;

    match.field = field;
    matches.push(match);
    totalScore += match.score;
  }

  if (matches.length === 0) return null;

  return {
    item,
    score: totalScore,
    matches,
  };
}

/**
 * Sort by score (descending), then by total text length (ascending for ties)
 */
function compareResults<T>(a: SearchResult<T>, b: SearchResult<T>): number {
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
}

/**
 * Universal search function that works with any data structure
 * Optimized for memory efficiency and performance
 */
export function search<T>(
  data: T[],
  query: string,
  options: SearchOptions = {},
): SearchResult<T>[] {
  trackSearchCall();

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

  // Auto-detect fields if not provided (with caching)
  const searchFields = resolveSearchFields(data, fields);

  const context: ScoringContext = {
    searchQuery: query.trim(),
    searchFields,
    fieldWeights,
    // Get or calculate field statistics with caching
    fieldStats: getFieldStats(data, searchFields),
    options: { fuzzyThreshold, minFuzzyLength, caseSensitive },
  };

  const results: SearchResult<T>[] = [];
  const maxResults = limit ? limit * 3 : data.length; // Get more than needed for better sorting

  for (const item of data) {
    if (!item) continue; // Skip undefined items

    const result = scoreItem(item, context);
    if (result) results.push(result);

    // Early termination for large datasets
    if (results.length >= maxResults) {
      break;
    }
  }

  results.sort(compareResults);

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
