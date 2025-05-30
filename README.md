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
npm install @zanreal/search
```

Or with other package managers:

```bash
# Yarn
yarn add @zanreal/search

# pnpm
pnpm add @zanreal/search

# Bun
bun add @zanreal/search
```

## Quick Start

```typescript
import { search, searchItems, quickSearch } from '@zanreal/search';

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

> 💡 **Want to see more examples?** Check out our [comprehensive examples collection](./examples/) with production-ready patterns for e-commerce, document search, user directories, and more! Run `npm run examples` for an interactive explorer.

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

## Examples & Use Cases

The `/examples` directory contains comprehensive, production-ready examples for different domains and use cases:

### 🚀 Quick Start with Examples

**Prerequisites:** Make sure you've built the library first:

```bash
npm run build
```

**Run any example instantly:**

```bash
# Interactive explorer (recommended for beginners)
npm run examples

# Individual examples
npm run examples:basic          # Basic usage patterns
npm run examples:ecommerce      # E-commerce search
npm run examples:documents      # Document/CMS search
npm run examples:users          # People directory search
npm run examples:performance    # Performance benchmarks

# Validate all examples work correctly
npm run examples:validate
```

### 📖 Example Categories

| Example | Use Case | Key Features | Best For |
|---------|----------|--------------|----------|
| **Basic Usage** | Simple search operations | Quick search, custom searcher, field weighting | Getting started, simple applications |
| **E-commerce Search** | Product catalogs | Custom scoring, price awareness, category filtering | Online stores, marketplaces |
| **Document Search** | CMS/Blog search | Nested objects, content analysis, metadata search | Content sites, documentation |
| **User Directory** | Employee/people search | Fuzzy matching, skill matching, department search | HR systems, social networks |
| **Performance Demo** | Large datasets (1000+ items) | Benchmarking, auto-complete, analytics | High-scale applications |

### 🛠️ Common Patterns

#### Quick Search Pattern

```javascript
import { quickSearch } from '@zanreal/search';

// Fastest way to search - returns just the items
const results = quickSearch(data, query);
```

#### Detailed Search Pattern

```javascript
import { search } from '@zanreal/search';

// Full control with scoring and configuration
const results = search(data, query, {
  fieldWeights: { title: 10, description: 5 },
  fuzzyThreshold: 0.7
});
```

#### Reusable Searcher Pattern

```javascript
import { createSearcher } from '@zanreal/search';

// Create once, use many times for better performance
const searcher = createSearcher({
  fieldWeights: { name: 10, email: 5 },
  fuzzyThreshold: 0.7
});

const results = searcher(data, query);
```

### ⚖️ Field Weight Guidelines

| Field Type | Weight Range | Use Case | Example |
|------------|--------------|----------|---------|
| **Primary Identifiers** | 15-20 | Names, titles, SKUs | `name: 20` |
| **Important Content** | 10-15 | Descriptions, summaries | `description: 12` |
| **Secondary Content** | 5-10 | Categories, tags | `category: 8` |
| **Searchable Text** | 3-5 | Body content, reviews | `content: 4` |
| **Auxiliary Data** | 1-3 | IDs, timestamps | `id: 1` |

### ⚡ Performance Tips

1. **Limit Results**: Use the `limit` option for large datasets
2. **Pre-filter**: Filter data before searching when possible
3. **Field Selection**: Specify `fields` array to search only relevant fields
4. **Fuzzy Threshold**: Adjust `fuzzyThreshold` based on your use case (0.7 is usually good)
5. **Caching**: Cache searcher instances for repeated use with same configuration

### 🎛️ Configuration Presets

```javascript
// Strict Matching (Exact matches preferred)
{ fuzzyThreshold: 0.9, minFuzzyLength: 5 }

// Loose Matching (Typo-tolerant)
{ fuzzyThreshold: 0.5, minFuzzyLength: 2 }

// Title-First Search (Prioritize titles/names)
{ fieldWeights: { title: 20, content: 1 } }

// Balanced Search (Equal importance)
{ fieldWeights: { title: 8, description: 5, content: 3 } }
```

For complete examples with sample data and detailed explanations, see the [`/examples`](./examples/) directory.

## 💡 Usage Ideas & Real-World Applications

The Universal Search library can be applied to a wide variety of use cases. Here are some popular applications and implementation patterns:

### 🏪 E-commerce & Marketplace

#### Product Search with Business Logic

