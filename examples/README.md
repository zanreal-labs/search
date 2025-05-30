# 📚 Universal Search Examples Catalog

Welcome to the comprehensive examples catalog for the Universal Search library! This directory contains real-world examples, patterns, and use cases to help you get started quickly and implement powerful search functionality in your applications.

## 🚀 Quick Start

**Prerequisites:** Make sure you've built the library first:

```bash
npm run build
```

**Run any example instantly:**

```bash
# Basic usage patterns
node examples/basic-usage.mjs

# E-commerce search
node examples/advanced-search.mjs

# Document/CMS search
node examples/document-search.mjs

# People directory search
node examples/user-directory.mjs

# Performance benchmarks
node examples/performance-demo.mjs
```

## 📖 Example Categories

### 🔰 Beginner Examples

| Example | Use Case | Key Features |
|---------|----------|--------------|
| **Basic Usage** | Simple search operations | Quick search, custom searcher, field weighting |
| **Document Search** | CMS/Blog search | Nested objects, content analysis, metadata search |

### 🏪 Business Use Cases

| Example | Use Case | Key Features |
|---------|----------|--------------|
| **Advanced Search** | E-commerce products | Custom scoring, price awareness, category filtering |
| **User Directory** | Employee/people search | Fuzzy matching, skill matching, department search |

### ⚡ Performance Examples

| Example | Use Case | Key Features |
|---------|----------|--------------|
| **Performance Demo** | Large datasets (1000+ items) | Benchmarking, auto-complete, analytics |

## 📋 Detailed Example Guide

### 1. Basic Usage (`basic-usage.mjs`)

**Perfect for:** Learning the fundamentals, simple applications

**Features Demonstrated:**

- `quickSearch()` for immediate results
- `search()` for detailed scoring
- `createSearcher()` for reusable configurations
- Basic field weighting strategies

**Sample Data:** User profiles with nested objects

**Key Learning Points:**

- How to perform basic searches
- Understanding search results structure
- Creating custom search configurations

---

### 2. Advanced Search (`advanced-search.mjs`)

**Perfect for:** E-commerce sites, product catalogs, marketplace applications

**Features Demonstrated:**

- Complex field weight configurations
- Custom scoring algorithms optimized for products
- Price-aware search implementations
- Category-based filtering and sorting
- Fuzzy matching for handling typos in product searches

**Sample Data:** E-commerce product catalog with pricing, categories, and descriptions

**Key Learning Points:**

- Optimizing search for commercial applications
- Balancing relevance vs. business metrics (price, popularity)
- Handling product-specific search scenarios

---

### 3. Document Search (`document-search.mjs`)

**Perfect for:** Content management systems, blogs, documentation sites, academic databases

**Features Demonstrated:**

- Deep nested object traversal and searching
- Content length and quality consideration
- Author and metadata-based searching
- Multi-term query processing
- Document-specific field weighting strategies

**Sample Data:** Articles, blog posts, and documents with rich metadata

**Key Learning Points:**

- Searching complex document structures
- Balancing content vs. metadata relevance
- Optimizing for editorial and academic content

---

### 4. User Directory (`user-directory.mjs`)

**Perfect for:** HR systems, employee directories, social networks, team collaboration tools

**Features Demonstrated:**

- People-optimized search algorithms
- Fuzzy name matching with high typo tolerance
- Skill and expertise-based matching
- Department and organizational hierarchy search
- Project and collaboration finding

**Sample Data:** Employee profiles with skills, departments, and project history

**Key Learning Points:**

- Optimizing search for human names and attributes
- Handling typos and variations in people search
- Building organizational and skill-based discovery

---

### 5. Performance Demo (`performance-demo.mjs`)

**Perfect for:** Large-scale applications, real-time search, performance-critical systems

**Features Demonstrated:**

- Large dataset handling (1000+ items)
- Performance benchmarking and optimization
- Real-time auto-complete functionality
- Search analytics and insights
- Production-ready search patterns

