// API Client - Pure backend communication layer
import { User } from '../../contexts/AuthContext';
import appConfig from '../../config/environment';

// Configuration interface
interface ApiConfig {
  baseUrl: string;
  useMockApi: boolean;
  timeout: number;
}

// LocalStorage key for API mode
const API_MODE_STORAGE_KEY = 'psyduck.useMockApi';

// Get configuration without using process.env
const getApiConfig = (): ApiConfig => {
  // Safe configuration detection without process.env
  const isDevEnvironment = window.location.hostname === 'localhost' || 
                           window.location.hostname === '127.0.0.1' ||
                           window.location.hostname.includes('figma');

  let useMockApiDefault = true;
  try {
    const stored = localStorage.getItem(API_MODE_STORAGE_KEY);
    if (stored !== null) {
      useMockApiDefault = stored === 'true';
    } else {
      useMockApiDefault = (appConfig?.api?.useMockApi ?? (isDevEnvironment ? true : false));
    }
  } catch (_) {
    useMockApiDefault = true;
  }
  
  return {
    baseUrl: (appConfig?.api?.baseUrl || (isDevEnvironment ? 'http://localhost:3001' : 'https://api.psyduck.dev/v1')),
    useMockApi: useMockApiDefault,
    timeout: appConfig?.api?.timeout || 10000
  };
};

// Response types
export interface ApiResponse<T = any> {
  data: T | null;
  success: boolean;
  message?: string;
  timestamp?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// HTTP request options
interface RequestOptions {
  headers?: Record<string, string>;
  timeout?: number;
  params?: Record<string, any>;
}

// Main API Client class
export class ApiClient {
  private config: ApiConfig;
  private authToken: string | null = null;
  private currentUser: User | null = null;

  constructor() {
    this.config = getApiConfig();
  }

  // Set authentication
  setAuth(token: string | null, user: User | null) {
    this.authToken = token;
    this.currentUser = user;
  }

  // Get current user
  getCurrentUser(): User | null {
    return this.currentUser;
  }

  // Get auth token
  getAuthToken(): string | null {
    return this.authToken;
  }

  // Build request headers
  private buildHeaders(additionalHeaders: Record<string, string> = {}): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...additionalHeaders
    };

    if (this.authToken) {
      headers['Authorization'] = `Bearer ${this.authToken}`;
    }

