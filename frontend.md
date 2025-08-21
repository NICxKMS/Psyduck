# 🦆 Psyduck Frontend Architecture Documentation

## Overview

The Psyduck Learning Platform frontend is built with modern React architecture, emphasizing performance, maintainability, and user experience. This document covers the complete frontend architecture, from component design to state management and performance optimization.

## 🏗️ Architecture Overview

### Technology Stack
- **React 18**: Latest React with concurrent features and Suspense
- **TypeScript**: Full type safety throughout the application
- **Tailwind CSS v4**: Modern utility-first CSS framework with custom design system
- **React Query**: Powerful data fetching, caching, and synchronization
- **Monaco Editor**: VS Code's editor integrated for coding exercises
- **Socket.IO Client**: Real-time communication for live features

### Architectural Patterns
- **Component-Based Architecture**: Modular, reusable components
- **Service Layer Pattern**: Clean separation of business logic
- **Provider Pattern**: Context-based state management
- **Lazy Loading**: Performance optimization through code splitting
- **Error Boundaries**: Robust error handling and recovery

## 📁 Directory Structure

```
src/
├── App.tsx                    # Application entry point
├── components/                # React components
│   ├── auth/                 # Authentication components
│   ├── ide/                  # IDE and code editor components
│   ├── projects/             # Project-related components
│   ├── recruiting/           # Premium recruiting features
│   ├── shared/              # Shared utility components
│   ├── providers/           # Context providers
│   ├── ui/                  # ShadCN UI component library
│   └── lazy/                # Lazy-loaded component exports
├── services/                # Service layer
│   ├── api/                 # API client layer
│   ├── frontend/            # Frontend service layer
│   └── legacy/              # Backwards compatibility
├── contexts/                # React contexts
├── hooks/                   # Custom React hooks
├── lib/                     # Utility libraries
│   ├── hooks/              # Utility hooks
│   ├── utils/              # Helper functions
│   └── performance/        # Performance utilities
├── types/                   # TypeScript type definitions
├── config/                  # Configuration files
└── styles/                  # CSS and styling
    └── globals.css         # Global styles and design system
```

## 🎨 Design System

### Color Palette
```css
:root {
  /* Psyduck Brand Colors */
  --psyduck-primary: #E67514;     /* Main brand color */
  --psyduck-dark: #212121;        /* Dark backgrounds */
  --psyduck-success: #06923E;     /* Success states */
  --psyduck-soft: #D3ECCD;        /* Soft backgrounds */
  --psyduck-primary-hover: #d16612; /* Hover states */
  --psyduck-success-light: #e8f5e8; /* Light success */
}
```

### Typography System
```css
:root {
  --font-size: 14px;              /* Base font size */
  --font-weight-normal: 400;      /* Normal text */
  --font-weight-medium: 500;      /* Headings and emphasis */
  
  /* Text size scale */
  --text-2xl: 1.5rem;            /* Large headings */
  --text-xl: 1.25rem;            /* Medium headings */
  --text-lg: 1.125rem;           /* Small headings */
  --text-base: 1rem;             /* Body text */
}
```

### Component Variants
- **Primary Buttons**: Orange background with white text
- **Secondary Buttons**: Outlined with orange border
- **Success States**: Green backgrounds and borders
- **Card Components**: Clean white backgrounds with subtle shadows
- **Input Fields**: Consistent styling with focus states

## 🔧 Service Architecture

### Service Manager Pattern
The frontend uses a centralized service manager that coordinates all domain-specific services:

```typescript
// ServiceManager coordinates all services
import { serviceManager } from './services/frontend/ServiceManager';

// Initialize services
await serviceManager.initialize();

// Get specific service
const authService = serviceManager.getService('auth');
const projectService = serviceManager.getService('projects');
```

### Domain Services

#### Authentication Service
```typescript
// AuthService handles all auth-related operations
import { authServiceFrontend } from './services/frontend/AuthService';

// Login user
const response = await authServiceFrontend.login(email, password);

// Check authentication status
const isAuthenticated = authServiceFrontend.isAuthenticated();

// Get current user
const user = authServiceFrontend.getCurrentUser();
```

