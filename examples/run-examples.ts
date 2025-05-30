#!/usr/bin/env bun
// Interactive Examples Runner - Universal Search Library
// Run this to explore examples interactively: bun examples/run-examples.ts

import { readdir } from 'fs/promises';
import { spawn } from 'child_process';
import { createInterface } from 'readline';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// ANSI color codes for better console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m'
};

interface Example {
  file: string;
  title: string;
  description: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  duration: string;
}

const examples: Example[] = [
  {
    file: 'basic-usage.ts',
    title: '🔰 Basic Usage',
    description: 'Learn fundamental search patterns and configurations',
    difficulty: 'Beginner',
    duration: '2-3 minutes'
  },
  {
    file: 'document-search.ts',
    title: '📄 Document Search',
    description: 'CMS and blog search with metadata handling',
    difficulty: 'Beginner',
    duration: '3-4 minutes'
  },
  {
    file: 'user-directory.ts',
    title: '👥 User Directory',
    description: 'People search with fuzzy matching and skills',
    difficulty: 'Intermediate',
    duration: '4-5 minutes'
  },
  {
    file: 'advanced-search.ts',
    title: '🏪 Advanced Search',
    description: 'E-commerce product search with custom scoring',
    difficulty: 'Intermediate',
    duration: '5-6 minutes'
  },
  {
    file: 'performance-demo.ts',
    title: '⚡ Performance Demo',
    description: 'Large dataset optimization and benchmarks',
    difficulty: 'Advanced',
    duration: '3-4 minutes'
  }
];

function printHeader(): void {
  console.clear();
  console.log(`${colors.cyan}${colors.bright}`);
  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║               🔍 Universal Search Examples                   ║');
  console.log('║                  Interactive Runner                          ║');
  console.log('╚══════════════════════════════════════════════════════════════╝');
  console.log(`${colors.reset}\n`);
}

function printMenu(): void {
  console.log(`${colors.bright}Available Examples:${colors.reset}\n`);

  examples.forEach((example, index) => {
    const difficultyColor = example.difficulty === 'Beginner' ? colors.green
      : example.difficulty === 'Intermediate' ? colors.yellow
        : colors.red;

    console.log(`${colors.white}${index + 1}.${colors.reset} ${example.title}`);
    console.log(`   ${colors.dim}${example.description}${colors.reset}`);
    console.log(`   ${difficultyColor}${example.difficulty}${colors.reset} • ${colors.dim}~${example.duration}${colors.reset}\n`);
  });

  console.log(`${colors.white}0.${colors.reset} ${colors.magenta}Run All Examples${colors.reset}`);
  console.log(`   ${colors.dim}Execute all examples in sequence${colors.reset}\n`);

  console.log(`${colors.white}q.${colors.reset} ${colors.red}Quit${colors.reset}\n`);
}

async function runExample(exampleFile: string): Promise<void> {
  const filePath = join(__dirname, exampleFile);

  console.log(`${colors.cyan}${colors.bright}Running: ${exampleFile}${colors.reset}\n`);

  return new Promise((resolve, reject) => {
    const child = spawn('bun', [filePath], {
      stdio: 'inherit',
      cwd: process.cwd()
    });

    child.on('close', (code) => {
      if (code === 0) {
        console.log(`\n${colors.green}✅ Example completed successfully!${colors.reset}\n`);
        resolve();
      } else {
        console.log(`\n${colors.red}❌ Example failed with code ${code}${colors.reset}\n`);
        reject(new Error(`Example failed with code ${code}`));
      }
    });

    child.on('error', (err) => {
      console.log(`\n${colors.red}❌ Error running example: ${err.message}${colors.reset}\n`);
      reject(err);
    });
  });
}

async function runAllExamples(): Promise<void> {
  console.log(`${colors.magenta}${colors.bright}Running all examples...${colors.reset}\n`);

  for (let i = 0; i < examples.length; i++) {
    const example = examples[i]!;
    console.log(`${colors.yellow}[${i + 1}/${examples.length}] ${example.title}${colors.reset}`);

    try {
      await runExample(example.file);

      if (i < examples.length - 1) {
        console.log(`${colors.dim}Press Enter to continue to next example...${colors.reset}`);
        await waitForInput();
      }
    } catch (error) {
      console.log(`${colors.red}Stopping due to error in ${example.file}${colors.reset}`);
      break;
    }
  }

  console.log(`${colors.green}${colors.bright}All examples completed!${colors.reset}\n`);
}

function waitForInput(): Promise<void> {
  return new Promise((resolve) => {
    const rl = createInterface({
      input: process.stdin,
      output: process.stdout
    });

    rl.question('', () => {
      rl.close();
      resolve();
    });
  });
}

async function getUserChoice(): Promise<string> {
  const rl = createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise((resolve) => {
    rl.question(`${colors.bright}Choose an example (1-${examples.length}, 0 for all, q to quit): ${colors.reset}`, (answer) => {
      rl.close();
      resolve(answer.trim().toLowerCase());
    });
  });
}

async function main(): Promise<void> {
  try {
    // Check if examples directory exists and has the expected files
    const exampleFiles = await readdir(__dirname);
    const missingFiles = examples
      .map(e => e.file)
      .filter(file => !exampleFiles.includes(file));

    if (missingFiles.length > 0) {
      console.log(`${colors.red}❌ Missing example files: ${missingFiles.join(', ')}${colors.reset}`);
      console.log(`${colors.yellow}Make sure you're running this from the examples directory and all examples are built.${colors.reset}`);
      process.exit(1);
    }

    while (true) {
      printHeader();
      printMenu();

      const choice = await getUserChoice();

      if (choice === 'q' || choice === 'quit') {
        console.log(`${colors.cyan}Thanks for exploring Universal Search! 🔍${colors.reset}`);
        break;
      }

      if (choice === '0') {
        await runAllExamples();
        console.log(`${colors.dim}Press Enter to return to menu...${colors.reset}`);
        await waitForInput();
        continue;
      }

      const exampleIndex = parseInt(choice) - 1;

      if (exampleIndex >= 0 && exampleIndex < examples.length) {
        const example = examples[exampleIndex]!;
        try {
          await runExample(example.file);
        } catch (error) {
          // Error already logged in runExample
        }

        console.log(`${colors.dim}Press Enter to return to menu...${colors.reset}`);
        await waitForInput();
      } else {
        console.log(`${colors.red}Invalid choice. Please select 1-${examples.length}, 0, or q.${colors.reset}`);
        console.log(`${colors.dim}Press Enter to continue...${colors.reset}`);
        await waitForInput();
      }
    }
  } catch (error) {
    console.error(`${colors.red}❌ Error: ${(error as Error).message}${colors.reset}`);
    process.exit(1);
  }
}

// Handle Ctrl+C gracefully
process.on('SIGINT', () => {
  console.log(`\n${colors.cyan}Thanks for exploring Universal Search! 🔍${colors.reset}`);
  process.exit(0);
});

// Run the interactive menu
main();
