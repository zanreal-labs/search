import { runComparativeBenchmark } from './comparative.ts';
import { runMemoryBenchmarks, runMemoryLeakTest } from './memory.ts';

async function runFullBenchmarkSuite() {
  console.log('🚀 @zanreal/search - Complete Benchmark Suite');
  console.log('='.repeat(60));
  console.log(`🕒 Started at: ${new Date().toLocaleString()}`);
  console.log(`🖥️  System: ${process.platform} ${process.arch}`);
  console.log(`📦 Node.js: ${process.version}`);
  console.log(`💾 Available Memory: ${Math.round(process.memoryUsage().rss / 1024 / 1024)}MB`);

  const startTime = Date.now();

  try {
    // 1. Run main benchmarks
    console.log('\n' + '='.repeat(60));
    console.log('📊 RUNNING MAIN BENCHMARKS');
    console.log('='.repeat(60));

    // Import and run main benchmarks by importing the main function
    const { main: runMainBenchmarks } = await import('./run-benchmarks.ts');
    await runMainBenchmarks();

    // 2. Run comparative benchmarks
    console.log('\n' + '='.repeat(60));
    console.log('⚔️  RUNNING COMPARATIVE BENCHMARKS');
    console.log('='.repeat(60));

    await runComparativeBenchmark();

    // 3. Run memory benchmarks
    console.log('\n' + '='.repeat(60));
    console.log('🧠 RUNNING MEMORY BENCHMARKS');
    console.log('='.repeat(60));

    await runMemoryBenchmarks();

    // 4. Run memory leak test
    console.log('\n' + '='.repeat(60));
    console.log('🔍 RUNNING MEMORY LEAK TEST');
    console.log('='.repeat(60));

    await runMemoryLeakTest();

    const endTime = Date.now();
    const totalTime = endTime - startTime;

    // Final summary
    console.log('\n' + '='.repeat(60));
    console.log('✅ BENCHMARK SUITE COMPLETED');
    console.log('='.repeat(60));
    console.log(`🕒 Total time: ${(totalTime / 1000).toFixed(2)} seconds`);
    console.log(`💾 Final memory usage: ${Math.round(process.memoryUsage().rss / 1024 / 1024)}MB`);

    // Generate performance recommendations
    console.log('\n🎯 PERFORMANCE RECOMMENDATIONS:');
    console.log('1. Use `searchItems()` if you only need the items (not full results)');
    console.log('2. Use `quickSearch()` for simple searches with minimal configuration');
    console.log('3. Use `createSearcher()` for repeated searches with the same configuration');
    console.log('4. Set appropriate `limit` values to control result set size');
    console.log('5. Configure `fieldWeights` to prioritize important fields');
    console.log('6. Adjust `fuzzyThreshold` based on your accuracy requirements');

    console.log('\n📝 To run individual benchmark components:');
    console.log('  • Main benchmarks: bun benchmarks/run-benchmarks.ts');
    console.log('  • Comparative: bun benchmarks/comparative.ts');
    console.log('  • Memory tests: bun benchmarks/memory.ts');
    console.log('  • Full suite: bun benchmarks/full-suite.ts');

  } catch (error) {
    console.error('❌ Benchmark suite failed:', error);
    process.exit(1);
  }
}

// Check for command line arguments
const args = new Set(process.argv.slice(2));

if (args.has('--help') || args.has('-h')) {
  console.log('🚀 @zanreal/search Benchmark Suite');
  console.log('');
  console.log('Usage: bun benchmarks/full-suite.ts [options]');
  console.log('');
  console.log('Options:');
  console.log('  --help, -h     Show this help message');
  console.log('  --gc           Enable garbage collection (requires --expose-gc)');
  console.log('');
  console.log('Examples:');
  console.log('  bun benchmarks/full-suite.ts');
  console.log('  bun --bun benchmarks/full-suite.ts --gc');
  process.exit(0);
}

if (args.has('--gc')) {
  if (typeof global.gc !== 'function') {
    console.warn('⚠️  Garbage collection not available. Run with: node --expose-gc');
  } else {
    console.log('🗑️  Garbage collection enabled');
  }
}

// Run the benchmark suite
await runFullBenchmarkSuite();
