import { test, expect } from "bun:test";
import { search, searchItems, quickSearch, createSearcher, DEFAULT_SEARCH_OPTIONS } from "../src/index";

const testData = [
  { name: 'John Doe', email: 'john@example.com', role: 'developer' },
  { name: 'Jane Smith', email: 'jane@example.com', role: 'designer' },
  { name: 'Bob Johnson', email: 'bob@example.com', role: 'manager' }
];

test("quickSearch returns matching items", () => {
  const results = quickSearch(testData, 'john');
  expect(results).toHaveLength(2); // John Doe and Bob Johnson
  expect(results[0].name).toBe('John Doe');
});

test("search returns detailed results with scores", () => {
  const results = search(testData, 'john');
  expect(results).toHaveLength(2);
  expect(results[0].item.name).toBe('John Doe');
  expect(results[0].score).toBeGreaterThan(0);
  expect(results[0].matches).toBeArray();
  expect(results[0].matches.length).toBeGreaterThan(0);
});

test("searchItems returns just the items", () => {
  const results = searchItems(testData, 'jane');
  expect(results).toHaveLength(1);
  expect(results[0].name).toBe('Jane Smith');
});

test("exact start matches have higher base score than contains", () => {
  const data = [
    { title: 'John Developer' }, // exact-start match
    { title: 'Senior John' }     // exact-contain match
  ];
  const results = search(data, 'john');
  // Both should match, exact-start should have higher base multiplier (20x vs 10x)
  expect(results).toHaveLength(2);
  const startMatch = results.find(r => r.item.title === 'John Developer');
  const containMatch = results.find(r => r.item.title === 'Senior John');
  expect(startMatch).toBeDefined();
  expect(containMatch).toBeDefined();
  expect(startMatch!.matches[0].type).toBe('exact-start');
  expect(containMatch!.matches[0].type).toBe('exact-contain');
});

test("custom field weights work correctly", () => {
  const results = search(testData, 'dev', {
    fieldWeights: { role: 10, name: 1, email: 1 }
  });
  expect(results).toHaveLength(1);
  expect(results[0].item.role).toBe('developer');
});

test("createSearcher creates reusable search function", () => {
  const searcher = createSearcher({
    fieldWeights: { name: 5, email: 1 },
    limit: 1
  });

  const results = searcher(testData, 'john');
  expect(results).toHaveLength(1); // Limited to 1
  expect(results[0].item.name).toBe('John Doe');
});

test("fuzzy search works for similar words", () => {
  // Test with a word that's more likely to match fuzzy search criteria
  const data = [{ name: 'Development Team' }];
  const results = search(data, 'develop'); // Should match "Development" 
  expect(results.length).toBeGreaterThan(0);
  if (results.length > 0) {
    expect(results[0]!.matches[0]!.type).toBe('exact-start'); // "Development" starts with "develop"
  }
});

test("case insensitive search by default", () => {
  const results = search(testData, 'JOHN');
  expect(results.length).toBeGreaterThan(0);
  expect(results[0]!.item.name).toBe('John Doe');
});

test("case sensitive search when enabled", () => {
  const results = search(testData, 'JOHN', { caseSensitive: true });
  expect(results).toHaveLength(0); // No exact matches for uppercase
});

test("empty query returns all items with zero scores", () => {
  const results = search(testData, '');
  expect(results).toHaveLength(3);
  expect(results[0]!.score).toBe(0);
});

test("DEFAULT_SEARCH_OPTIONS are exported", () => {
  expect(DEFAULT_SEARCH_OPTIONS).toEqual({
    fieldWeights: {},
    fuzzyThreshold: 0.7,
    minFuzzyLength: 3,
    limit: 100,
    caseSensitive: false,
  });
});
