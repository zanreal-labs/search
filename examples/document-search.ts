// Document search example with nested objects and content analysis
import { search, createDocumentSearcher, searchItems } from '../src/index';

// Define types for better TypeScript support
interface Author {
  name: string;
  email: string;
  bio: string;
}

interface Content {
  summary: string;
  body: string;
  wordCount: number;
}

interface Metadata {
  category: string;
  tags: string[];
  publishDate: string;
  readTime: number;
}

interface Document {
  id: string;
  title: string;
  author: Author;
  content: Content;
  metadata: Metadata;
}

// Sample document data with nested structure
const documents: Document[] = [
  {
    id: 'doc1',
    title: 'Introduction to TypeScript',
    author: {
      name: 'John Developer',
      email: 'john@example.com',
      bio: 'Senior software engineer specializing in web development'
    },
    content: {
      summary: 'A comprehensive guide to getting started with TypeScript',
      body: 'TypeScript is a powerful superset of JavaScript that adds static typing...',
      wordCount: 2500
    },
    metadata: {
      category: 'Programming',
      tags: ['typescript', 'javascript', 'programming', 'tutorial'],
      publishDate: '2024-01-15',
      readTime: 12
    }
  },
  {
    id: 'doc2',
    title: 'Advanced React Patterns',
    author: {
      name: 'Jane React',
      email: 'jane@example.com',
      bio: 'Frontend architect with expertise in React ecosystem'
    },
    content: {
      summary: 'Deep dive into advanced React patterns and best practices',
      body: 'React has evolved significantly over the years. This article explores...',
      wordCount: 3200
    },
    metadata: {
      category: 'Frontend',
      tags: ['react', 'frontend', 'javascript', 'patterns'],
      publishDate: '2024-02-01',
      readTime: 15
    }
  },
  {
    id: 'doc3',
    title: 'Building Scalable Node.js Applications',
    author: {
      name: 'Bob Backend',
      email: 'bob@example.com',
      bio: 'Backend developer focused on scalable architecture'
    },
    content: {
      summary: 'Best practices for building and scaling Node.js applications',
      body: 'Node.js provides excellent performance for server-side applications...',
      wordCount: 4100
    },
    metadata: {
      category: 'Backend',
      tags: ['nodejs', 'backend', 'javascript', 'scalability'],
      publishDate: '2024-01-28',
      readTime: 18
    }
  },
  {
    id: 'doc4',
    title: 'JavaScript Performance Optimization',
    author: {
      name: 'Alice Performance',
      email: 'alice@example.com',
      bio: 'Performance engineer optimizing web applications'
    },
    content: {
      summary: 'Techniques and tools for optimizing JavaScript performance',
      body: 'Performance optimization is crucial for modern web applications...',
      wordCount: 2800
    },
    metadata: {
      category: 'Performance',
      tags: ['javascript', 'performance', 'optimization', 'web'],
      publishDate: '2024-02-10',
      readTime: 14
    }
  }
];

console.log('=== Document Search Examples ===\n');

// 1. Basic document search
console.log('1. Search for "javascript":');
const jsResults = search(documents, 'javascript');
jsResults.forEach(result => {
  console.log(`  - "${result.item.title}" by ${result.item.author.name}`);
  console.log(`    Score: ${result.score.toFixed(1)} | Category: ${result.item.metadata.category}`);
  result.matches.forEach(match => {
    if (match.score > 10) { // Only show high-scoring matches
      console.log(`    Match in ${match.field}: "${match.value.substring(0, 50)}..." (${match.type})`);
    }
  });
  console.log('');
});

// 2. Document searcher with enhanced weights
console.log('2. Document search with title/author priority:');
const docSearcher = createDocumentSearcher();
const titleResults = search(documents, 'react', {
  fieldWeights: {
    title: 15,           // Highest priority
    'author.name': 10,   // Author name important
    'content.summary': 8, // Summary important
    'metadata.tags': 5,  // Tags moderate
    'content.body': 2,   // Body text lower priority
    'author.bio': 1      // Bio lowest priority
  }
});

titleResults.forEach(result => {
  console.log(`  - "${result.item.title}" (Score: ${result.score.toFixed(1)})`);
  console.log(`    Author: ${result.item.author.name} | Read time: ${result.item.metadata.readTime}min`);
});

// 3. Author-specific search
console.log('\n3. Search by author expertise:');
const authorResults = search(documents, 'frontend', {
  fields: ['author.name', 'author.bio', 'metadata.category'],
  fieldWeights: {
    'author.bio': 10,
    'author.name': 5,
    'metadata.category': 8
  }
});

authorResults.forEach(result => {
  console.log(`  - "${result.item.title}"`);
  console.log(`    Author: ${result.item.author.name}`);
  console.log(`    Bio: ${result.item.author.bio}`);
  console.log('');
});

// 4. Content length analysis
console.log('4. Search with content length consideration:');
const contentResults = search(documents, 'optimization')
  .map(result => ({
    ...result,
    // Boost longer articles (more comprehensive)
    contentScore: result.score * (result.item.content.wordCount / 1000)
  }))
  .sort((a, b) => b.contentScore - a.contentScore);

contentResults.forEach(result => {
  console.log(`  - "${result.item.title}"`);
  console.log(`    Words: ${result.item.content.wordCount} | Enhanced Score: ${result.contentScore.toFixed(1)}`);
});

// 5. Category-filtered search
console.log('\n5. Programming category search:');
const programmingDocs = documents.filter(doc =>
  doc.metadata.category === 'Programming' ||
  doc.metadata.tags.includes('programming')
);

const progResults = searchItems(programmingDocs, 'typescript');
progResults.forEach(doc => {
  console.log(`  - "${doc.title}" | ${doc.metadata.readTime}min read`);
});

// 6. Multi-term search
console.log('\n6. Multi-term search for "javascript performance":');
const multiResults = search(documents, 'javascript performance');
multiResults.forEach(result => {
  console.log(`  - "${result.item.title}" (Score: ${result.score.toFixed(1)})`);
  console.log(`    Summary: ${result.item.content.summary}`);
  console.log('');
});
