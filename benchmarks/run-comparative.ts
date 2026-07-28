import { runComparativeBenchmark } from './comparative.ts';

async function main() {
  console.log('🚀 Running Comparative Benchmarks with Bun');
  console.log('='.repeat(50));

  try {
    await runComparativeBenchmark();
    console.log('\n✅ Comparative benchmarks completed successfully!');
  } catch (error) {
    console.error('❌ Comparative benchmarks failed:', error);
    process.exit(1);
  }
}

await main();