**Sample Data:** Large product catalog with performance metrics

**Key Learning Points:**

- Optimizing search for large datasets
- Implementing real-time search suggestions
- Measuring and improving search performance
- Building production-ready search experiences

## 🛠️ Common Patterns & Recipes

### Quick Search Pattern

```javascript
import { quickSearch } from '@zanreal/universal-search';

// Fastest way to search - returns just the items
const results = quickSearch(data, query);
```

### Detailed Search Pattern

```javascript
import { search } from '@zanreal/universal-search';

// Full control with scoring and configuration
const results = search(data, query, {
  fieldWeights: { title: 10, description: 5 },
  fuzzyThreshold: 0.7
});
```

### Reusable Searcher Pattern

```javascript
import { createSearcher } from '@zanreal/universal-search';

// Create once, use many times for better performance
const searcher = createSearcher({
  fieldWeights: { name: 10, email: 5 },
  fuzzyThreshold: 0.7
});

const results = searcher(data, query);
```

### Performance-Optimized Pattern

```javascript
// Pre-filter large datasets when possible
const filteredData = data.filter(item => item.category === 'Electronics');
const results = search(filteredData, query, { limit: 20 });
```

### Analytics Pattern

```javascript
const results = search(data, query);
const analytics = {
  totalResults: results.length,
  avgScore: results.reduce((sum, r) => sum + r.score, 0) / results.length,
  topCategories: results.map(r => r.item.category)
};
```

## ⚖️ Field Weight Guidelines

| Field Type | Weight Range | Use Case | Example |
|------------|--------------|----------|---------|
| **Primary Identifiers** | 15-20 | Names, titles, SKUs | `name: 20` |
| **Important Content** | 10-15 | Descriptions, summaries | `description: 12` |
| **Secondary Content** | 5-10 | Categories, tags | `category: 8` |
| **Searchable Text** | 3-5 | Body content, reviews | `content: 4` |
| **Auxiliary Data** | 1-3 | IDs, timestamps | `id: 1` |

## ⚡ Performance Tips

1. **Limit Results**: Use the `limit` option for large datasets
2. **Pre-filter**: Filter data before searching when possible
3. **Field Selection**: Specify `fields` array to search only relevant fields
4. **Fuzzy Threshold**: Adjust `fuzzyThreshold` based on your use case (0.7 is usually good)
5. **Caching**: Cache searcher instances for repeated use with same configuration

## 🎛️ Configuration Presets

### Strict Matching (Exact matches preferred)

```javascript
{
  fuzzyThreshold: 0.9,
  minFuzzyLength: 5
}
```

### Loose Matching (Typo-tolerant)

```javascript
{
  fuzzyThreshold: 0.5,
  minFuzzyLength: 2
}
```

### Title-First Search (Prioritize titles/names)

```javascript
{
  fieldWeights: { title: 20, content: 1 }
}
```

### Balanced Search (Equal importance)

```javascript
{
  fieldWeights: { title: 8, description: 5, content: 3 }
}
```

## 🧪 Testing Your Search

Each example includes sample data and queries you can modify to test different scenarios:

1. **Modify the sample data** to match your use case
2. **Adjust field weights** to see how results change
3. **Try different search queries** including typos and partial matches
4. **Experiment with configuration options** like fuzzy thresholds

## 📚 Next Steps

1. **Start with `basic-usage.mjs`** to understand fundamentals
2. **Choose the example closest to your use case** and adapt it
3. **Read the main README.md** for API documentation
4. **Check out the test files** in `/tests/` for more usage patterns
5. **Review `PUBLISHING.md`** if you're building on top of this library

## 🤝 Contributing Examples

Have a great use case example? We'd love to include it! Consider contributing examples for:

- **Real-time search** with debouncing
- **Multi-language search** with internationalization
- **Search with filters** and faceted search
- **Geographic search** with location data
- **Image/media search** with metadata
- **API integration examples** with external data sources

---

*Happy searching! 🔍*
