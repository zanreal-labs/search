import {
  BenchmarkRunner,
  BENCHMARK_CONFIGS,
  generateUsers,
  generateProducts,
  generateDocuments
} from './benchmark.ts';

import {
  search,
  searchItems,
  quickSearch,
  createSearcher,
  createDocumentSearcher
} from '../src/index.ts';

async function main() {
  console.log('🔥 @zanreal/search Performance Benchmarks');
  console.log('='.repeat(50));
  console.log(`Bun: ${Bun.version}`);
  console.log(`Platform: ${process.platform} ${process.arch}`);
  console.log(`Memory: ${Math.round(process.memoryUsage().rss / 1024 / 1024)}MB\n`);

  const runner = new BenchmarkRunner();

  // Benchmark 1: Small Dataset - Users
  const users = generateUsers(BENCHMARK_CONFIGS[0]!.dataSize);
  await runner.runBenchmark(
    BENCHMARK_CONFIGS[0]!,
    users,
    (data, query) => search(data, query, {
      fieldWeights: {
        fullName: 10,
        firstName: 8,
        lastName: 8,
        email: 6,
        company: 5,
        role: 4,
        department: 3,
        bio: 2
      },
      limit: 50
    })
  );

  // Benchmark 2: Medium Dataset - Products
  const products = generateProducts(BENCHMARK_CONFIGS[1]!.dataSize);
  await runner.runBenchmark(
    BENCHMARK_CONFIGS[1]!,
    products,
    (data, query) => search(data, query, {
      fieldWeights: {
        name: 10,
        brand: 8,
        category: 6,
        description: 3,
        tags: 5
      },
      limit: 50
    })
  );

  // Benchmark 3: Large Dataset - Documents
  const documents = generateDocuments(BENCHMARK_CONFIGS[2]!.dataSize);
  const documentSearcher = createDocumentSearcher();
  await runner.runBenchmark(
    BENCHMARK_CONFIGS[2]!,
    documents,
    (data, query) => documentSearcher(data, query, {
      fieldWeights: {
        title: 10,
        author: 6,
        summary: 8,
        content: 4,
        category: 5,
        tags: 3
      },
      limit: 50
    })
  );

  // Benchmark 4: XL Dataset - Stress Test (Mixed data)
  const mixedData = [
    ...generateUsers(BENCHMARK_CONFIGS[3]!.dataSize / 3),
    ...generateProducts(BENCHMARK_CONFIGS[3]!.dataSize / 3),
    ...generateDocuments(BENCHMARK_CONFIGS[3]!.dataSize / 3)
  ];

  await runner.runBenchmark(
    BENCHMARK_CONFIGS[3]!,
    mixedData,
    (data, query) => quickSearch(data, query)
  );

  // Print summary
  runner.printSummary();

  // Export results
  const resultsJson = runner.exportResults();
  console.log('\n💾 Benchmark results exported to JSON format');

  // Additional performance insights
  console.log('\n💡 Performance Insights:');
  const results = runner.getResults();

  // Find fastest query type
  let fastestQuery = '';
  let fastestTime = Infinity;
  let slowestQuery = '';
  let slowestTime = 0;

  results.forEach(result => {
    result.results.forEach(queryResult => {
      if (queryResult.avgTime < fastestTime) {
        fastestTime = queryResult.avgTime;
        fastestQuery = queryResult.query;
      }
      if (queryResult.avgTime > slowestTime) {
        slowestTime = queryResult.avgTime;
        slowestQuery = queryResult.query;
      }
    });
  });

  console.log(`  ⚡ Fastest query: "${fastestQuery}" (${fastestTime.toFixed(2)}ms)`);
  console.log(`  🐌 Slowest query: "${slowestQuery}" (${slowestTime.toFixed(2)}ms)`);

  // Memory usage insights
  const totalMemory = results.reduce((sum, result) => {
    return sum + result.results.reduce((subSum, queryResult) => {
      return subSum + (queryResult.memoryUsage || 0);
    }, 0);
  }, 0);

  if (totalMemory > 0) {
    console.log(`  🧠 Total memory delta: ${Math.round(totalMemory / 1024 / 1024)}MB`);
  }

  console.log('\n✅ Benchmarks completed successfully!');
}

// Run benchmarks when executed directly
if (import.meta.main) {
  main().catch(console.error);
}

export { main };