```javascript
const productSearcher = createSearcher({
  fieldWeights: {
    name: 15,        // Product names most important
    brand: 12,       // Brand recognition
    category: 8,     // Category filtering
    tags: 10,        // Searchable attributes
    description: 3   // Supporting content
  },
  fuzzyThreshold: 0.7
});

// E-commerce with filtering
function ecommerceSearch(products, query, filters = {}) {
  let filteredData = products;
  
  if (filters.category) {
    filteredData = filteredData.filter(p => p.category === filters.category);
  }
  if (filters.maxPrice) {
    filteredData = filteredData.filter(p => p.price <= filters.maxPrice);
  }
  if (filters.inStock) {
    filteredData = filteredData.filter(p => p.inStock);
  }
  
  return productSearcher(filteredData, query);
}
```

**Use Cases:**

- Product catalogs with thousands of items
- Auto-complete search suggestions
- Category and price filtering
- Brand and feature-based discovery

### 👥 HR & People Management

#### Employee Directory Search

```javascript
const peopleSearcher = createSearcher({
  fieldWeights: {
    'profile.firstName': 10,
    'profile.lastName': 10,
    'employment.title': 15,
    'employment.department': 8,
    skills: 12,              // Converted from array to string
    bio: 5,
    'profile.email': 3
  },
  fuzzyThreshold: 0.6,       // Higher tolerance for name typos
  limit: 20
});
```

**Use Cases:**

- Employee directories with skills matching
- Department and team organization
- Project collaboration discovery
- Expertise location within organizations

### 📄 Content Management Systems

#### Document & Article Search

```javascript
const documentSearcher = createSearcher({
  fieldWeights: {
    title: 20,               // Titles are crucial
    'metadata.summary': 12,  // Executive summaries
    'content.excerpt': 8,    // Article previews
    'metadata.tags': 10,     // Topic classification
    'author.name': 5,        // Author attribution
    'content.body': 3        // Full content (lower weight)
  }
});

// Content with quality scoring
function contentSearch(documents, query) {
  const results = documentSearcher(documents, query);
  
  // Enhance with content quality metrics
  return results.map(result => ({
    ...result,
    qualityScore: result.score * (result.item.readTime > 5 ? 1.2 : 1.0),
    freshness: calculateFreshness(result.item.publishDate)
  }));
}
```

**Use Cases:**

- Blog and news site search
- Documentation and knowledge bases
- Academic paper repositories
- Content recommendation systems

### 🏢 Business Applications

#### Customer Relationship Management

```javascript
const customerSearcher = createSearcher({
  fieldWeights: {
    'company.name': 15,
    'contact.name': 12,
    'contact.email': 8,
    'details.industry': 10,
    'notes.content': 5
  }
});
```

#### Inventory Management

```javascript
const inventorySearcher = createSearcher({
  fieldWeights: {
    sku: 20,                 // Exact SKU matching critical
    name: 15,
    category: 10,
    supplier: 8,
    location: 12
  },
  fuzzyThreshold: 0.8        // Stricter for inventory
});
```

### 🎯 Specialized Use Cases

#### Real-time Auto-complete

```javascript
function autoComplete(dataset, query, limit = 5) {
  if (query.length < 2) return [];
  
  return search(dataset, query, {
    fieldWeights: { name: 15, brand: 12, category: 5 },
    fuzzyThreshold: 0.8,     // Stricter for autocomplete
    limit
  });
}
```

#### Multi-language Content

```javascript
const multiLangSearcher = createSearcher({
  fieldWeights: {
    'title.en': 10,
    'title.es': 10,
    'title.fr': 10,
    'content.en': 5,
    'content.es': 5,
    'content.fr': 5
  }
});
```

#### Location-based Search

```javascript
const locationSearcher = createSearcher({
  fieldWeights: {
    name: 15,
    'address.city': 12,
    'address.state': 10,
    'address.country': 8,
    category: 6
  }
});
```

### ⚡ Performance Patterns

#### Large Dataset Optimization

```javascript
// Pre-filter before search for better performance
const optimizedSearch = (data, query, category) => {
  const filtered = category 
    ? data.filter(item => item.category === category)
    : data;
  
  return search(filtered, query, { limit: 50 });
};
```

#### Caching for Repeated Searches

