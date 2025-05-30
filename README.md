# Universal Search Engine

A powerful TypeScript fuzzy search library with intelligent scoring, exact match prioritization, and automatic field detection for any object structure.

## Features

- **Universal Search**: Works with any data structure without configuration
- **Intelligent Scoring**: Prioritizes exact matches, then fuzzy matches with smart weighting
- **Automatic Field Detection**: Automatically finds searchable string fields in your objects
- **Nested Object Support**: Search through nested properties using dot notation
- **Customizable Weights**: Define field importance with custom weights
- **Multiple Search Types**: Exact start matches, exact contains, and fuzzy matching
- **TypeScript First**: Full TypeScript support with comprehensive type definitions

## Installation

```bash
npm install @zanreal/universal-search
```

Or with other package managers:

```bash
# Yarn
yarn add @zanreal/universal-search

# pnpm
pnpm add @zanreal/universal-search

# Bun
bun add @zanreal/universal-search
```

## Quick Start

```typescript
import { search, searchItems, quickSearch } from '@zanreal/universal-search';

// Simple search - returns just the matching items
const data = [
  { name: 'John Doe', email: 'john@example.com' },
  { name: 'Jane Smith', email: 'jane@example.com' }
];

const results = quickSearch(data, 'john');
// Returns: [{ name: 'John Doe', email: 'john@example.com' }]

// Detailed search - returns items with scores and match details
const detailedResults = search(data, 'john');
// Returns: [{ item: {...}, score: 15.2, matches: [...] }]
```

## API Reference

### Core Functions

#### `search<T>(data: T[], query: string, options?: SearchOptions): SearchResult<T>[]`

The main search function that returns detailed results with scores and match information.

```typescript
const results = search(users, 'john', {
  fields: ['name', 'email'],
  fieldWeights: { name: 5, email: 1 },
  fuzzyThreshold: 0.7,
  limit: 10
});
```

#### `searchItems<T>(data: T[], query: string, options?: SearchOptions): T[]`

Simplified search that returns just the matching items.

```typescript
const items = searchItems(users, 'john', {
  fields: ['name', 'email']
});
```

#### `quickSearch<T>(data: T[], query: string, fields?: string[]): T[]`

Quick search with sensible defaults for most use cases.

```typescript
const results = quickSearch(users, 'john', ['name', 'email']);
```

### Factory Functions

#### `createSearcher<T>(config: SearchOptions)`

Create a reusable search function with predefined configuration.

```typescript
const searchUsers = createSearcher<User>({
  fieldWeights: { name: 5, email: 2, bio: 1 },
  fuzzyThreshold: 0.8
});

const results = searchUsers(users, 'john');
```

#### `createDocumentSearcher<T>()`

Create a document searcher with common defaults.

```typescript
const searchDocs = createDocumentSearcher<Document>();
const results = searchDocs(documents, 'typescript');
```

## Search Options

```typescript
interface SearchOptions {
  /** Fields to search in (auto-detected if not provided) */
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
```

## Search Results

```typescript
interface SearchResult<T> {
  item: T;           // The matching item
  score: number;     // Relevance score
  matches: SearchMatch[]; // Detailed match information
}

interface SearchMatch {
  field: string;     // Which field matched
  value: string;     // The field value
  score: number;     // Match score for this field
  type: "exact-start" | "exact-contain" | "fuzzy";
  position?: number; // Position of match in string
}
```

## Advanced Usage

### Nested Object Search

```typescript
const data = [
  {
    user: { name: 'John', profile: { title: 'Developer' } },
    company: { name: 'Tech Corp' }
  }
];

// Automatically searches nested fields: user.name, user.profile.title, company.name
const results = search(data, 'developer');
```

### Custom Field Weights

```typescript
const results = search(articles, 'typescript', {
  fieldWeights: {
    title: 10,        // Highest priority
    summary: 5,       // Medium priority
    content: 1        // Lower priority
  }
});
```

### Field-Specific Configuration

```typescript
const searchConfig = {
  fields: ['title', 'author.name', 'tags'],
  fieldWeights: { title: 8, 'author.name': 3, tags: 2 },
  fuzzyThreshold: 0.8,
  limit: 20
};

const searcher = createSearcher<Article>(searchConfig);
const results = searcher(articles, query);
```

## Match Types & Scoring

1. **Exact Start Match** (Highest Score): Query matches from the beginning of the field
2. **Exact Contains Match** (High Score): Query found anywhere in the field
3. **Fuzzy Match** (Lower Score): Similar strings based on Levenshtein distance

The library automatically adjusts scores based on:

- Field importance (via weights)
- Match position (earlier = better)
- Field length (shorter fields get bonus)
- String similarity (for fuzzy matches)

## Default Options

```typescript
export const DEFAULT_SEARCH_OPTIONS = {
  fieldWeights: {},
  fuzzyThreshold: 0.7,
  minFuzzyLength: 3,
  limit: 100,
  caseSensitive: false,
};
```

## Development

This project uses Bun for fast TypeScript execution and development.

```bash
# Install dependencies
bun install

# Run TypeScript directly
bun run src/index.ts
```

## TypeScript Support

The library is built with TypeScript and provides full type safety:

```typescript
interface User {
  id: number;
  name: string;
  email: string;
}

// Full type inference and safety
const users: User[] = [...];
const results: SearchResult<User>[] = search(users, 'query');
const items: User[] = searchItems(users, 'query');
```
