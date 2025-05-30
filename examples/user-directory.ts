// User directory search example with fuzzy matching and typo tolerance
import { search, quickSearch, createSearcher } from '../src/index';

// Define types for better TypeScript support
interface Profile {
  firstName: string;
  lastName: string;
  displayName: string;
  email: string;
}

interface Employment {
  department: string;
  title: string;
  team: string;
  location: string;
}

interface User {
  id: number;
  profile: Profile;
  employment: Employment;
  skills: string[];
  projects: string[];
  bio: string;
}

interface UserWithSearchableFields extends User {
  skillsText: string;
  projectsText: string;
}

// Sample user directory data
const users: User[] = [
  {
    id: 1,
    profile: {
      firstName: 'John',
      lastName: 'Smith',
      displayName: 'Johnny S.',
      email: 'john.smith@company.com'
    },
    employment: {
      department: 'Engineering',
      title: 'Senior Software Engineer',
      team: 'Frontend Development',
      location: 'San Francisco, CA'
    },
    skills: ['JavaScript', 'TypeScript', 'React', 'Node.js'],
    projects: ['E-commerce Platform', 'Mobile App'],
    bio: 'Passionate developer with 8 years of experience in web technologies'
  },
  {
    id: 2,
    profile: {
      firstName: 'Sarah',
      lastName: 'Johnson',
      displayName: 'Sarah J.',
      email: 'sarah.johnson@company.com'
    },
    employment: {
      department: 'Design',
      title: 'UX Designer',
      team: 'Product Design',
      location: 'New York, NY'
    },
    skills: ['Figma', 'Adobe Creative Suite', 'User Research', 'Prototyping'],
    projects: ['Design System', 'Mobile App'],
    bio: 'Creative designer focused on user-centered design solutions'
  },
  {
    id: 3,
    profile: {
      firstName: 'Michael',
      lastName: 'Chen',
      displayName: 'Mike C.',
      email: 'michael.chen@company.com'
    },
    employment: {
      department: 'Engineering',
      title: 'DevOps Engineer',
      team: 'Infrastructure',
      location: 'Austin, TX'
    },
    skills: ['Docker', 'Kubernetes', 'AWS', 'Terraform'],
    projects: ['CI/CD Pipeline', 'Cloud Migration'],
    bio: 'Infrastructure specialist with expertise in cloud technologies'
  },
  {
    id: 4,
    profile: {
      firstName: 'Emily',
      lastName: 'Rodriguez',
      displayName: 'Em Rodriguez',
      email: 'emily.rodriguez@company.com'
    },
    employment: {
      department: 'Engineering',
      title: 'Product Manager',
      team: 'Product Strategy',
      location: 'Seattle, WA'
    },
    skills: ['Product Strategy', 'Data Analysis', 'Agile', 'Stakeholder Management'],
    projects: ['Feature Roadmap', 'User Analytics'],
    bio: 'Product leader driving innovation and user engagement'
  },
  {
    id: 5,
    profile: {
      firstName: 'David',
      lastName: 'Thompson',
      displayName: 'Dave T.',
      email: 'david.thompson@company.com'
    },
    employment: {
      department: 'Engineering',
      title: 'Backend Engineer',
      team: 'API Development',
      location: 'Boston, MA'
    },
    skills: ['Python', 'PostgreSQL', 'Redis', 'Microservices'],
    projects: ['API Gateway', 'Database Optimization'],
    bio: 'Backend engineer specializing in scalable API architecture'
  }
];

console.log('=== User Directory Search Examples ===\n');

// 1. Quick name search
console.log('1. Quick search for "john":');
const nameResults = quickSearch(users, 'john');
nameResults.forEach(user => {
  console.log(`  - ${user.profile.firstName} ${user.profile.lastName} (${user.employment.title})`);
});