```javascript
const searchCache = new Map();

function cachedSearch(data, query, options) {
  const cacheKey = `${query}-${JSON.stringify(options)}`;
  
  if (searchCache.has(cacheKey)) {
    return searchCache.get(cacheKey);
  }
  
  const results = search(data, query, options);
  searchCache.set(cacheKey, results);
  return results;
}
```

### 🔧 Advanced Patterns

#### Search with Analytics

```javascript
function analyticsSearch(data, query, options = {}) {
  const startTime = Date.now();
  const results = search(data, query, options);
  const endTime = Date.now();
  
  const analytics = {
    query,
    resultCount: results.length,
    executionTime: endTime - startTime,
    avgScore: results.reduce((sum, r) => sum + r.score, 0) / results.length,
    topCategories: [...new Set(results.slice(0, 10).map(r => r.item.category))],
    timestamp: new Date().toISOString()
  };
  
  // Log analytics for monitoring
  console.log('Search Analytics:', analytics);
  
  return { results, analytics };
}
```

#### Progressive Search Enhancement

```javascript
function progressiveSearch(data, query) {
  // Start with strict matching
  let results = search(data, query, { fuzzyThreshold: 0.9, limit: 10 });
  
  // If insufficient results, try fuzzy matching
  if (results.length < 5) {
    results = search(data, query, { fuzzyThreshold: 0.6, limit: 20 });
  }
  
  // If still insufficient, broaden field search
  if (results.length < 3) {
    results = search(data, query, { 
      fuzzyThreshold: 0.4, 
      limit: 30,
      fields: undefined // Search all fields
    });
  }
  
  return results;
}
```

### 🎨 Industry-Specific Examples

- **Real Estate**: Property search with location, price, features
- **Healthcare**: Patient records, medication databases
- **Education**: Course catalogs, student directories
- **Legal**: Case law, document discovery
- **Media**: Asset management, content libraries
- **Finance**: Transaction search, customer portfolios
- **Tourism**: Hotel/restaurant discovery, activity search
- **Food & Beverage**: Recipe databases, ingredient matching

Each of these patterns can be customized with appropriate field weights, fuzzy thresholds, and filtering logic to match your specific domain requirements.

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

## 🔬 Benchmarks & Performance

The Universal Search library comes with a comprehensive benchmark suite to measure performance across different scenarios and data sizes. Our benchmarks help ensure the library performs well in real-world applications.

### Quick Performance Overview

| Data Size | Average Time | Operations/sec | Use Case |
|-----------|--------------|----------------|----------|
| 100 items | < 1ms        | > 1,000        | Small apps, auto-complete |
| 1K items  | < 5ms        | > 200          | Medium catalogs |
| 5K items  | < 25ms       | > 40           | Large datasets |
| 10K items | < 50ms       | > 20           | Enterprise scale |

### Running Benchmarks

**Prerequisites:** Make sure you've built the library first:

```bash
npm run build
```

**Run all benchmarks:**

```bash
# Complete benchmark suite with detailed analysis
npm run benchmark

# Quick performance check (ideal for CI/CD)
npm run benchmark:quick

# Individual benchmark types
npm run benchmark:main         # Core performance tests
npm run benchmark:comparative  # Compare different search functions
npm run benchmark:memory      # Memory usage and leak detection
```

**Advanced benchmarking with garbage collection:**

```bash
npm run benchmark:gc
```

### Benchmark Types

#### 🚀 Performance Benchmarks

Tests search speed across realistic scenarios:

- **Small Dataset (100 items)**: User directory search
- **Medium Dataset (1,000 items)**: E-commerce product search  
- **Large Dataset (5,000 items)**: Document/content search
- **XL Dataset (10,000 items)**: Enterprise-scale stress test

**Metrics measured:**

- Average response time (milliseconds)
- Operations per second (higher is better)
- Result accuracy and relevance
- Memory usage during operations

#### ⚖️ Comparative Benchmarks

Compares performance between different search functions:

```typescript
// Functions tested in comparison
search()                    // Full results with detailed scoring
searchItems()              // Items only, no score details  
quickSearch()              // Simplified search with defaults
createSearcher()           // Pre-configured reusable searcher
createDocumentSearcher()   // Document-optimized searcher
```

**Helps you choose the right function for your use case based on performance vs features trade-offs.**

#### 🧠 Memory Benchmarks

Analyzes memory efficiency and scalability:

- **Memory Usage**: Tests consumption across data sizes (100 to 10,000 items)
- **Scalability Analysis**: How performance scales with data size
- **Memory Leak Detection**: Sustained search operations to detect leaks

