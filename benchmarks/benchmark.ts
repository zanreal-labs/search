import { performance } from 'perf_hooks';

// Benchmark configuration
export interface BenchmarkConfig {
  name: string;
  description: string;
  iterations: number;
  dataSize: number;
  queries: string[];
}

export interface BenchmarkResult {
  config: BenchmarkConfig;
  results: {
    query: string;
    avgTime: number;
    minTime: number;
    maxTime: number;
    opsPerSecond: number;
    memoryUsage?: number;
    resultCount: number;
  }[];
  totalTime: number;
  avgOpsPerSecond: number;
}

// Data generators
export function generateUsers(count: number) {
  const firstNames = ['John', 'Jane', 'Mike', 'Sarah', 'David', 'Emily', 'Chris', 'Anna', 'Robert', 'Lisa'];
  const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez'];
  const companies = ['Google', 'Microsoft', 'Apple', 'Amazon', 'Meta', 'Tesla', 'Netflix', 'Adobe', 'Salesforce', 'Oracle'];
  const roles = ['Engineer', 'Manager', 'Designer', 'Analyst', 'Director', 'Coordinator', 'Specialist', 'Consultant'];
  const departments = ['Engineering', 'Marketing', 'Sales', 'HR', 'Finance', 'Operations', 'IT', 'Legal'];

  return Array.from({ length: count }, (_, i) => ({
    id: i + 1,
    firstName: firstNames[i % firstNames.length],
    lastName: lastNames[i % lastNames.length],
    email: `${firstNames[i % firstNames.length].toLowerCase()}.${lastNames[i % lastNames.length].toLowerCase()}@${companies[i % companies.length].toLowerCase()}.com`,
    company: companies[i % companies.length],
    role: roles[i % roles.length],
    department: departments[i % departments.length],
    fullName: `${firstNames[i % firstNames.length]} ${lastNames[i % lastNames.length]}`,
    bio: `Experienced ${roles[i % roles.length].toLowerCase()} at ${companies[i % companies.length]} working in ${departments[i % departments.length].toLowerCase()}. Passionate about technology and innovation.`,
    skills: [
      'JavaScript', 'TypeScript', 'React', 'Node.js', 'Python', 'Java', 'Go', 'Rust'
    ].slice(0, Math.floor(Math.random() * 4) + 2),
    location: `City ${i % 50 + 1}, Country ${i % 10 + 1}`,
    active: Math.random() > 0.1
  }));
}

export function generateProducts(count: number) {
  const categories = ['Electronics', 'Books', 'Clothing', 'Home & Garden', 'Sports', 'Automotive', 'Beauty', 'Toys'];
  const brands = ['Apple', 'Samsung', 'Sony', 'Microsoft', 'Google', 'Amazon', 'Nike', 'Adidas', 'Canon', 'Dell'];
  const adjectives = ['Premium', 'Professional', 'Compact', 'Advanced', 'Smart', 'Wireless', 'Portable', 'Durable'];
  const products = ['Laptop', 'Phone', 'Tablet', 'Watch', 'Speaker', 'Camera', 'Keyboard', 'Mouse', 'Headphones', 'Monitor'];

  return Array.from({ length: count }, (_, i) => ({
    id: i + 1,
    name: `${adjectives[i % adjectives.length]} ${products[i % products.length]} ${brands[i % brands.length]}`,
    category: categories[i % categories.length],
    brand: brands[i % brands.length],
    description: `High-quality ${products[i % products.length].toLowerCase()} from ${brands[i % brands.length]} with advanced features and premium build quality. Perfect for both personal and professional use.`,
    price: Math.floor(Math.random() * 2000) + 50,
    rating: parseFloat((Math.random() * 2 + 3).toFixed(1)),
    inStock: Math.random() > 0.2,
    tags: [
      products[i % products.length].toLowerCase(),
      brands[i % brands.length].toLowerCase(),
      categories[i % categories.length].toLowerCase(),
      adjectives[i % adjectives.length].toLowerCase()
    ],
    sku: `SKU-${String(i + 1).padStart(6, '0')}`,
    weight: Math.floor(Math.random() * 5000) + 100, // grams
    dimensions: {
      length: Math.floor(Math.random() * 50) + 10,
      width: Math.floor(Math.random() * 50) + 10,
      height: Math.floor(Math.random() * 30) + 5
    }
  }));
}

export function generateDocuments(count: number) {
  const titles = [
    'Getting Started with TypeScript',
    'Advanced React Patterns',
    'Node.js Performance Optimization',
    'Database Design Principles',
    'Machine Learning Fundamentals',
    'Web Security Best Practices',
    'Cloud Architecture Patterns',
    'API Design Guidelines',
    'Testing Strategies',
    'DevOps Automation'
  ];

  const authors = ['Alice Johnson', 'Bob Smith', 'Carol Davis', 'David Wilson', 'Eve Brown', 'Frank Miller'];
  const categories = ['Technology', 'Programming', 'Design', 'Business', 'Science', 'Education'];

  return Array.from({ length: count }, (_, i) => ({
    id: i + 1,
    title: `${titles[i % titles.length]} - Part ${Math.floor(i / titles.length) + 1}`,
    author: authors[i % authors.length],
    category: categories[i % categories.length],
    content: `This is a comprehensive guide about ${titles[i % titles.length].toLowerCase()}. It covers all the essential concepts and provides practical examples for implementation. The document includes detailed explanations, code samples, and best practices that developers should follow.`,
    summary: `A detailed guide covering ${titles[i % titles.length].toLowerCase()} with practical examples and best practices.`,
    tags: ['tutorial', 'guide', 'programming', 'development', 'best-practices'],
    publishedAt: new Date(2020 + (i % 4), i % 12, (i % 28) + 1).toISOString(),
    wordCount: Math.floor(Math.random() * 5000) + 500,
    readingTime: Math.floor(Math.random() * 20) + 5,
    difficulty: ['Beginner', 'Intermediate', 'Advanced'][i % 3],
    language: 'English'
  }));
}

