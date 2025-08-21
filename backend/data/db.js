// In-memory 'database' for users
const users = [];

// In-memory 'database' for projects
const projects = [
  {
    id: "1",
    title: "Build a Personal Portfolio Website",
    description: "Create a stunning personal portfolio to showcase your skills and projects.",
    domain: "Web Development",
    difficulty: "beginner",
    estimatedHours: 10,
    technologies: ["HTML", "CSS", "JavaScript"],
    xpReward: 100,
  },
  {
    id: "2",
    title: "E-commerce Product Page",
    description: "Develop a dynamic product page for an e-commerce website with a shopping cart.",
    domain: "Web Development",
    difficulty: "intermediate",
    estimatedHours: 25,
    technologies: ["React", "Node.js", "Express"],
    xpReward: 250,
  }
];

// In-memory 'database' for user enrollments
const enrollments = [];

// In-memory 'database' for gamification data
const userStats = {}; // Keyed by userId
const leaderboard = [];
const badges = [
  { id: '1', name: 'First Steps', description: 'Complete your first project.', iconUrl: '/badges/first-steps.png' },
  { id: '2', name: 'Web Weaver', description: 'Complete 5 web development projects.', iconUrl: '/badges/web-weaver.png' },
  { id: '3', name: 'Code Connoisseur', description: 'Master 3 different programming languages.', iconUrl: '/badges/code-connoisseur.png' }
];
const achievements = {}; // Keyed by userId

// In-memory 'database' for notifications
const notifications = {}; // Keyed by userId

// In-memory stores for code IDE features
const codeHistory = {}; // projectId -> CodeHistory[]
const sharedCodes = {}; // shareId -> { code, language, projectTitle, milestoneTitle, sharedBy, sharedAt }
const codeSnippets = {}; // language -> Snippet[]
const executions = {}; // executionId -> ExecutionResult
const languageTemplates = {
  javascript: "console.log('Hello, World!')\n",
  python: "print('Hello, World!')\n",
  java: 'public class Main {\n  public static void main(String[] args) {\n    System.out.println("Hello, World!");\n  }\n}\n',
  cpp: '#include <iostream>\nint main(){ std::cout << "Hello, World!"; }\n',
};

module.exports = {
  users,
  projects,
  enrollments,
  userStats,
  leaderboard,
  badges,
  achievements,
  notifications,
  codeHistory,
  sharedCodes,
  codeSnippets,
  executions,
  languageTemplates,
};