#### Project Service
```typescript
// ProjectService manages project data and operations
import { projectServiceFrontend } from './services/frontend/ProjectService';

// Get available projects with caching
const projects = await projectServiceFrontend.getAvailableProjects();

// Enroll in project
const enrollment = await projectServiceFrontend.enrollInProject(projectId);

// Track progress
await projectServiceFrontend.updateProjectProgress(projectId, progressData);
```

#### Gamification Service
```typescript
// GamificationService handles XP, badges, and leaderboards
import { gamificationServiceFrontend } from './services/frontend/GamificationService';

// Get user stats
const stats = await gamificationServiceFrontend.getUserStats();

// Get leaderboard
const leaderboard = await gamificationServiceFrontend.getLeaderboard('weekly');

// Calculate XP progress
const progress = gamificationServiceFrontend.getXPProgress();
```

## 🎣 State Management

### React Query Integration
React Query handles all server state management with powerful caching:

```typescript
// Custom hooks for data fetching
export const useUserProfile = () => {
  return useQuery({
    queryKey: ['user', 'profile'],
    queryFn: () => authServiceFrontend.getUserProfile(),
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
  });
};

export const useProjects = (filters?: ProjectFilters) => {
  return useQuery({
    queryKey: ['projects', filters],
    queryFn: () => projectServiceFrontend.getAvailableProjects(filters),
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};
```

### Context Providers
Application state is managed through specialized contexts:

```typescript
// AuthContext - User authentication state
const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  // Authentication logic...
  
  return (
    <AuthContext.Provider value={{ user, isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

// UIContext - UI state and theme management
const UIProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  // UI state management...
  
  return (
    <UIContext.Provider value={{ theme, sidebarOpen, setTheme, setSidebarOpen }}>
      {children}
    </UIContext.Provider>
  );
};
```

## 🎯 Component Architecture

### Component Categories

#### Page Components
Full-page components that represent different routes:
- `Dashboard.tsx` - Main dashboard with overview
- `ProjectCatalog.tsx` - Browse and search projects
- `IDE.tsx` - Integrated development environment
- `Profile.tsx` - User profile and settings
- `Leaderboard.tsx` - Global rankings

#### Feature Components
Components that implement specific features:
- `FloatingChatbot.tsx` - AI assistance chatbot
- `CodeExecutionPanel.tsx` - Code execution interface
- `ProgressTracker.tsx` - Learning progress visualization
- `NotificationCenter.tsx` - Notification management

#### UI Components (ShadCN)
Reusable UI components based on ShadCN library:
- `Button.tsx` - Various button styles and states
- `Card.tsx` - Content containers
- `Input.tsx` - Form input fields
- `Modal.tsx` - Dialog and modal components
- `Table.tsx` - Data tables

#### Shared Components
Cross-cutting components used throughout the app:
- `LoadingSpinner.tsx` - Loading states
- `ErrorBoundary.tsx` - Error handling
- `EmptyState.tsx` - Empty data states
- `Breadcrumbs.tsx` - Navigation breadcrumbs

### Component Patterns

#### Compound Components
```typescript
// Card component with subcomponents
export const Card = ({ children, ...props }: CardProps) => (
  <div className="card" {...props}>{children}</div>
);

Card.Header = ({ children }: { children: React.ReactNode }) => (
  <div className="card-header">{children}</div>
);

Card.Body = ({ children }: { children: React.ReactNode }) => (
  <div className="card-body">{children}</div>
);

Card.Footer = ({ children }: { children: React.ReactNode }) => (
  <div className="card-footer">{children}</div>
);

// Usage
<Card>
  <Card.Header>
    <h3>Project Title</h3>
  </Card.Header>
  <Card.Body>
    <p>Project description...</p>
  </Card.Body>
  <Card.Footer>
    <Button>Enroll</Button>
  </Card.Footer>
</Card>
```

#### Higher-Order Components
```typescript
// withAuth HOC for protected routes
export const withAuth = <P extends object>(
  Component: React.ComponentType<P>
) => {
  return (props: P) => {
    const { isAuthenticated } = useAuth();
    
    if (!isAuthenticated) {
      return <Navigate to="/login" />;
    }
    
    return <Component {...props} />;
  };
};

// Usage
export default withAuth(Dashboard);
```

