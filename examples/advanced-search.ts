// Advanced search example with custom field weights and configuration
import { search, createSearcher } from '../src/index';

// Define types for better TypeScript support
interface Product {
  id: number;
  name: string;
  category: string;
  brand: string;
  description: string;
  price: number;
  tags: string[];
}

// Sample e-commerce product data
const products: Product[] = [
  {
    id: 1,
    name: 'MacBook Pro M3',
    category: 'Electronics',
    brand: 'Apple',
    description: 'Powerful laptop for professionals with M3 chip',
    price: 1999,
    tags: ['laptop', 'professional', 'apple', 'macbook']
  },
  {
    id: 2,
    name: 'iPhone 15 Pro',
    category: 'Electronics',
    brand: 'Apple',
    description: 'Latest iPhone with advanced camera system',
    price: 999,
    tags: ['phone', 'smartphone', 'apple', 'iphone']
  },
  {
    id: 3,
    name: 'AirPods Pro',
    category: 'Audio',
    brand: 'Apple',
    description: 'Wireless earbuds with noise cancellation',
    price: 249,
    tags: ['earbuds', 'wireless', 'apple', 'audio']
  },
  {
    id: 4,
    name: 'Dell XPS 13',
    category: 'Electronics',
    brand: 'Dell',
    description: 'Compact ultrabook for productivity',
    price: 1299,
    tags: ['laptop', 'ultrabook', 'dell', 'productivity']
  }
];

console.log('=== E-commerce Product Search ===\n');

// 1. Basic search
console.log('1. Basic search for "apple":');
const basicResults = search(products, 'apple');
basicResults.forEach(result => {
  console.log(`  - ${result.item.name} (Score: ${result.score.toFixed(1)})`);
});

// 2. Custom field weights - prioritize name and brand over description
console.log('\n2. Search with custom weights (name=10, brand=8, description=1):');
const weightedResults = search(products, 'pro', {
  fieldWeights: {
    name: 10,
    brand: 8,
    category: 5,
    description: 1,
    tags: 3
  }
});
weightedResults.forEach(result => {
  console.log(`  - ${result.item.name} (Score: ${result.score.toFixed(1)})`);
  result.matches.forEach(match => {
    console.log(`    ${match.field}: "${match.value}" (${match.type})`);
  });
});

// 3. Create specialized searcher for product names only
console.log('\n3. Product name-only search:');
const nameSearcher = createSearcher<Product>({
  fields: ['name'],
  fieldWeights: { name: 1 },
  fuzzyThreshold: 0.6
});

const nameResults = nameSearcher(products, 'macbok'); // Intentional typo
nameResults.forEach(result => {
  console.log(`  - ${result.item.name} (Score: ${result.score.toFixed(1)}, Type: ${result.matches[0]?.type})`);
});

// 4. Category-specific search
console.log('\n4. Electronics category search for "laptop":');
const electronicsProducts = products.filter(p => p.category === 'Electronics');
const laptopResults = search(electronicsProducts, 'laptop');
laptopResults.forEach(result => {
  console.log(`  - ${result.item.name} - $${result.item.price}`);
});

// 5. Price-aware search (custom scoring)
console.log('\n5. Search with price consideration:');
const priceAwareResults = search(products, 'apple')
  .map(result => ({
    ...result,
    // Boost score for lower prices (value for money)
    adjustedScore: result.score * (2000 / result.item.price)
  }))
  .sort((a, b) => b.adjustedScore - a.adjustedScore);

priceAwareResults.forEach(result => {
  console.log(`  - ${result.item.name} - $${result.item.price} (Adjusted Score: ${result.adjustedScore.toFixed(1)})`);
});