// 2. Fuzzy search with typos
console.log('\n2. Fuzzy search for "sarah jonhson" (with typo):');
const fuzzyResults = search(users, 'sarah jonhson', {
  fuzzyThreshold: 0.6, // Lower threshold for more tolerance
  fieldWeights: {
    'profile.firstName': 10,
    'profile.lastName': 10,
    'profile.displayName': 8,
    'profile.email': 5
  }
});

fuzzyResults.forEach(result => {
  console.log(`  - ${result.item.profile.firstName} ${result.item.profile.lastName}`);
  console.log(`    Score: ${result.score.toFixed(1)} | Match type: ${result.matches[0]?.type}`);
  result.matches.forEach(match => {
    console.log(`    ${match.field}: "${match.value}" (${match.type})`);
  });
});

// 3. Skill-based search
console.log('\n3. Search by skills - "react":');
// Note: Since skills is an array, we need to convert users to have searchable skill strings
const usersWithSkillStrings: UserWithSearchableFields[] = users.map(user => ({
  ...user,
  skillsText: user.skills.join(' '), // Convert array to searchable string
  projectsText: user.projects.join(' ') // Convert array to searchable string
}));

const skillResults = search(usersWithSkillStrings, 'react', {
  fields: ['skillsText', 'employment.title', 'bio'],
  fieldWeights: {
    skillsText: 15,       // Skills most important
    'employment.title': 8,
    bio: 3
  }
});

skillResults.forEach(result => {
  console.log(`  - ${result.item.profile.firstName} ${result.item.profile.lastName}`);
  console.log(`    Title: ${result.item.employment.title}`);
  console.log(`    Skills: ${result.item.skills.join(', ')}`);
  console.log('');
});

// 4. Department/team search
console.log('4. Engineering department search for "frontend":');
const deptResults = search(users, 'frontend', {
  fields: ['employment.department', 'employment.team', 'employment.title'],
  fieldWeights: {
    'employment.team': 10,
    'employment.title': 8,
    'employment.department': 5
  }
});

deptResults.forEach(result => {
  console.log(`  - ${result.item.profile.firstName} ${result.item.profile.lastName}`);
  console.log(`    ${result.item.employment.title} | ${result.item.employment.team}`);
  console.log(`    Location: ${result.item.employment.location}`);
});

// 5. Project collaboration search
console.log('\n5. Find collaborators on "Mobile App" project:');
const projectResults = search(usersWithSkillStrings, 'mobile app', {
  fields: ['projectsText'], // Use the converted string field
  fuzzyThreshold: 0.7
});

projectResults.forEach(result => {
  console.log(`  - ${result.item.profile.firstName} ${result.item.profile.lastName}`);
  console.log(`    Department: ${result.item.employment.department}`);
  console.log(`    Projects: ${result.item.projects.join(', ')}`);
  console.log('');
});

// 6. Location-based search
console.log('6. Users in California:');
const locationResults = search(users, 'california', {
  fields: ['employment.location'],
  caseSensitive: false
});

locationResults.forEach(result => {
  console.log(`  - ${result.item.profile.firstName} ${result.item.profile.lastName}`);
  console.log(`    Location: ${result.item.employment.location}`);
  console.log(`    Team: ${result.item.employment.team}`);
});

// 7. Custom user searcher for HR use
console.log('\n7. HR search for "engineer" with comprehensive matching:');
const hrSearcher = createSearcher<UserWithSearchableFields>({
  fieldWeights: {
    'employment.title': 15,
    'employment.team': 10,
    'employment.department': 8,
    skillsText: 12,       // Use converted skills string
    bio: 5,
    'profile.firstName': 3,
    'profile.lastName': 3
  },
  fuzzyThreshold: 0.6,
  limit: 10
});

const hrResults = hrSearcher(usersWithSkillStrings, 'engineer');
hrResults.forEach(result => {
  console.log(`  - ${result.item.profile.firstName} ${result.item.profile.lastName}`);
  console.log(`    ${result.item.employment.title} | ${result.item.employment.department}`);
  console.log(`    Score: ${result.score.toFixed(1)}`);
  console.log('');
});
