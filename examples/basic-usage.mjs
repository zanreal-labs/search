// Basic Usage Examples - Universal Search Library
// This example demonstrates fundamental search patterns and configurations
import { search, quickSearch, createSearcher } from '../dist/index.mjs';

// Sample data with nested objects
const users = [
  {
    id: 1,
    name: 'John Doe',
    email: 'john.doe@company.com',
    profile: {
      title: 'Software Engineer',
      bio: 'Loves TypeScript and modern web development',
      department: 'Engineering'
    },
    skills: ['JavaScript', 'TypeScript', 'React', 'Node.js']
  },
  {
    id: 2,
    name: 'Jane Smith',
    email: 'jane.smith@company.com',
    profile: {
      title: 'Product Manager',
      bio: 'Enjoys building products that users love',
      department: 'Product'
    },
    skills: ['Product Strategy', 'User Research', 'Analytics']
  },
  {
    id: 3,
    name: 'Bob Johnson',
    email: 'bob.johnson@company.com',
    profile: {
      title: 'UX Designer',
      bio: 'Creative visual designer focused on user experience',
      department: 'Design'
    },
    skills: ['UI Design', 'Prototyping', 'User Testing', 'Figma']
  },
  {
    id: 4,
    name: 'Alice Chen',
    email: 'alice.chen@company.com',
    profile: {
      title: 'DevOps Engineer',
      bio: 'Infrastructure and automation specialist',
      department: 'Engineering'
    },
    skills: ['AWS', 'Docker', 'Kubernetes', 'CI/CD']
  }
];

console.log('🔍 Universal Search - Basic Usage Examples\n');

// 1. Quick Search - Simplest way to search
console.log('=== 1. Quick Search (fastest, returns just items) ===');
const quickResults = quickSearch(users, 'john');
console.log('Search for "john":', quickResults.map(user => user.name));

// Try with partial matches
const quickPartial = quickSearch(users, 'eng');
console.log('Search for "eng":', quickPartial.map(user => `${user.name} (${user.profile.title})`));
console.log();

// 2. Detailed Search - Full control with scoring
console.log('=== 2. Detailed Search (with scores and configuration) ===');
const detailedResults = search(users, 'engineer', {
  fieldWeights: {
    'profile.title': 10,  // Prioritize job titles
    name: 5,              // Names are important
    'profile.bio': 3,     // Bio content has moderate importance
    email: 1              // Email has low importance
  }
});

console.log('Search for "engineer":');
detailedResults.forEach(result => {
  console.log(`  ${result.item.name} - Score: ${result.score.toFixed(2)} (${result.item.profile.title})`);
});
console.log();

// 3. Custom Searcher - Reusable configuration
console.log('=== 3. Custom Searcher (reusable configuration) ===');
const peopleSearcher = createSearcher({
  fieldWeights: {
    name: 15,             // Names are most important for people search
    'profile.title': 10,  // Job titles are very important
    skills: 8,            // Skills are important for finding expertise
    'profile.department': 5,
    'profile.bio': 3,
    email: 1
  },
  fuzzyThreshold: 0.6,    // Allow for typos in names
  limit: 10               // Limit results for performance
});

console.log('Custom searcher for "design":');
const designResults = peopleSearcher(users, 'design');
designResults.forEach(result => {
  console.log(`  ${result.item.name} - ${result.item.profile.title} (Score: ${result.score.toFixed(2)})`);
});
console.log();

// 4. Search with different configurations
console.log('=== 4. Different Search Configurations ===');

// Strict matching (higher threshold)
const strictResults = search(users, 'javascript', {
  fieldWeights: { skills: 10, 'profile.bio': 5 },
  fuzzyThreshold: 0.9  // Very strict matching
});
console.log('Strict search for "javascript":');
strictResults.forEach(r => console.log(`  ${r.item.name} - Skills: ${r.item.skills.join(', ')}`));

// Fuzzy matching (lower threshold for typos)
const fuzzyResults = search(users, 'javascrpt', {  // Note the typo
  fieldWeights: { skills: 10, 'profile.bio': 5 },
  fuzzyThreshold: 0.5  // More tolerant of typos
});
console.log('\nFuzzy search for "javascrpt" (with typo):');
fuzzyResults.forEach(r => console.log(`  ${r.item.name} - Skills: ${r.item.skills.join(', ')}`));
console.log();

// 5. Field-specific searches
console.log('=== 5. Field-Specific Searches ===');

// Search only in specific fields
const titleSearch = search(users, 'manager', {
  fields: ['profile.title'],  // Only search in job titles
  fieldWeights: { 'profile.title': 10 }
});
console.log('Title-only search for "manager":');
titleSearch.forEach(r => console.log(`  ${r.item.name} - ${r.item.profile.title}`));

// Department search
const deptSearch = search(users, 'engineering', {
  fieldWeights: { 'profile.department': 20, 'profile.title': 5 }
});
console.log('\nDepartment search for "engineering":');
deptSearch.forEach(r => console.log(`  ${r.item.name} - ${r.item.profile.department} (${r.item.profile.title})`));
console.log();

// 6. Analytics and insights
console.log('=== 6. Search Analytics ===');
const analyticsResults = search(users, 'design', {
  fieldWeights: { name: 10, 'profile.title': 8, skills: 6, 'profile.bio': 4 }
});

const analytics = {
  totalResults: analyticsResults.length,
  avgScore: analyticsResults.length > 0
    ? (analyticsResults.reduce((sum, r) => sum + r.score, 0) / analyticsResults.length).toFixed(2)
    : 0,
  topResult: analyticsResults[0]?.item.name || 'None',
  departments: [...new Set(analyticsResults.map(r => r.item.profile.department))]
};

console.log('Analytics for "design" search:');
console.log(`  Total Results: ${analytics.totalResults}`);
console.log(`  Average Score: ${analytics.avgScore}`);
console.log(`  Top Result: ${analytics.topResult}`);
console.log(`  Departments Found: ${analytics.departments.join(', ')}`);
console.log();

// 7. Common patterns summary
console.log('=== 7. Pattern Summary ===');
console.log('✅ Quick Search: For simple, fast searches without scoring');
console.log('✅ Detailed Search: When you need scores and custom configuration');
console.log('✅ Custom Searcher: For reusable configurations and better performance');
console.log('✅ Field Weights: Prioritize important fields (names, titles, etc.)');
console.log('✅ Fuzzy Threshold: Balance between strict matching and typo tolerance');
console.log('✅ Field Filtering: Search only in specific fields when needed');
console.log('✅ Analytics: Track search performance and user behavior');

console.log('\n🎯 Next Steps:');
console.log('- Try modifying the sample data to match your use case');
console.log('- Experiment with different field weights');
console.log('- Test with various search queries and typos');
console.log('- Check out other examples: advanced-search.mjs, user-directory.mjs');
