import { performance } from 'node:perf_hooks';
import { search } from '../dist/index.mjs';
import { generateProducts, generateUsers } from './benchmark.js';

interface MemoryBenchmarkResult {
  dataSize: number;
  memoryBefore: number;
  memoryAfter: number;
  memoryPeak: number;
  memoryDelta: number;
  avgSearchTime: number;
  searchCount: number;
}

function benchmarkDataSize(size: number): MemoryBenchmarkResult {
  console.log(`\n📊 Testing data size: ${size} items`);

  const memBefore = process.memoryUsage();

  // Generate test data
  const testData = generateProducts(size);
  const testQueries = ['apple', 'laptop', 'premium', 'wireless', 'samsung'];

  const memAfterData = process.memoryUsage();

  // Force garbage collection if available
  if (global.gc) {
    global.gc();
  }

  let totalSearchTime = 0;
  let searchCount = 0;
  let memoryPeak = memAfterData.heapUsed;

  // Run multiple searches to test sustained performance
  for (const query of testQueries) {
    for (let i = 0; i < 10; i++) {
      const start = performance.now();
      search(testData, query, {
        fieldWeights: { name: 10, brand: 8, description: 3 },
        limit: 50
      });
      const end = performance.now();

      totalSearchTime += (end - start);
      searchCount++;

      // Track peak memory usage
      const currentMem = process.memoryUsage().heapUsed;
      if (currentMem > memoryPeak) {
        memoryPeak = currentMem;
      }
    }
  }

  const memAfter = process.memoryUsage();

  const result: MemoryBenchmarkResult = {
    dataSize: size,
    memoryBefore: memBefore.heapUsed,
    memoryAfter: memAfter.heapUsed,
    memoryPeak,
    memoryDelta: memAfter.heapUsed - memBefore.heapUsed,
    avgSearchTime: totalSearchTime / searchCount,
    searchCount
  };

  console.log(`  💾 Memory before: ${Math.round(memBefore.heapUsed / 1024 / 1024)}MB`);
  console.log(`  💾 Memory peak: ${Math.round(memoryPeak / 1024 / 1024)}MB`);
  console.log(`  💾 Memory after: ${Math.round(memAfter.heapUsed / 1024 / 1024)}MB`);
  console.log(`  📈 Memory delta: ${Math.round(result.memoryDelta / 1024 / 1024)}MB`);
  console.log(`  ⏱️  Avg search time: ${result.avgSearchTime.toFixed(2)}ms`);
  console.log(`  🔍 Searches performed: ${searchCount}`);

  return result;
}

function printMemoryUsageTable(results: MemoryBenchmarkResult[]): void {
  console.log('\n📊 Memory Usage Analysis:');
  console.log('Data Size'.padEnd(12) + 'Memory Delta'.padEnd(15) + 'Per Item'.padEnd(12) + 'Avg Search Time');
  console.log('-'.repeat(60));

  results.forEach(result => {
    const memoryDeltaMB = result.memoryDelta / 1024 / 1024;
    const memoryPerItem = result.memoryDelta / result.dataSize;

    console.log(
      `${result.dataSize}`.padEnd(12) +
      `${memoryDeltaMB.toFixed(2)}MB`.padEnd(15) +
      `${Math.round(memoryPerItem)}B`.padEnd(12) +
      `${result.avgSearchTime.toFixed(2)}ms`
    );
  });
}

function scalabilityVerdict(efficiency: number): string {
  if (efficiency > 0.8) return '  ✅ Excellent scalability - near linear performance';
  if (efficiency > 0.6) return '  👍 Good scalability - performance degrades slowly';
  if (efficiency > 0.4) return '  ⚠️  Fair scalability - noticeable performance impact';
  return '  ❌ Poor scalability - significant performance degradation';
}

function printScalabilityAnalysis(results: MemoryBenchmarkResult[]): void {
  console.log('\n📈 Scalability Analysis:');

  const first = results[0];
  const last = results.at(-1);
  if (results.length < 2 || !first || !last) return;

  const sizeMultiplier = last.dataSize / first.dataSize;
  const timeMultiplier = last.avgSearchTime / first.avgSearchTime;
  const memoryMultiplier = last.memoryDelta / first.memoryDelta;

  console.log(`  📊 Data size increased: ${sizeMultiplier}x`);
  console.log(`  ⏱️  Search time increased: ${timeMultiplier.toFixed(2)}x`);
  console.log(`  💾 Memory usage increased: ${memoryMultiplier.toFixed(2)}x`);

  const efficiency = sizeMultiplier / timeMultiplier;
  console.log(`  ⚡ Search efficiency: ${efficiency.toFixed(2)} (higher is better)`);
  console.log(scalabilityVerdict(efficiency));
}

export async function runMemoryBenchmarks() {
  console.log('🧠 Memory Usage & Scalability Benchmarks');
  console.log('='.repeat(50));

  const dataSizes = [100, 500, 1000, 2500, 5000, 10000];
  const results = dataSizes.map(size => benchmarkDataSize(size));

  // Analysis
  printMemoryUsageTable(results);
  printScalabilityAnalysis(results);

  return results;
}

function collectMemorySnapshots<T>(
  testData: T[],
  queries: string[],
  iterations: number
): number[] {
  const memorySnapshots: number[] = [];

  for (let i = 0; i < iterations; i++) {
    // Perform searches
    for (const query of queries) {
      search(testData, query, { limit: 20 });
    }

    // Take memory snapshot every 10 iterations
    if (i % 10 === 0) {
      if (global.gc) global.gc(); // Force GC if available
      memorySnapshots.push(process.memoryUsage().heapUsed);
    }
  }

  return memorySnapshots;
}

function leakVerdict(growthPercent: number): string {
  if (growthPercent < 5) return '  ✅ No significant memory leak detected';
  if (growthPercent < 15) return '  ⚠️  Minor memory growth detected - monitor in production';
  return '  ❌ Potential memory leak detected - investigate further';
}

function printLeakAnalysis(memorySnapshots: number[]): void {
  const start = memorySnapshots[0];
  const end = memorySnapshots.at(-1);
  if (memorySnapshots.length < 3 || start === undefined || end === undefined) return;

  const growth = end - start;
  const growthPercent = (growth / start) * 100;

  console.log('\n🔬 Memory Leak Analysis:');
  console.log(`  Start memory: ${Math.round(start / 1024 / 1024)}MB`);
  console.log(`  End memory: ${Math.round(end / 1024 / 1024)}MB`);
  console.log(`  Growth: ${Math.round(growth / 1024 / 1024)}MB (${growthPercent.toFixed(1)}%)`);
  console.log(leakVerdict(growthPercent));
}

export async function runMemoryLeakTest() {
  console.log('\n🔍 Memory Leak Detection Test');
  console.log('-'.repeat(30));

  const testData = generateUsers(1000);
  const queries = ['john', 'smith', 'google', 'engineer'];
  const iterations = 100;

  console.log(`Running ${iterations} search iterations to detect memory leaks...`);

  const memorySnapshots = collectMemorySnapshots(testData, queries, iterations);

  // Analyze memory trend
  console.log('\n💾 Memory Usage Over Time:');
  memorySnapshots.forEach((mem, index) => {
    const mb = Math.round(mem / 1024 / 1024);
    const iteration = index * 10;
    console.log(`  Iteration ${iteration.toString().padStart(3)}: ${mb}MB`);
  });

  printLeakAnalysis(memorySnapshots);
}
