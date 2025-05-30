# Publishing Guide

## Before Publishing

1. **Test the package:**

   ```bash
   bun test
   bun run test:example
   ```

2. **Build the package:**

   ```bash
   bun run build
   ```

3. **Verify package contents:**

   ```bash
   npm pack --dry-run
   ```

## Publishing to npm

1. **Login to npm (first time only):**

   ```bash
   npm login
   ```

2. **Publish the package:**

   ```bash
   npm publish
   ```

   Or for the first time with scoped package:

   ```bash
   npm publish --access public
   ```

## Package Details

- **Name:** `@zanreal/universal-search`
- **Version:** 1.0.0
- **Entry Points:**
  - ESM: `dist/index.mjs`
  - CommonJS: `dist/index.js`
  - Types: `dist/index.d.ts`

## Post-Publishing

1. **Test installation:**

   ```bash
   npm install @zanreal/universal-search
   ```

2. **Update version for next release:**

   ```bash
   npm version patch  # or minor/major
   ```

## Bundle Sizes

- ESM: ~3.3 KB minified
- CJS: ~10 KB minified
- Types: ~2.2 KB

## What's Included

- ✅ Universal search engine
- ✅ TypeScript definitions
- ✅ ESM and CommonJS support
- ✅ Comprehensive tests
- ✅ Documentation
- ✅ Examples