**Scalability ratings:**

- **Excellent (> 0.8)**: Near-linear performance scaling
- **Good (0.6-0.8)**: Performance degrades slowly  
- **Fair (0.4-0.6)**: Noticeable impact with scale
- **Poor (< 0.4)**: Significant degradation

#### 🔍 Full Suite Analysis

The complete benchmark suite provides:

- **System Information**: Environment and runtime details
- **Performance Overview**: Comprehensive timing analysis
- **Memory Efficiency**: Detailed memory usage patterns
- **Recommendations**: Performance optimization suggestions

### Real-World Performance Data

Our benchmarks use realistic data generators that simulate actual usage patterns:

#### User Directory Search

```typescript
// 1,000 users with names, emails, roles, skills
const results = search(users, 'john developer', {
  fieldWeights: { name: 10, role: 8, skills: 6 }
});
// Typical: ~2-4ms, 250-500 ops/sec
```

#### E-commerce Product Search

```typescript
// 5,000 products with names, brands, categories, descriptions
const results = search(products, 'wireless headphones', {
  fieldWeights: { name: 15, brand: 12, category: 8 }
});
// Typical: ~8-15ms, 60-125 ops/sec
```

#### Document/Content Search

```typescript
// 10,000 articles with titles, content, tags, metadata
const results = search(documents, 'typescript tutorial', {
  fieldWeights: { title: 20, tags: 10, content: 3 }
});
// Typical: ~20-40ms, 25-50 ops/sec
```

### Performance Optimization Tips

Based on benchmark results, here are proven optimization strategies:

#### 🎯 Field Selection

```typescript
// ✅ Good: Specify relevant fields only
search(data, query, { fields: ['name', 'title', 'category'] })

// ❌ Avoid: Searching all fields unnecessarily  
search(data, query) // Auto-detects ALL string fields
```

#### ⚡ Smart Limiting

```typescript
// ✅ Good: Limit results for better performance
search(data, query, { limit: 20 })

// ❌ Avoid: Unlimited results on large datasets
search(largeData, query) // Returns up to 100 by default
```

#### 🔄 Reusable Searchers

```typescript
// ✅ Good: Create once, use many times
const searcher = createSearcher({ fieldWeights: {...} });
const results1 = searcher(data, 'query1');
const results2 = searcher(data, 'query2'); // Reuses config

// ❌ Avoid: Recreating configuration each time
search(data, 'query1', options);
search(data, 'query2', options); // Recreates config
```

#### 🎚️ Threshold Tuning

```typescript
// ✅ Good: Tune fuzzy threshold for your use case
search(data, query, { 
  fuzzyThreshold: 0.8  // Stricter for exact matching
  fuzzyThreshold: 0.6  // More forgiving for typos
})
```

### Memory Efficiency Guidelines

Our memory benchmarks show these patterns:

| Data Size | Memory Usage | Memory/Item | Efficiency |
|-----------|--------------|-------------|------------|
| 100 items | ~2-4 MB      | ~20-40 KB   | Excellent  |
| 1K items  | ~8-15 MB     | ~8-15 KB    | Good       |
| 5K items  | ~25-40 MB    | ~5-8 KB     | Good       |
| 10K items | ~45-70 MB    | ~4.5-7 KB   | Fair       |

**Memory leak detection results:** < 5% memory growth over 100 iterations ✅

### CI/CD Integration

Integrate benchmarks into your CI/CD pipeline:

```yaml
# Example GitHub Actions step
- name: Run Performance Benchmarks
  run: |
    npm run build
    npm run benchmark:quick > benchmark-results.txt
    # Add custom logic to compare with baseline
```

### Benchmark Data Generators

The benchmark suite includes realistic data generators:

- **`generateUsers(count)`**: User directory with profiles, skills, departments
- **`generateProducts(count)`**: E-commerce with brands, categories, pricing  
- **`generateDocuments(count)`**: Articles with content, metadata, tags

For detailed benchmark documentation and advanced usage, see [`/benchmarks/README.md`](./benchmarks/README.md).

### Performance Monitoring

Track performance in your application:

```typescript
function monitoredSearch(data, query, options = {}) {
  const start = performance.now();
  const results = search(data, query, options);
  const duration = performance.now() - start;
  
  console.log(`Search completed in ${duration.toFixed(2)}ms`);
  console.log(`Found ${results.length} results`);
  
  return results;
}
```

---