#### Custom Hooks
```typescript
// useLocalStorage hook
export const useLocalStorage = <T>(key: string, initialValue: T) => {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      return initialValue;
    }
  });

  const setValue = (value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.error('Error saving to localStorage:', error);
    }
  };

  return [storedValue, setValue] as const;
};

// useDebounce hook
export const useDebounce = <T>(value: T, delay: number): T => {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};
```

## 🚀 Performance Optimization

### Code Splitting and Lazy Loading
```typescript
// Route-based code splitting
const Dashboard = React.lazy(() => import('./components/Dashboard'));
const ProjectCatalog = React.lazy(() => import('./components/ProjectCatalog'));
const IDE = React.lazy(() => import('./components/IDE'));

// Component lazy loading with fallback
const LazyComponent = React.lazy(() => 
  import('./components/HeavyComponent').catch(() => ({
    default: () => <div>Failed to load component</div>
  }))
);

// Usage with Suspense
<Suspense fallback={<LoadingSpinner />}>
  <LazyComponent />
</Suspense>
```

### Memoization Strategies
```typescript
// React.memo for pure components
export const ProjectCard = React.memo(({ project }: { project: Project }) => {
  return (
    <div className="project-card">
      <h3>{project.title}</h3>
      <p>{project.description}</p>
    </div>
  );
});

// useMemo for expensive calculations
const ExpensiveComponent = ({ data }: { data: DataItem[] }) => {
  const processedData = useMemo(() => {
    return data
      .filter(item => item.isActive)
      .sort((a, b) => b.priority - a.priority)
      .map(item => ({
        ...item,
        formattedDate: formatDate(item.createdAt)
      }));
  }, [data]);

  return <DataList items={processedData} />;
};

// useCallback for stable function references
const SearchComponent = () => {
  const [query, setQuery] = useState('');
  
  const handleSearch = useCallback((searchTerm: string) => {
    // Search logic...
    setQuery(searchTerm);
  }, []);

  return <SearchInput onSearch={handleSearch} />;
};
```

### Virtual Scrolling
```typescript
// Virtual scrolling for large lists
import { FixedSizeList as List } from 'react-window';

const VirtualizedProjectList = ({ projects }: { projects: Project[] }) => {
  const Row = ({ index, style }: { index: number; style: React.CSSProperties }) => (
    <div style={style}>
      <ProjectCard project={projects[index]} />
    </div>
  );

  return (
    <List
      height={600}
      itemCount={projects.length}
      itemSize={120}
      width="100%"
    >
      {Row}
    </List>
  );
};
```

## 🎮 CodeMirror 6 Integration

### Editor Configuration
```typescript
// CodeMirror 6 basic setup example
import { useEffect, useRef } from 'react';
import { EditorState } from '@codemirror/state';
import { EditorView, keymap } from '@codemirror/view';
import { defaultKeymap } from '@codemirror/commands';
import { javascript } from '@codemirror/lang-javascript';

export const CodeEditor: React.FC<{ value: string; onChange: (v: string) => void }> = ({ value, onChange }) => {
  const ref = useRef<HTMLDivElement | null>(null);
  const viewRef = useRef<EditorView | null>(null);

  useEffect(() => {
    if (!ref.current || viewRef.current) return;
    const state = EditorState.create({
      doc: value,
      extensions: [keymap.of(defaultKeymap), javascript({ jsx: true })]
    });
    viewRef.current = new EditorView({
      state,
      parent: ref.current,
      dispatch: tr => {
        viewRef.current!.update([tr]);
        if (tr.docChanged) onChange(tr.state.doc.toString());
      }
    });
    return () => { try { viewRef.current?.destroy(); } catch {} viewRef.current = null; };
  }, [value, onChange]);

  return <div ref={ref} />;
};
```

