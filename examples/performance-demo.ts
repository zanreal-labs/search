// Real-world search scenarios with performance considerations
import { search, createSearcher } from '../src/index';

// Define types for better TypeScript support
interface Product {
  id: number;
  name: string;
  category: string;
  brand: string;
  description: string;
  price: number;
  rating: string;
  inStock: boolean;
  tags: string[];
}

interface EcommerceSearchOptions {
  category?: string;
  maxPrice?: number;
  minRating?: number;
  inStockOnly?: boolean;
  sortBy?: 'relevance' | 'price' | 'rating';
}

interface SearchAnalytics {
  totalResults: number;
  avgScore: number;
  categoryBreakdown: Record<string, number>;
  matchTypes: Record<string, number>;
  topResult?: any;
}

// Simulate a larger dataset for performance testing
function generateTestData(count = 1000): Product[] {
  const categories = ['Electronics', 'Books', 'Clothing', 'Home & Garden', 'Sports', 'Automotive'];
  const brands = ['Apple', 'Samsung', 'Sony', 'Microsoft', 'Google', 'Amazon', 'Nike', 'Adidas'];
  const adjectives = ['Premium', 'Professional', 'Compact', 'Advanced', 'Smart', 'Wireless', 'Portable'];
  const products = ['Laptop', 'Phone', 'Tablet', 'Watch', 'Speaker', 'Camera', 'Keyboard', 'Mouse'];

  return Array.from({ length: count }, (_, i) => ({
    id: i + 1,
    name: `${adjectives[i % adjectives.length]} ${products[i % products.length]} ${brands[i % brands.length]}`,
    category: categories[i % categories.length],
    brand: brands[i % brands.length],
    description: `High-quality ${products[i % products.length].toLowerCase()} from ${brands[i % brands.length]} with advanced features and premium build quality.`,
    price: Math.floor(Math.random() * 2000) + 50,
    rating: (Math.random() * 2 + 3).toFixed(1), // 3.0 to 5.0
    inStock: Math.random() > 0.2,
    tags: [
      products[i % products.length].toLowerCase(),
      brands[i % brands.length].toLowerCase(),
      categories[i % categories.length].toLowerCase()
    ]
  }));
}

console.log('=== Performance & Real-world Examples ===\n');

// Generate test dataset
const largeDataset = generateTestData(1000);
console.log(`Generated dataset with ${largeDataset.length} items\n`);

// 1. Performance measurement
console.log('1. Performance test - searching 1000 items:');
console.time('Search Performance');

const perfResults = search(largeDataset, 'apple', {
  fieldWeights: {
    name: 10,
    brand: 8,
    category: 5,
    description: 2,
    tags: 6
  },
  limit: 20
});

console.timeEnd('Search Performance');
console.log(`Found ${perfResults.length} results\n`);

// Show top 5 results
console.log('Top 5 results:');
perfResults.slice(0, 5).forEach((result, index) => {
  console.log(`  ${index + 1}. ${result.item.name} - $${result.item.price}`);
  console.log(`     Score: ${result.score.toFixed(1)} | Rating: ${result.item.rating}★`);
});

// 2. E-commerce search with filters
console.log('\n2. E-commerce search with filtering:');

function ecommerceSearch(dataset: Product[], query: string, options: EcommerceSearchOptions = {}) {
  const {
    category,
    maxPrice,
    minRating,
    inStockOnly = false,
    sortBy = 'relevance' // relevance, price, rating
  } = options;

  // Pre-filter dataset
  let filteredData = dataset;

  if (category) {
    filteredData = filteredData.filter(item =>
      item.category.toLowerCase() === category.toLowerCase()
    );
  }

  if (maxPrice) {
    filteredData = filteredData.filter(item => item.price <= maxPrice);
  }

  if (minRating) {
    filteredData = filteredData.filter(item => parseFloat(item.rating) >= minRating);
  }

  if (inStockOnly) {
    filteredData = filteredData.filter(item => item.inStock);
  }

  // Search within filtered data
  const results = search(filteredData, query, {
    fieldWeights: {
      name: 12,
      brand: 10,
      category: 6,
      description: 3,
      tags: 8
    },
    limit: 50
  });

  // Apply sorting
  if (sortBy === 'price') {
    results.sort((a, b) => a.item.price - b.item.price);
  } else if (sortBy === 'rating') {
    results.sort((a, b) => parseFloat(b.item.rating) - parseFloat(a.item.rating));
  }
  // 'relevance' keeps search score sorting

  return results;
}

