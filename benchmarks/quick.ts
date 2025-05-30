import {
  BenchmarkRunner,
  BENCHMARK_CONFIGS,
  generateUsers,
  generateProducts
} from './benchmark.ts';

import { search, quickSearch } from '../src/index.ts';

async function quickBenchmark() {
  console.log('⚡ Quick Performance Check');
  console.log('='.repeat(30));
  console.log(`Bun: ${Bun.version}`);
  console.log(`Platform: ${process.platform} ${process.arch}\n`);

  const runner = new BenchmarkRunner();

  // Quick test with smaller datasets
  const users = generateUsers(50);
  const products = generateProducts(100);

  console.log('🔍 Testing basic search performance...');

  const quickConfig = {
    name: 'Quick Performance Test',
    description: 'Fast performance check for CI/CD',
    iterations: 10,
    dataSize: 50,
    queries: ['test', 'search']
  };

  await runner.runBenchmark(
    quickConfig,
    users,
    (data, query) => quickSearch(data, query)
  );

  const results = runner.getResults();
  const avgOps = results[0]?.avgOpsPerSecond || 0;

  console.log(`\n📊 Result: ${avgOps.toFixed(0)} ops/sec`);

  if (avgOps > 100) {
    console.log('✅ Performance: EXCELLENT');
  } else if (avgOps > 50) {
    console.log('👍 Performance: GOOD');
  } else if (avgOps > 20) {
    console.log('⚠️  Performance: FAIR');
  } else {
    console.log('❌ Performance: POOR - investigate');
    process.exit(1);
  }
}

if (import.meta.main) {
  quickBenchmark().catch(console.error);
}

export { quickBenchmark };
