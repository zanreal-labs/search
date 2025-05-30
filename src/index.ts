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
 */
function levenshteinDistance(str1: string, str2: string): number {
  const matrix: number[][] = Array.from({ length: str2.length + 1 }, () =>
    Array.from({ length: str1.length + 1 }, () => 0),
  );

  for (let i = 0; i <= str1.length; i++) {
    matrix[0]![i] = i;
  }
  for (let j = 0; j <= str2.length; j++) {
    matrix[j]![0] = j;
  }

  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      const cost = str1[j - 1] === str2[i - 1] ? 0 : 1;
      const deletion = matrix[i - 1]![j]! + 1;
      const insertion = matrix[i]![j - 1]! + 1;
      const substitution = matrix[i - 1]![j - 1]! + cost;

      matrix[i]![j] = Math.min(deletion, insertion, substitution);
    }
  }

  return matrix[str2.length]![str1.length]!;
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

/**
 * Automatically detect searchable string fields in an object
 */
function detectStringFields(obj: any, prefix = "", maxDepth = 3): string[] {
  if (maxDepth <= 0 || !obj || typeof obj !== "object") {
    return [];
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

  return fields;
}

/**
 * Calculate match score for a text field against a query
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

  const searchText = options.caseSensitive ? text : text.toLowerCase();
  const searchQuery = options.caseSensitive ? query : query.toLowerCase();

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
  if (searchText.includes(searchQuery)) {
    const position = searchText.indexOf(searchQuery);
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

  // Fuzzy matching for misspellings
  if (searchQuery.length >= options.minFuzzyLength) {
    const words = searchText.split(/\s+/);
    let bestMatch: SearchMatch | null = null;

    for (const word of words) {
      if (word.length >= 3) {
        const distance = levenshteinDistance(word, searchQuery);
        const maxLength = Math.max(word.length, searchQuery.length);
        const similarity = (maxLength - distance) / maxLength;

        if (similarity >= options.fuzzyThreshold) {
          const lengthBonus = Math.max(1, 50 / text.length); // Shorter strings get bonus
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
    }

    return bestMatch;
  }

  return null;
}

/**
 * Universal search function that works with any data structure
 */
export function search<T>(
  data: T[],
  query: string,
  options: SearchOptions = {},
): SearchResult<T>[] {
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

  // Auto-detect fields if not provided
  const searchFields =
    fields || (data.length > 0 ? detectStringFields(data[0]) : []);

  // Calculate average length for each field across all data items
  const calculateFieldStats = (
    fieldPath: string,
  ): { avgLength: number; weight: number } => {
    let totalLength = 0;
    let count = 0;

    for (const item of data) {
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
  const fieldStats = new Map<string, { avgLength: number; weight: number }>();
  for (const field of searchFields) {
    fieldStats.set(field, calculateFieldStats(field));
  }

  const results: SearchResult<T>[] = [];

  for (const item of data) {
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