// Example e-commerce searches
const laptopResults = ecommerceSearch(largeDataset, 'laptop', {
  category: 'Electronics',
  maxPrice: 1500,
  minRating: 4.0,
  inStockOnly: true,
  sortBy: 'price'
});

console.log(`Electronics laptops under $1500 with 4+ rating:`);
laptopResults.slice(0, 3).forEach(result => {
  console.log(`  - ${result.item.name}`);
  console.log(`    Price: $${result.item.price} | Rating: ${result.item.rating}★ | In Stock: ${result.item.inStock}`);
});

// 3. Auto-complete simulation
console.log('\n3. Auto-complete search simulation:');

function autoComplete(dataset: Product[], query: string, limit = 5) {
  if (query.length < 2) return [];

  return search(dataset, query, {
    fieldWeights: {
      name: 15,        // Heavy weight on product names
      brand: 12,       // Brand names important for autocomplete
      category: 5,
      tags: 8
    },
    fuzzyThreshold: 0.8, // Stricter fuzzy matching for autocomplete
    limit
  });
}

const autocompleteQueries = ['app', 'sam', 'lap', 'sma'];
autocompleteQueries.forEach(query => {
  const suggestions = autoComplete(largeDataset, query);
  console.log(`"${query}" suggestions:`);
  suggestions.forEach(result => {
    console.log(`  - ${result.item.name} (${result.item.brand})`);
  });
  console.log('');
});

// 4. Search analytics
console.log('4. Search analytics example:');

function analyzeSearchResults(dataset: Product[], query: string): SearchAnalytics {
  const results = search(dataset, query, {
    limit: 100 // Get more results for analysis
  });

  // Analyze by category
  const categoryBreakdown = results.reduce((acc, result) => {
    const category = result.item.category;
    acc[category] = (acc[category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Analyze match types
  const matchTypes = results.reduce((acc, result) => {
    result.matches.forEach(match => {
      acc[match.type] = (acc[match.type] || 0) + 1;
    });
    return acc;
  }, {} as Record<string, number>);

  return {
    totalResults: results.length,
    avgScore: results.reduce((sum, r) => sum + r.score, 0) / results.length,
    categoryBreakdown,
    matchTypes,
    topResult: results[0]
  };
}

const analytics = analyzeSearchResults(largeDataset, 'premium');
console.log(`Search analytics for "premium":`);
console.log(`  Total results: ${analytics.totalResults}`);
console.log(`  Average score: ${analytics.avgScore.toFixed(2)}`);
console.log(`  Categories:`, analytics.categoryBreakdown);
console.log(`  Match types:`, analytics.matchTypes);
console.log(`  Top result: ${analytics.topResult?.item.name}\n`);

// 5. Optimized searcher for specific use case
console.log('5. Optimized product searcher:');

const productSearcher = createSearcher<Product>({
  fieldWeights: {
    name: 15,
    brand: 12,
    category: 8,
    tags: 10,
    description: 3
  },
  fuzzyThreshold: 0.7,
  minFuzzyLength: 3,
  limit: 25,
  caseSensitive: false
});

console.time('Optimized Search');
const optimizedResults = productSearcher(largeDataset, 'wireless bluetooth');
console.timeEnd('Optimized Search');

console.log(`Found ${optimizedResults.length} wireless bluetooth products:`);
optimizedResults.slice(0, 3).forEach(result => {
  console.log(`  - ${result.item.name} (Score: ${result.score.toFixed(1)})`);
  console.log(`    ${result.item.category} | $${result.item.price}`);
});

console.log('\n=== Performance Summary ===');
console.log('✅ Searched 1000+ items efficiently');
console.log('✅ Support for complex filtering and sorting');
console.log('✅ Auto-complete functionality');
console.log('✅ Search analytics and insights');
console.log('✅ Optimized searcher configuration');