### Language Support
```typescript
// Supported programming languages
export const SUPPORTED_LANGUAGES = [
  { id: 'javascript', name: 'JavaScript', extension: '.js' },
  { id: 'typescript', name: 'TypeScript', extension: '.ts' },
  { id: 'python', name: 'Python', extension: '.py' },
  { id: 'java', name: 'Java', extension: '.java' },
  { id: 'cpp', name: 'C++', extension: '.cpp' },
  { id: 'c', name: 'C', extension: '.c' },
  { id: 'go', name: 'Go', extension: '.go' },
  { id: 'rust', name: 'Rust', extension: '.rs' },
  { id: 'php', name: 'PHP', extension: '.php' },
  { id: 'ruby', name: 'Ruby', extension: '.rb' }
];

// Language-specific configurations
export const getLanguageConfig = (languageId: string) => {
  const configs = {
    javascript: {
      defaultValue: 'console.log("Hello, World!");',
      fileIcon: '📄',
      supportsInput: true
    },
    python: {
      defaultValue: 'print("Hello, World!")',
      fileIcon: '🐍',
      supportsInput: true
    },
    java: {
      defaultValue: 'public class Main {\n    public static void main(String[] args) {\n        System.out.println("Hello, World!");\n    }\n}',
      fileIcon: '☕',
      supportsInput: true
    }
  };

  return configs[languageId] || { defaultValue: '', fileIcon: '📄', supportsInput: false };
};
```

## 🔄 Real-Time Features

### Socket.IO Integration
```typescript
// Socket service for real-time communication
import { io, Socket } from 'socket.io-client';

class SocketService {
  private socket: Socket | null = null;

  connect(token: string): void {
    this.socket = io(process.env.REACT_APP_SOCKET_URL, {
      auth: { token },
      transports: ['websocket']
    });

    this.socket.on('connect', () => {
      console.log('Connected to server');
    });

    this.socket.on('disconnect', () => {
      console.log('Disconnected from server');
    });
  }

  // Join project room for real-time updates
  joinProject(projectId: string): void {
    this.socket?.emit('join_project', { projectId });
  }

  // Listen for project updates
  onProjectUpdate(callback: (data: any) => void): void {
    this.socket?.on('project_update', callback);
  }

  // Listen for achievement notifications
  onAchievement(callback: (achievement: any) => void): void {
    this.socket?.on('user_achievement', callback);
  }

  disconnect(): void {
    this.socket?.disconnect();
    this.socket = null;
  }
}

export const socketService = new SocketService();
```

### Real-Time Notifications
```typescript
// Real-time notification hook
export const useRealTimeNotifications = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    // Listen for new notifications
    socketService.onNotification((notification: Notification) => {
      setNotifications(prev => [notification, ...prev]);
      
      // Show toast notification
      toast.success(notification.title, {
        description: notification.message
      });
    });

    // Listen for achievements
    socketService.onAchievement((achievement: Achievement) => {
      toast.success('🎉 Achievement Unlocked!', {
        description: achievement.name
      });
    });

    return () => {
      // Cleanup listeners
      socketService.disconnect();
    };
  }, []);

  return notifications;
};
```

## 🎛️ Floating Elements System

### Floating Container Architecture
```typescript
// Isolated floating elements container
export const FloatingElementsContainer: React.FC = () => {
  return (
    <div className="floating-elements-root">
      {/* Chatbot */}
      <div className="floating-element floating-bottom-right">
        <Suspense fallback={null}>
          <FloatingChatbot />
        </Suspense>
      </div>
      
      {/* Content Creator Button (Premium) */}
      <div className="floating-element floating-bottom-right-stacked">
        <Suspense fallback={null}>
          <ContentCreatorFloatingButton />
        </Suspense>
      </div>
      
      {/* Notifications */}
      <div className="floating-element floating-top-right">
        <Suspense fallback={null}>
          <NotificationFloat />
        </Suspense>
      </div>
    </div>
  );
};
```

### Floating Styles
```css
/* Complete isolation from document flow */
.floating-elements-root {
  position: fixed !important;
  top: 0 !important;
  left: 0 !important;
  width: 100vw !important;
  height: 100vh !important;
  pointer-events: none !important;
  z-index: 999999 !important;
  contain: layout style paint !important;
  isolation: isolate !important;
}

.floating-element {
  position: absolute !important;
  pointer-events: auto !important;
  transform: translateZ(0) !important;
  backface-visibility: hidden !important;
  isolation: isolate !important;
}

.floating-bottom-right {
  bottom: 1rem !important;
  right: 1rem !important;
}

.floating-bottom-right-stacked {
  bottom: 5rem !important;
  right: 1rem !important;
}
```

