#!/usr/bin/env node
// Example Validation Script - Universal Search Library
// This script validates that all examples work correctly

import { spawn } from 'child_process';
import { readdir, access } from 'fs/promises';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const examples = [
  'basic-usage.mjs',
  'advanced-search.mjs',
  'document-search.mjs',
  'user-directory.mjs',
  'performance-demo.mjs'
];

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m'
};

async function runExample(exampleFile) {
  const filePath = join(__dirname, exampleFile);

  console.log(`${colors.cyan}Testing: ${exampleFile}${colors.reset}`);

  return new Promise((resolve) => {
    const startTime = Date.now();
    const child = spawn('node', [filePath], {
      stdio: 'pipe',
      cwd: process.cwd()
    });

    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    child.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    child.on('close', (code) => {
      const duration = Date.now() - startTime;
      const result = {
        file: exampleFile,
        success: code === 0,
        code,
        duration,
        stdout,
        stderr
      };

      if (code === 0) {
        console.log(`${colors.green}✅ ${exampleFile} - OK (${duration}ms)${colors.reset}`);
      } else {
        console.log(`${colors.red}❌ ${exampleFile} - FAILED (code: ${code})${colors.reset}`);
        if (stderr) {
          console.log(`${colors.red}Error: ${stderr.trim()}${colors.reset}`);
        }
      }

      resolve(result);
    });

    child.on('error', (err) => {
      console.log(`${colors.red}❌ ${exampleFile} - ERROR: ${err.message}${colors.reset}`);
      resolve({
        file: exampleFile,
        success: false,
        error: err.message,
        duration: Date.now() - startTime
      });
    });
  });
}

async function checkPrerequisites() {
  console.log(`${colors.cyan}Checking prerequisites...${colors.reset}`);

  // Check if dist directory exists
  try {
    await access(join(__dirname, '../dist'));
    console.log(`${colors.green}✅ dist/ directory found${colors.reset}`);
  } catch {
    console.log(`${colors.red}❌ dist/ directory not found. Run 'npm run build' first.${colors.reset}`);
    return false;
  }

  // Check if dist/index.mjs exists
  try {
    await access(join(__dirname, '../dist/index.mjs'));
    console.log(`${colors.green}✅ Built library found${colors.reset}`);
  } catch {
    console.log(`${colors.red}❌ Built library not found. Run 'npm run build' first.${colors.reset}`);
    return false;
  }

  return true;
}

async function validateExamples() {
  console.log(`${colors.cyan}${colors.bright}Universal Search - Example Validation${colors.reset}\n`);

  // Check prerequisites
  const prereqsOk = await checkPrerequisites();
  if (!prereqsOk) {
    console.log(`\n${colors.yellow}Please build the library first:${colors.reset}`);
    console.log(`${colors.yellow}  npm run build${colors.reset}\n`);
    process.exit(1);
  }

  console.log();

  // Check that all example files exist
  const existingFiles = await readdir(__dirname);
  const missingFiles = examples.filter(file => !existingFiles.includes(file));

  if (missingFiles.length > 0) {
    console.log(`${colors.red}❌ Missing example files: ${missingFiles.join(', ')}${colors.reset}`);
    process.exit(1);
  }

  console.log(`${colors.cyan}Running ${examples.length} examples...${colors.reset}\n`);

  // Run all examples
  const results = [];
  for (const example of examples) {
    const result = await runExample(example);
    results.push(result);
  }

  // Summary
  console.log(`\n${colors.cyan}${colors.bright}Validation Summary:${colors.reset}`);

  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);

  console.log(`${colors.green}✅ Successful: ${successful.length}/${results.length}${colors.reset}`);
  if (failed.length > 0) {
    console.log(`${colors.red}❌ Failed: ${failed.length}/${results.length}${colors.reset}`);
    failed.forEach(f => {
      console.log(`   ${colors.red}- ${f.file}${colors.reset}`);
    });
  }

  const totalDuration = results.reduce((sum, r) => sum + (r.duration || 0), 0);
  console.log(`${colors.cyan}⏱️  Total time: ${totalDuration}ms${colors.reset}`);

  if (failed.length === 0) {
    console.log(`\n${colors.green}${colors.bright}🎉 All examples are working correctly!${colors.reset}`);
    console.log(`${colors.green}Examples are ready for users to explore.${colors.reset}`);
  } else {
    console.log(`\n${colors.red}${colors.bright}❌ Some examples failed. Please check the errors above.${colors.reset}`);
    process.exit(1);
  }
}

// Handle Ctrl+C gracefully
process.on('SIGINT', () => {
  console.log(`\n${colors.cyan}Validation cancelled.${colors.reset}`);
  process.exit(0);
});

// Run validation
validateExamples().catch(error => {
  console.error(`${colors.red}❌ Validation error: ${error.message}${colors.reset}`);
  process.exit(1);
});
