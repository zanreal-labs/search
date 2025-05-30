# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2025-05-30

### Added

- Initial release of Universal Search Engine
- Fuzzy search with intelligent scoring
- Exact match prioritization (start matches > contains > fuzzy)
- Automatic field detection for any object structure
- Nested object support with dot notation
- Customizable field weights
- TypeScript support with full type definitions
- Multiple output formats (ESM, CJS, TypeScript definitions)
- Core functions: `search`, `searchItems`, `quickSearch`
- Factory functions: `createSearcher`, `createDocumentSearcher`
- Levenshtein distance algorithm for fuzzy matching
- Smart scoring based on field importance and content length
- Configurable options for fuzzy threshold, case sensitivity, result limits

### Features

- Universal compatibility with any data structure
- Intelligent field weight calculation
- Three match types: exact-start, exact-contain, fuzzy
- Automatic field detection up to 3 levels deep
- Built-in support for common field naming patterns
- Optimized for both small and large datasets