## 📱 Responsive Design

### Mobile-First Approach
```css
/* Base mobile styles */
.component {
  padding: 0.5rem;
  font-size: 0.875rem;
}

/* Tablet styles */
@media (min-width: 768px) {
  .component {
    padding: 1rem;
    font-size: 1rem;
  }
}

/* Desktop styles */
@media (min-width: 1024px) {
  .component {
    padding: 1.5rem;
    font-size: 1.125rem;
  }
}
```

### Responsive Navigation
```typescript
// Mobile-responsive navigation
export const Navigation: React.FC = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const isMobile = useMediaQuery('(max-width: 768px)');

  return (
    <nav className="navigation">
      {isMobile ? (
        <MobileNavigation 
          isOpen={isMobileMenuOpen}
          onToggle={setIsMobileMenuOpen}
        />
      ) : (
        <DesktopNavigation />
      )}
    </nav>
  );
};
```

## 🧪 Testing Strategy

### Component Testing
```typescript
// Example component test
import { render, screen, fireEvent } from '@testing-library/react';
import { ProjectCard } from './ProjectCard';

describe('ProjectCard', () => {
  const mockProject = {
    id: '1',
    title: 'Test Project',
    description: 'Test Description',
    difficulty: 'beginner',
    domain: 'MERN Stack'
  };

  it('renders project information correctly', () => {
    render(<ProjectCard project={mockProject} />);
    
    expect(screen.getByText('Test Project')).toBeInTheDocument();
    expect(screen.getByText('Test Description')).toBeInTheDocument();
    expect(screen.getByText('beginner')).toBeInTheDocument();
  });

  it('calls onEnroll when enroll button is clicked', () => {
    const mockOnEnroll = jest.fn();
    render(<ProjectCard project={mockProject} onEnroll={mockOnEnroll} />);
    
    fireEvent.click(screen.getByText('Enroll'));
    expect(mockOnEnroll).toHaveBeenCalledWith(mockProject.id);
  });
});
```

### Hook Testing
```typescript
// Example custom hook test
import { renderHook, act } from '@testing-library/react';
import { useLocalStorage } from './useLocalStorage';

describe('useLocalStorage', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('returns initial value when no stored value exists', () => {
    const { result } = renderHook(() => useLocalStorage('test-key', 'initial'));
    expect(result.current[0]).toBe('initial');
  });

  it('updates localStorage when value changes', () => {
    const { result } = renderHook(() => useLocalStorage('test-key', 'initial'));
    
    act(() => {
      result.current[1]('updated');
    });

    expect(localStorage.getItem('test-key')).toBe('"updated"');
    expect(result.current[0]).toBe('updated');
  });
});
```

## 🔧 Development Tools

### Development Environment
- **Hot Module Replacement**: Instant updates during development
- **TypeScript**: Full type checking and IntelliSense
- **ESLint**: Code linting and style enforcement
- **Prettier**: Automatic code formatting
- **React DevTools**: Component debugging
- **React Query DevTools**: Data fetching debugging

### Performance Monitoring
```typescript
// Performance monitoring utilities
export const performanceUtils = {
  mark: (name: string) => {
    if ('performance' in window && 'mark' in performance) {
      performance.mark(name);
    }
  },
  
  measure: (name: string, start: string, end: string) => {
    if ('performance' in window && 'measure' in performance) {
      try {
        performance.measure(name, start, end);
      } catch (e) {
        // Ignore if marks don't exist
      }
    }
  },
  
  getNavigationTiming: () => {
    if ('performance' in window && 'getEntriesByType' in performance) {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      return {
        dns: navigation.domainLookupEnd - navigation.domainLookupStart,
        tcp: navigation.connectEnd - navigation.connectStart,
        ttfb: navigation.responseStart - navigation.requestStart,
        download: navigation.responseEnd - navigation.responseStart,
        dom: navigation.domContentLoadedEventEnd - navigation.navigationStart,
        load: navigation.loadEventEnd - navigation.navigationStart
      };
    }
    return null;
  }
};
```

---

**Frontend Architecture by the Psyduck Development Team** 🦆

*Building modern, performant, and accessible user interfaces*