import { performance } from 'node:perf_hooks';
import {
  search,
  searchItems,
  quickSearch,
  createSearcher,
  createDocumentSearcher
} from '../src/index.ts';
import { generateProducts } from './benchmark.ts';

interface ComparativeResult {
  functionName: string;
  avgTime: number;
  opsPerSecond: number;
  resultCount: number;
  memoryDelta: number;
}

async function runComparativeBenchmark() {
  console.log('⚔️  Comparative Function Benchmarks');
  console.log('='.repeat(50));

  const dataSize = 1000;
  const iterations = 50;
  const testData = generateProducts(dataSize);
  const testQuery = 'apple laptop';

  const functions = [
    {
      name: 'search (full results)',
      fn: (data: any[], query: string) => search(data, query, {
        fieldWeights: { name: 10, brand: 8, category: 6, description: 3 },
        limit: 50
      })
    },
    {
      name: 'searchItems (items only)',
      fn: (data: any[], query: string) => searchItems(data, query, {
        fieldWeights: { name: 10, brand: 8, category: 6, description: 3 },
        limit: 50
      })
    },
    {
      name: 'quickSearch (simple)',
      fn: (data: any[], query: string) => quickSearch(data, query, ['name', 'brand', 'category'])
    },
    {
      name: 'createSearcher (configured)',
      fn: (() => {
        const searcher = createSearcher({
          fieldWeights: { name: 10, brand: 8, category: 6, description: 3 },
          limit: 50
        });
        return (data: any[], query: string) => searcher(data, query);
      })()
    },
    {
      name: 'createDocumentSearcher',
      fn: (() => {
        const docSearcher = createDocumentSearcher();
        return (data: any[], query: string) => docSearcher(data, query, {
          fieldWeights: { name: 10, brand: 8, category: 6, description: 3 },
          limit: 50
        });
      })()
    }
  ];

  const results: ComparativeResult[] = [];

  for (const func of functions) {
    console.log(`\n🔍 Testing: ${func.name}`);

    // Warm up
    for (let i = 0; i < 3; i++) {
      func.fn(testData, testQuery);
    }

    const times: number[] = [];
    let resultCount = 0;
    const memBefore = process.memoryUsage().heapUsed;

    // Run benchmark
    for (let i = 0; i < iterations; i++) {
      const start = performance.now();
      const result = func.fn(testData, testQuery);
      const end = performance.now();

      times.push(end - start);
      if (i === 0) resultCount = Array.isArray(result) ? result.length : 0;
    }

    const memAfter = process.memoryUsage().heapUsed;
    const memoryDelta = memAfter - memBefore;

    const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
    const opsPerSecond = 1000 / avgTime;

    const result: ComparativeResult = {
      functionName: func.name,
      avgTime: Number(avgTime.toFixed(3)),
      opsPerSecond: Number(opsPerSecond.toFixed(2)),
      resultCount,
      memoryDelta
    };

    results.push(result);

    console.log(`  ⏱️  Avg time: ${avgTime.toFixed(2)}ms`);
    console.log(`  ⚡ Ops/sec: ${opsPerSecond.toFixed(0)}`);
    console.log(`  📊 Results: ${resultCount}`);
    console.log(`  🧠 Memory: ${memoryDelta > 0 ? '+' : ''}${Math.round(memoryDelta / 1024)}KB`);
  }

  // Summary comparison
  console.log('\n🏆 Performance Ranking:');
  const ranked = [...results].sort((a, b) => b.opsPerSecond - a.opsPerSecond);
  ranked.forEach((result, index) => {
    const firstResult = ranked[0];
    const percentage = index === 0 || !firstResult ? '100%' : `${Math.round((result.opsPerSecond / firstResult.opsPerSecond) * 100)}%`;
    console.log(`  ${index + 1}. ${result.functionName}: ${result.opsPerSecond} ops/sec (${percentage})`);
  });

  console.log('\n📈 Detailed Comparison:');
  console.log('Function'.padEnd(30) + 'Time (ms)'.padEnd(12) + 'Ops/sec'.padEnd(12) + 'Results'.padEnd(10) + 'Memory');
  console.log('-'.repeat(70));

  results.forEach(result => {
    const memStr = result.memoryDelta > 0 ? `+${Math.round(result.memoryDelta / 1024)}KB` : `${Math.round(result.memoryDelta / 1024)}KB`;
    console.log(
      result.functionName.padEnd(30) +
      result.avgTime.toFixed(2).padEnd(12) +
      result.opsPerSecond.toString().padEnd(12) +
      result.resultCount.toString().padEnd(10) +
      memStr
    );
  });

  return results;
}

export { runComparativeBenchmark };