    return headers;
  }

  // Build URL with query parameters
  private buildUrl(endpoint: string, params?: Record<string, any>): string {
    const url = endpoint.startsWith('http') ? endpoint : `${this.config.baseUrl}${endpoint}`;
    
    if (!params || Object.keys(params).length === 0) {
      return url;
    }

    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (Array.isArray(value)) {
          value.forEach(v => searchParams.append(key, String(v)));
        } else {
          searchParams.append(key, String(value));
        }
      }
    });

    return `${url}?${searchParams.toString()}`;
  }

  // Generic request method
  private async request<T>(
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    endpoint: string,
    data?: any,
    options: RequestOptions = {}
  ): Promise<ApiResponse<T>> {
    if (this.config.useMockApi) {
      // Import mock service dynamically to avoid circular dependencies
      const { mockApiService } = await import('../mockApiService');
      
      // Set auth on mock service
      mockApiService.setAuth(this.authToken, this.currentUser);
      
      // Route to appropriate mock method
      return this.routeToMockService(method, endpoint, data, options);
    }

    // Real API implementation would go here
    const url = this.buildUrl(endpoint, method === 'GET' ? options.params : undefined);
    const headers = this.buildHeaders(options.headers);

    try {
      const fetchOptions: RequestInit = {
        method,
        headers,
        signal: AbortSignal.timeout(options.timeout || this.config.timeout)
      };

      if (data && method !== 'GET') {
        fetchOptions.body = JSON.stringify(data);
      }

      const response = await fetch(url, fetchOptions);

      // Attempt to parse JSON body regardless of status
      let parsed: any = null;
      try {
        parsed = await response.json();
      } catch (_) {
        // ignore JSON parse errors; will fall back to status text
      }

      if (!response.ok) {
        // Prefer backend-provided message if available
        const message = (parsed && (parsed.message || parsed.error))
          ? String(parsed.message || parsed.error)
          : `HTTP ${response.status}: ${response.statusText}`;
        return {
          data: null,
          success: false,
          message,
        } as ApiResponse<T>;
      }

      const result = parsed;
      // Normalize to ApiResponse shape if backend returns raw data
      if (result && typeof result === 'object' && 'data' in result && 'success' in result) {
        return result as ApiResponse<T>;
      }
      return {
        data: result as T,
        success: true,
        message: 'ok'
      } as ApiResponse<T>;
    } catch (error) {
      console.error(`API Error [${method} ${endpoint}]:`, error);
      return {
        data: null,
        success: false,
        message: error instanceof Error ? error.message : 'Unknown API error'
      };
    }
  }

  // Route requests to mock service
  private async routeToMockService<T>(
    method: string,
    endpoint: string,
    data?: any,
    options: RequestOptions = {}
  ): Promise<ApiResponse<T>> {
    const { mockApiService } = await import('../mockApiService');

    try {
      switch (`${method} ${endpoint}`) {
        // Authentication endpoints
        case 'POST /auth/login':
          return (await mockApiService.login(data.email, data.password)) as unknown as ApiResponse<T>;
        case 'POST /auth/register':
          return (await mockApiService.register(data.email, data.password, data.username)) as unknown as ApiResponse<T>;
        case 'POST /auth/logout':
          return (await mockApiService.logout()) as unknown as ApiResponse<T>;

        // User endpoints
        case 'GET /user/profile':
          return (await mockApiService.getUserProfile()) as unknown as ApiResponse<T>;
        case 'PUT /user/profile':
          return (await mockApiService.updateUserProfile(data)) as unknown as ApiResponse<T>;
        case 'GET /user/stats':
          return (await mockApiService.getUserStats()) as unknown as ApiResponse<T>;
        case 'GET /user/analytics':
          return (await mockApiService.getUserAnalytics()) as unknown as ApiResponse<T>;

        // Project endpoints
        case 'GET /projects':
        case 'GET /projects/available':
          return (await mockApiService.getAvailableProjects()) as unknown as ApiResponse<T>;
        case 'GET /projects/enrolled':
          return (await mockApiService.getEnrolledProjects()) as unknown as ApiResponse<T>;
        case 'POST /projects/enroll':
          return (await mockApiService.enrollInProject(data.projectId)) as unknown as ApiResponse<T>;

        // Gamification endpoints
        case 'GET /gamification/leaderboard':
          return (await mockApiService.getLeaderboard(options.params?.timeframe)) as unknown as ApiResponse<T>;
        case 'GET /gamification/badges':
          return (await mockApiService.getBadges()) as unknown as ApiResponse<T>;

        // Notification endpoints
        case 'GET /notifications':
          return (await mockApiService.getNotifications()) as unknown as ApiResponse<T>;
        case 'POST /notifications/mark-read':
          return (await mockApiService.markNotificationAsRead(data.notificationId)) as unknown as ApiResponse<T>;

        // Search endpoints
        case 'GET /search/projects':
          return (await mockApiService.searchProjects(options.params?.q, options.params)) as unknown as ApiResponse<T>;

        // Code execution
        case 'POST /code/execute':
          return this.executeCodeMock(data.code, data.language, data.input);
        // IDE bootstrap support
        case 'GET /code/languages':
          return {
            data: [
              { language: 'javascript', version: '18.x', extensions: ['js'], template: "console.log('Hello, World!')\n", examples: {} },
              { language: 'python', version: '3.11', extensions: ['py'], template: "print('Hello, World!')\n", examples: {} },
              { language: 'java', version: '17', extensions: ['java'], template: 'public class Main {\n  public static void main(String[] args) {\n    System.out.println("Hello, World!");\n  }\n}\n', examples: {} },
              { language: 'cpp', version: 'C++17', extensions: ['cpp'], template: '#include <iostream>\nint main(){ std::cout << "Hello, World!"; }\n', examples: {} },
            ] as any,
            success: true,
            message: 'ok'
          } as ApiResponse<T>;

        default:
          // Handle dynamic latest route patterns for mock
          if (method === 'GET' && endpoint.startsWith('/code/latest/')) {
            const parts = endpoint.split('/');
            const projectId = parts[3] || 'demo-project';
            const milestoneId = parts[4] || 'default';
            return {
              data: {
                code: `// Project: ${projectId}\n// Milestone: ${milestoneId}\nconsole.log('Hello, World!');\n`,
                language: 'javascript',
                lastModified: new Date().toISOString()
              } as any,
              success: true,
              message: 'ok'
            } as ApiResponse<T>;
          }
          console.warn(`Mock API: Unhandled ${method} ${endpoint}`);
          return {
            data: null,
            success: false,
            message: `Endpoint ${method} ${endpoint} not implemented in mock API`
          } as ApiResponse<T>;
      }
    } catch (error) {
      console.error(`Mock API Error [${method} ${endpoint}]:`, error);
      return {
        data: null,
        success: false,
        message: error instanceof Error ? error.message : 'Mock API error'
      } as ApiResponse<T>;
    }
  }

  // Mock code execution
  private async executeCodeMock(code: string, language: string, input?: string): Promise<ApiResponse<any>> {
    // Simulate execution delay
    await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 800));

    const presets = {
      javascript: {
        output: 'Hello from JavaScript!\nYour code executed successfully.',
        executionTime: Math.random() * 100 + 50
      },
      python: {
        output: 'Hello from Python!\nCode execution completed.',
        executionTime: Math.random() * 150 + 75
      },
      java: {
        output: 'Hello from Java!\nCompilation and execution successful.',
        executionTime: Math.random() * 200 + 100
      }
    } as const;

    const selected = presets[language as keyof typeof presets] || {
      output: `Code executed in ${language}`,
      executionTime: Math.random() * 120 + 60
    };

    const isError = false; // Always success for stable UX
    const executionResult = {
      id: `${Date.now()}`,
      success: !isError,
      output: isError ? '' : selected.output,
      executionTime: Math.round(selected.executionTime),
      memoryUsage: Math.floor(Math.random() * 1024 * 5) + 256,
      status: isError ? 'error' as const : 'completed' as const,
      errorMessage: isError ? `Error: Simulated ${language} compilation error on line 1` : undefined,
    };

    return {
      data: executionResult,
      success: !isError,
      message: isError ? 'Code execution failed' : 'Code executed successfully'
    };
  }

  // Public HTTP methods
  async get<T>(endpoint: string, options: RequestOptions = {}): Promise<ApiResponse<T>> {
    return this.request<T>('GET', endpoint, undefined, options);
  }

  async post<T>(endpoint: string, data?: any, options: RequestOptions = {}): Promise<ApiResponse<T>> {
    return this.request<T>('POST', endpoint, data, options);
  }

  async put<T>(endpoint: string, data?: any, options: RequestOptions = {}): Promise<ApiResponse<T>> {
    return this.request<T>('PUT', endpoint, data, options);
  }

  async delete<T>(endpoint: string, options: RequestOptions = {}): Promise<ApiResponse<T>> {
    return this.request<T>('DELETE', endpoint, undefined, options);
  }

  // Health check
  async healthCheck(): Promise<ApiResponse<any>> {
    if (this.config.useMockApi) {
      return {
        data: { status: 'ok', timestamp: new Date().toISOString() },
        success: true,
        message: 'Mock API is healthy'
      };
    }
    
    return this.get('/health');
  }

  // Configuration getters
  getConfig(): ApiConfig {
    return { ...this.config };
  }

  isUsingMockApi(): boolean {
    return this.config.useMockApi;
  }

  // Runtime configuration setters
  setUseMockApi(useMockApi: boolean): void {
    this.config = { ...this.config, useMockApi };
    try {
      localStorage.setItem(API_MODE_STORAGE_KEY, String(useMockApi));
    } catch (_) {}
    if (process.env.NODE_ENV === 'development') {
      console.log(`API Client: Switched to ${useMockApi ? 'Mock' : 'Real'} API mode`);
    }
  }
}

// Create singleton instance
export const apiClient = new ApiClient();

// Export for use throughout the application
export default apiClient;