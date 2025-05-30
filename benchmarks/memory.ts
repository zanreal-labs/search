import { performance } from 'perf_hooks';
import { search } from '../dist/index.mjs';
import { generateProducts, generateUsers, generateDocuments } from './benchmark.js';

interface MemoryBenchmarkResult {
  dataSize: number;
  memoryBefore: number;
  memoryAfter: number;
  memoryPeak: number;
  memoryDelta: number;
  avgSearchTime: number;
  searchCount: number;
}

export async function runMemoryBenchmarks() {
  console.log('🧠 Memory Usage & Scalability Benchmarks');
  console.log('='.repeat(50));

  const dataSizes = [100, 500, 1000, 2500, 5000, 10000];
  const results: MemoryBenchmarkResult[] = [];

  for (const size of dataSizes) {
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

    results.push(result);

    console.log(`  💾 Memory before: ${Math.round(memBefore.heapUsed / 1024 / 1024)}MB`);
    console.log(`  💾 Memory peak: ${Math.round(memoryPeak / 1024 / 1024)}MB`);
    console.log(`  💾 Memory after: ${Math.round(memAfter.heapUsed / 1024 / 1024)}MB`);
    console.log(`  📈 Memory delta: ${Math.round(result.memoryDelta / 1024 / 1024)}MB`);
    console.log(`  ⏱️  Avg search time: ${result.avgSearchTime.toFixed(2)}ms`);
    console.log(`  🔍 Searches performed: ${searchCount}`);
  }

  // Analysis
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

  // Scalability analysis
  console.log('\n📈 Scalability Analysis:');
  if (results.length >= 2) {
    const first = results[0];
    const last = results[results.length - 1];

    const sizeMultiplier = last.dataSize / first.dataSize;
    const timeMultiplier = last.avgSearchTime / first.avgSearchTime;
    const memoryMultiplier = last.memoryDelta / first.memoryDelta;

    console.log(`  📊 Data size increased: ${sizeMultiplier}x`);
    console.log(`  ⏱️  Search time increased: ${timeMultiplier.toFixed(2)}x`);
    console.log(`  💾 Memory usage increased: ${memoryMultiplier.toFixed(2)}x`);

    const efficiency = sizeMultiplier / timeMultiplier;
    console.log(`  ⚡ Search efficiency: ${efficiency.toFixed(2)} (higher is better)`);

    if (efficiency > 0.8) {
      console.log('  ✅ Excellent scalability - near linear performance');
    } else if (efficiency > 0.6) {
      console.log('  👍 Good scalability - performance degrades slowly');
    } else if (efficiency > 0.4) {
      console.log('  ⚠️  Fair scalability - noticeable performance impact');
    } else {
      console.log('  ❌ Poor scalability - significant performance degradation');
    }
  }

  return results;
}

export async function runMemoryLeakTest() {
  console.log('\n🔍 Memory Leak Detection Test');
  console.log('-'.repeat(30));

  const testData = generateUsers(1000);
  const queries = ['john', 'smith', 'google', 'engineer'];

  const iterations = 100;
  const memorySnapshots: number[] = [];

  console.log(`Running ${iterations} search iterations to detect memory leaks...`);

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

  // Analyze memory trend
  console.log('\n💾 Memory Usage Over Time:');
  memorySnapshots.forEach((mem, index) => {
    const mb = Math.round(mem / 1024 / 1024);
    const iteration = index * 10;
    console.log(`  Iteration ${iteration.toString().padStart(3)}: ${mb}MB`);
  });

  // Check for memory leak
  if (memorySnapshots.length >= 3) {
    const start = memorySnapshots[0];
    const end = memorySnapshots[memorySnapshots.length - 1];
    const growth = end - start;
    const growthPercent = (growth / start) * 100;

    console.log(`\n🔬 Memory Leak Analysis:`);
    console.log(`  Start memory: ${Math.round(start / 1024 / 1024)}MB`);
    console.log(`  End memory: ${Math.round(end / 1024 / 1024)}MB`);
    console.log(`  Growth: ${Math.round(growth / 1024 / 1024)}MB (${growthPercent.toFixed(1)}%)`);

    if (growthPercent < 5) {
      console.log('  ✅ No significant memory leak detected');
    } else if (growthPercent < 15) {
      console.log('  ⚠️  Minor memory growth detected - monitor in production');
    } else {
      console.log('  ❌ Potential memory leak detected - investigate further');
    }
  }
}
