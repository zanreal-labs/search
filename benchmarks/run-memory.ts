import { runMemoryBenchmarks, runMemoryLeakTest } from './memory.ts';

async function main() {
  console.log('🚀 Running Memory Benchmarks with Bun');
  console.log('='.repeat(50));

  try {
    await runMemoryBenchmarks();
    await runMemoryLeakTest();
    console.log('\n✅ Memory benchmarks completed successfully!');
  } catch (error) {
    console.error('❌ Memory benchmarks failed:', error);
    process.exit(1);
  }
}

main().catch(console.error);
