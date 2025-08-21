import { apiService } from './apiService';

export interface CodeSubmission {
  projectId: string;
  milestoneId?: string;
  language: string;
  code: string;
  input?: string;
  testCases?: TestCase[];
  // Optional workspace for multi-file execution (JavaScript only for now)
  workspace?: {
    files: Array<{ path: string; content: string }>; // All paths must share the same root folder
    entryPath: string; // Path to the entry file within the workspace
  };
}

export interface TestCase {
  input: any;
  expected: any;
  description?: string;
}

export interface ExecutionResult {
  id: string;
  success: boolean;
  output: string;
  executionTime: number;
  memoryUsage: number;
  status: 'completed' | 'error' | 'timeout';
  errorMessage?: string;
  testResults?: TestResult[];
}

export interface TestResult {
  testCase: number;
  passed: boolean;
  input: any;
  expected: any;
  actual: any;
  error?: string;
}

export interface CodeHistory {
  id: string;
  projectId: string;
  milestoneId?: string;
  language: string;
  code: string;
  executionResult?: ExecutionResult;
  createdAt: string;
}

export interface SupportedLanguage {
  language: string;
  version: string;
  extensions: string[];
  template: string;
  examples: Record<string, string>;
}

class CodeService {
  private extractDataOr<T>(resp: any, fallback: T): T {
    try {
      if (resp && typeof resp === 'object') {
        const data = (resp as any).data;
        const success = (resp as any).success;
        if ((success === true || success === undefined) && data !== undefined && data !== null) {
          return data as T;
        }
      }
    } catch {}
    return fallback;
  }

  // Code execution
  async executeCode(submission: CodeSubmission): Promise<ExecutionResult> {
    const resp: any = await apiService.post('/code/execute', submission);

    // Handle standard ApiResponse shape
    if (resp && typeof resp === 'object' && ('success' in resp || 'data' in resp)) {
      const apiSuccess = Boolean((resp as any).success);
      const apiMessage = (resp as any).message as string | undefined;
      const payload = (resp as any).data;

      // Error from server (e.g., unauthorized, validation, execution error)
      if (!apiSuccess) {
        return {
          id: String(Date.now()),
          success: false,
          output: '',
          executionTime: 0,
          memoryUsage: 0,
          status: 'error',
          errorMessage: apiMessage || 'Code execution failed',
        };
      }

      // If payload already conforms to ExecutionResult
      if (payload && typeof payload === 'object' && 'id' in payload && 'output' in payload) {
        const result = payload as ExecutionResult;
        // Ensure required fields with fallbacks
        return {
          id: String(result.id || Date.now()),
          success: Boolean(result.success),
          output: String(result.output ?? ''),
          executionTime: Number(result.executionTime ?? 0),
          memoryUsage: Number(result.memoryUsage ?? 0),
          status: (result.status as any) || (result.success ? 'completed' : 'error'),
          errorMessage: result.errorMessage || undefined,
          testResults: result.testResults,
        };
      }

      // Normalize simple payloads { output, error, executionTime }
      if (payload && typeof payload === 'object') {
        const output = (payload as any).output ? String((payload as any).output) : '';
        const errorMessage = (payload as any).error ? String((payload as any).error) : undefined;
        const executionTime = Math.round(Number((payload as any).executionTime || 0));

        return {
          id: String(Date.now()),
          success: !errorMessage,
          output,
          executionTime,
          memoryUsage: Number((payload as any).memoryUsage || 0),
          status: errorMessage ? 'error' : 'completed',
          errorMessage,
        };
      }
    }

    // Fallback: unknown shape, surface a generic error rather than pretending success
    return {
      id: String(Date.now()),
      success: false,
      output: '',
      executionTime: 0,
      memoryUsage: 0,
      status: 'error',
      errorMessage: 'Unexpected response from server',
    };
  }

  async getExecutionResult(executionId: string): Promise<ExecutionResult> {
    const resp: any = await apiService.get(`/code/executions/${executionId}`);
    const fallback: ExecutionResult = {
      id: String(executionId),
      success: false,
      output: '',
      executionTime: 0,
      memoryUsage: 0,
      status: 'error',
      errorMessage: 'Result not available',
    };
    return this.extractDataOr<ExecutionResult>(resp, fallback);
  }

  // Code saving and history
  async saveCode(
    projectId: string, 
    milestoneId: string, 
    language: string, 
    code: string
  ): Promise<{ message: string }> {
    const resp: any = await apiService.post('/code/save', {
      projectId,
      milestoneId,
      language,
      code
    });
    const message = (resp && typeof resp === 'object' && 'message' in resp && resp.message)
      ? String(resp.message)
      : 'Saved';
    return { message };
  }

  async getCodeHistory(projectId: string): Promise<CodeHistory[]> {
    const resp: any = await apiService.get(`/code/history/${projectId}`);
    return this.extractDataOr<CodeHistory[]>(resp, []);
  }

  async getLatestCode(projectId: string, milestoneId: string): Promise<{
    code: string;
    language: string;
    lastModified: string;
  }> {
    const resp: any = await apiService.get(`/code/latest/${projectId}/${milestoneId}`);
    if (resp && resp.success && resp.data) {
      const d = resp.data as any;
      return {
        code: String(d.code ?? "console.log('Hello, World!');\n"),
        language: String(d.language ?? 'javascript'),
        lastModified: String(d.lastModified ?? new Date().toISOString()),
      };
    }
    // Fallback if backend route is unavailable
    return {
      code: "// Fallback snippet\nconsole.log('Hello, World!');\n",
      language: 'javascript',
      lastModified: new Date().toISOString(),
    };
  }