// Benchmark runner
export class BenchmarkRunner {
  private results: BenchmarkResult[] = [];

  async runBenchmark<T>(
    config: BenchmarkConfig,
    data: T[],
    searchFn: (data: T[], query: string) => any[]
  ): Promise<BenchmarkResult> {
    console.log(`\n🚀 Running benchmark: ${config.name}`);
    console.log(`📊 Data size: ${config.dataSize}, Iterations: ${config.iterations}`);
    console.log(`📝 Description: ${config.description}`);

    const result: BenchmarkResult = {
      config,
      results: [],
      totalTime: 0,
      avgOpsPerSecond: 0
    };

    let totalOpsPerSecond = 0;

    for (const query of config.queries) {
      const times: number[] = [];
      let resultCount = 0;

      // Warm up
      for (let i = 0; i < 3; i++) {
        searchFn(data, query);
      }

      // Measure memory before benchmark
      const memBefore = process.memoryUsage().heapUsed;

      // Run iterations
      for (let i = 0; i < config.iterations; i++) {
        const start = performance.now();
        const searchResults = searchFn(data, query);
        const end = performance.now();

        times.push(end - start);
        if (i === 0) resultCount = searchResults.length;
      }

      // Measure memory after benchmark
      const memAfter = process.memoryUsage().heapUsed;
      const memoryUsage = memAfter - memBefore;

      const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
      const minTime = Math.min(...times);
      const maxTime = Math.max(...times);
      const opsPerSecond = 1000 / avgTime;

      totalOpsPerSecond += opsPerSecond;

      result.results.push({
        query,
        avgTime: Number(avgTime.toFixed(3)),
        minTime: Number(minTime.toFixed(3)),
        maxTime: Number(maxTime.toFixed(3)),
        opsPerSecond: Number(opsPerSecond.toFixed(2)),
        memoryUsage: memoryUsage > 0 ? memoryUsage : undefined,
        resultCount
      });

      console.log(`  ⚡ Query "${query}": ${avgTime.toFixed(2)}ms avg, ${opsPerSecond.toFixed(0)} ops/sec, ${resultCount} results`);
    }

    result.totalTime = result.results.reduce((sum, r) => sum + r.avgTime, 0);
    result.avgOpsPerSecond = Number((totalOpsPerSecond / config.queries.length).toFixed(2));

    this.results.push(result);
    return result;
  }

  getResults(): BenchmarkResult[] {
    return this.results;
  }

  printSummary(): void {
    console.log('\n📈 BENCHMARK SUMMARY');
    console.log('='.repeat(50));

    for (const result of this.results) {
      console.log(`\n${result.config.name}:`);
      console.log(`  📊 Data Size: ${result.config.dataSize}`);
      console.log(`  ⚡ Avg Operations/sec: ${result.avgOpsPerSecond}`);
      console.log(`  ⏱️  Total Time: ${result.totalTime.toFixed(2)}ms`);
      console.log(`  🎯 Queries Tested: ${result.config.queries.length}`);
    }

    // Performance comparison
    if (this.results.length > 1) {
      console.log('\n🏆 Performance Ranking (by ops/sec):');
      const ranked = [...this.results].sort((a, b) => b.avgOpsPerSecond - a.avgOpsPerSecond);
      ranked.forEach((result, index) => {
        console.log(`  ${index + 1}. ${result.config.name}: ${result.avgOpsPerSecond} ops/sec`);
      });
    }
  }

  exportResults(filename?: string): string {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filepath = filename || `benchmark-results-${timestamp}.json`;

    const exportData = {
      timestamp: new Date().toISOString(),
      system: {
        platform: process.platform,
        arch: process.arch,
        nodeVersion: process.version,
        memoryTotal: Math.round(process.memoryUsage().rss / 1024 / 1024) + 'MB'
      },
      results: this.results
    };

    return JSON.stringify(exportData, null, 2);
  }
}

// Common benchmark configurations
export const BENCHMARK_CONFIGS: BenchmarkConfig[] = [
  {
    name: 'Small Dataset - User Search',
    description: 'Search through 100 user records with various queries',
    iterations: 100,
    dataSize: 100,
    queries: ['john', 'john smith', 'google', 'engineer', 'john@', 'xyz']
  },
  {
    name: 'Medium Dataset - Product Search',
    description: 'Search through 1,000 product records',
    iterations: 50,
    dataSize: 1000,
    queries: ['apple', 'laptop', 'premium laptop', 'samsu', 'wireless', 'nonexistent']
  },
  {
    name: 'Large Dataset - Document Search',
    description: 'Search through 5,000 document records',
    iterations: 20,
    dataSize: 5000,
    queries: ['typescript', 'react patterns', 'alice', 'programming', 'xyz123']
  },
  {
    name: 'XL Dataset - Stress Test',
    description: 'Search through 10,000 mixed records for stress testing',
    iterations: 10,
    dataSize: 10000,
    queries: ['test', 'performance', 'search', 'fuzzy']
  }
];