  // Language support
  async getSupportedLanguages(): Promise<SupportedLanguage[]> {
    const resp: any = await apiService.get('/code/languages');
    if (resp && resp.success && Array.isArray(resp.data)) {
      return resp.data as SupportedLanguage[];
    }
    // Fallback languages
    return [
      { language: 'javascript', version: '18.x', extensions: ['js'], template: "console.log('Hello, World!')\n", examples: {} },
      { language: 'python', version: '3.11', extensions: ['py'], template: "print('Hello, World!')\n", examples: {} },
      { language: 'java', version: '17', extensions: ['java'], template: 'public class Main {\n  public static void main(String[] args) {\n    System.out.println("Hello, World!");\n  }\n}\n', examples: {} },
      { language: 'cpp', version: 'C++17', extensions: ['cpp'], template: '#include <iostream>\nint main(){ std::cout << "Hello, World!"; }\n', examples: {} },
    ];
  }

  async getLanguageTemplate(language: string): Promise<{ template: string }> {
    const resp: any = await apiService.get(`/code/languages/${language}/template`);
    const data = this.extractDataOr<{ template: string }>(resp, { template: '' });
    return { template: String(data.template || '') };
  }

  // Code validation and analysis
  async validateCode(
    language: string, 
    code: string
  ): Promise<{
    isValid: boolean;
    errors: Array<{
      line: number;
      column: number;
      message: string;
      severity: 'error' | 'warning';
    }>;
    suggestions: string[];
  }> {
    const resp: any = await apiService.post('/code/validate', { language, code });
    return this.extractDataOr(resp, { isValid: true, errors: [], suggestions: [] });
  }

  async analyzeCode(
    language: string, 
    code: string
  ): Promise<{
    complexity: number;
    linesOfCode: number;
    qualityScore: number;
    suggestions: string[];
    bestPractices: Array<{
      rule: string;
      message: string;
      severity: 'info' | 'warning' | 'error';
    }>;
  }> {
    const resp: any = await apiService.post('/code/analyze', { language, code });
    return this.extractDataOr(resp, {
      complexity: 0,
      linesOfCode: 0,
      qualityScore: 0,
      suggestions: [],
      bestPractices: []
    });
  }

  // Code sharing and collaboration
  async shareCode(
    projectId: string, 
    milestoneId: string, 
    code: string, 
    language: string
  ): Promise<{ shareUrl: string; shareId: string }> {
    const resp: any = await apiService.post('/code/share', {
      projectId,
      milestoneId,
      code,
      language
    });
    return this.extractDataOr(resp, { shareUrl: '', shareId: '' });
  }

  async getSharedCode(shareId: string): Promise<{
    code: string;
    language: string;
    projectTitle: string;
    milestoneTitle: string;
    sharedBy: string;
    sharedAt: string;
  }> {
    const resp: any = await apiService.get(`/code/shared/${shareId}`);
    return this.extractDataOr(resp, {
      code: '',
      language: 'javascript',
      projectTitle: '',
      milestoneTitle: '',
      sharedBy: '',
      sharedAt: new Date().toISOString(),
    });
  }

  // Code snippets and templates
  async getCodeSnippets(language: string): Promise<Array<{
    id: string;
    title: string;
    description: string;
    code: string;
    tags: string[];
  }>> {
    const resp: any = await apiService.get(`/code/snippets/${language}`);
    return this.extractDataOr(resp, [] as Array<{ id: string; title: string; description: string; code: string; tags: string[] }>);
  }

  async createCodeSnippet(data: {
    title: string;
    description: string;
    language: string;
    code: string;
    tags: string[];
    isPublic: boolean;
  }): Promise<{ id: string; message: string }> {
    const resp: any = await apiService.post('/code/snippets', data);
    const id = String((resp && resp.data && (resp.data as any).id) || Date.now());
    const message = String((resp && resp.message) || 'Created');
    return { id, message };
  }

  // Code submission for milestone completion
  async submitMilestoneCode(
    projectId: string,
    milestoneId: string,
    submission: {
      code: string;
      language: string;
      description?: string;
    }
  ): Promise<{
    success: boolean;
    xpAwarded: number;
    feedback?: string;
    nextMilestone?: string;
  }> {
    const resp: any = await apiService.post(`/projects/${projectId}/milestones/${milestoneId}/submit`, submission);
    return this.extractDataOr(resp, { success: true, xpAwarded: 0 });
  }

  // AI-powered code assistance
  async getCodeSuggestions(
    language: string, 
    code: string, 
    cursor: { line: number; column: number }
  ): Promise<{
    suggestions: Array<{
      text: string;
      description: string;
      insertText: string;
    }>;
  }> {
    const resp: any = await apiService.post('/code/suggestions', { language, code, cursor });
    return this.extractDataOr(resp, { suggestions: [] });
  }

  async explainCode(
    language: string, 
    code: string
  ): Promise<{
    explanation: string;
    keyFeatures: string[];
    improvements: string[];
  }> {
    const resp: any = await apiService.post('/code/explain', { language, code });
    return this.extractDataOr(resp, { explanation: '', keyFeatures: [], improvements: [] });
  }
}

export const codeService = new CodeService();