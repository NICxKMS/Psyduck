import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Badge } from './ui/badge';
import { ScrollArea } from './ui/scroll-area';
import { FileText, Terminal, Plus, Trash2, Copy, Folder, FileCode, PlayCircle, Bug, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { codeService, type CodeSubmission, type ExecutionResult, type SupportedLanguage } from '../services/codeService';
import { apiClient } from '../services/api/ApiClient';
import { config } from '../config/environment';
import { IDEHeader } from './ide/IDEHeader';
import CodeEditor from './ide/CodeEditor';
import { getDefaultCode, downloadCode } from './ide/helpers';
import { Button } from './ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';

interface IDEProps {
  projectId?: string;
  milestoneId?: string;
  initialLanguage?: string;
  initialCode?: string;
}

export function IDE({ 
  projectId = 'demo-project', 
  milestoneId = 'demo-milestone',
  initialLanguage = 'javascript',
  initialCode = ''
}: IDEProps) {
  const [editorReady, setEditorReady] = useState(false);
  const [currentLanguage, setCurrentLanguage] = useState(initialLanguage);
  const [code, setCode] = useState(initialCode);
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionResult, setExecutionResult] = useState<ExecutionResult | null>(null);
  const [activeTab, setActiveTab] = useState('editor');
  const [minimapEnabled, setMinimapEnabled] = useState(true);
  const [wordWrapEnabled, setWordWrapEnabled] = useState(true);
  const [editorTheme, setEditorTheme] = useState<'light' | 'dark' | 'system'>(() => {
    try { return (localStorage.getItem('psyduck-ide-theme') as any) || 'system'; } catch { return 'system'; }
  });
  const [fontSize, setFontSize] = useState<number>(() => {
    try { return Number(localStorage.getItem('psyduck-ide-fontSize') || 14); } catch { return 14; }
  });
  const [tabSize, setTabSize] = useState<number>(() => {
    try { return Number(localStorage.getItem('psyduck-ide-tabSize') || 2); } catch { return 2; }
  });
  const [status, setStatus] = useState({ line: 1, column: 1, length: 0, selectionLength: 0 });
  const [markers, setMarkers] = useState<Array<{ message: string; severity: number; startLineNumber: number; startColumn: number }>>([]);
  const [inputText, setInputText] = useState<string>('');
  const [sidebarWidth, setSidebarWidth] = useState<number>(() => {
    try { return Number(localStorage.getItem('psyduck-ide-sidebarWidth') || 240); } catch { return 240; }
  });
  const [isResizing, setIsResizing] = useState<boolean>(false);

  // Workspace and files state
  const ROOT_FOLDER = 'workspace';
  const normalizePath = (p: string) => {
    const cleaned = (p || '').replace(/\\/g, '/').replace(/^\/+/, '');
    const safe = cleaned.replace(/\.\./g, '');
    return `${ROOT_FOLDER}/${safe}`.replace(/\/+/, '/');
  };
  const basename = (p: string) => (p || '').split('/').filter(Boolean).slice(-1)[0] || '';
  const parentDir = (p: string) => (p || '').split('/').filter(Boolean).slice(0, -1).join('/') || ROOT_FOLDER;

  type EditorFile = { id: string; path: string; language: string; value: string };
  const [files, setFiles] = useState<EditorFile[]>([
    { id: 'main', path: `${ROOT_FOLDER}/main.js`, language: 'javascript', value: initialCode || getDefaultCode('javascript') }
  ]);
  const [activeFileId, setActiveFileId] = useState<string>('main');
  const [folders, setFolders] = useState<string[]>([ROOT_FOLDER]);
  const [newFileFolder, setNewFileFolder] = useState<string>(ROOT_FOLDER);
  const [entryPath, setEntryPath] = useState<string>(`${ROOT_FOLDER}/main.js`);
  const queryClient = useQueryClient();

  // Load supported languages with better error handling
  const { 
    data: supportedLanguagesData, 
    isLoading: isLoadingLanguages,
    error: languagesError 
  } = useQuery({
    queryKey: ['supported-languages'],
    queryFn: async () => {
      try {
        const languages = await codeService.getSupportedLanguages();
        console.log('✅ Loaded supported languages:', languages);
        return Array.isArray(languages) ? languages : [];
      } catch (error) {
        console.error('❌ Failed to load supported languages:', error);
        // Return default languages on error
        return [
          { language: 'javascript', version: '18.x', extensions: ['js'], template: '', examples: {} },
          { language: 'python', version: '3.11', extensions: ['py'], template: '', examples: {} },
          { language: 'java', version: '17', extensions: ['java'], template: '', examples: {} },
          { language: 'cpp', version: 'C++17', extensions: ['cpp'], template: '', examples: {} },
        ] as SupportedLanguage[];
      }
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
    retry: 2,
  });

  // Load latest code for this project/milestone
  const { data: latestCode, isLoading: isLoadingCode } = useQuery({
    queryKey: ['latest-code', projectId, milestoneId],
    queryFn: async () => {
      try {
        return await codeService.getLatestCode(projectId, milestoneId);
      } catch (error) {
        console.error('❌ Failed to load latest code:', error);
        return null;
      }
    },
    enabled: !!projectId && !!milestoneId,
    retry: 1,
  });

  // Log error if languages failed to load
  useEffect(() => {
    if (languagesError) {
      console.error('🚨 Supported languages query failed:', languagesError);
      toast.error('Failed to load supported languages. Using defaults.');
    }
  }, [languagesError]);

  // Prefer real backend for code execution during IDE session
  useEffect(() => {
    try {
      const prev = apiClient.isUsingMockApi();
      if (prev) apiClient.setUseMockApi(false);
      return () => { try { apiClient.setUseMockApi(prev); } catch {} };
    } catch {}
  }, []);

  // Update code when latest code arrives (no direct editor access)
  useEffect(() => {
    if (latestCode && !isLoadingCode) {
      const updated: EditorFile = { id: files[0].id, path: `${ROOT_FOLDER}/main.${files[0].language === 'typescript' ? 'ts' : 'js'}`, value: latestCode.code, language: latestCode.language };
      setFiles([updated, ...files.slice(1)]);
      setCurrentLanguage(updated.language);
      setCode(updated.value);
      setEntryPath(updated.path);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [latestCode, isLoadingCode]);

  // Save code mutation
  const saveCodeMutation = useMutation({
    mutationFn: (payload: { code: string; language: string }) =>
      codeService.saveCode(projectId, milestoneId, payload.language, payload.code),
    onSuccess: () => {
      toast.success('Code saved successfully!');
      queryClient.invalidateQueries({ queryKey: ['latest-code', projectId, milestoneId] });
    },
    onError: (error) => {
      toast.error('Failed to save code');
      console.error('❌ Save error:', error);
    },
  });

  // Execute code mutation
  const executeCodeMutation = useMutation({
    mutationFn: async (submission: CodeSubmission) => {
      setIsExecuting(true);
      try {
        const result = await codeService.executeCode(submission);
        setExecutionResult(result);
        return result;
      } catch (error) {
        setIsExecuting(false);
        throw error;
      }
    },
    onSuccess: (result) => {
      setIsExecuting(false);
      setActiveTab('output');
      toast.success('Code executed successfully!');
    },
    onError: (error) => {
      setIsExecuting(false);
      toast.error('Code execution failed');
      console.error('❌ Execution error:', error);
    },
  });

  // Validate code mutation
  const validateCodeMutation = useMutation({
    mutationFn: async () => {
      return codeService.validateCode(currentLanguage, code);
    },
    onSuccess: (result) => {
      const nextMarkers = (result.errors || []).map(err => ({
        message: err.message,
        severity: err.severity === 'error' ? 8 : 4,
        startLineNumber: err.line,
        startColumn: err.column,
      }));
      setMarkers(nextMarkers);
      setActiveTab('problems');
      if (nextMarkers.length === 0) toast.success('No problems found');
      else toast.message(`Found ${nextMarkers.length} problem(s)`);
    },
    onError: (error) => {
      toast.error('Validation failed');
      console.error('❌ Validation error:', error);
    }
  });

  // Event handlers
  const handleSave = useCallback(() => {
    const effectiveCode = code;
    if (!effectiveCode?.trim()) {
      toast.error('Cannot save empty code');
      return;
    }
    saveCodeMutation.mutate({ code: effectiveCode, language: currentLanguage });
  }, [code, currentLanguage, saveCodeMutation]);

  const handleRun = useCallback(() => {
    const effectiveCode = code;
    if (!effectiveCode?.trim()) {
      toast.error('Cannot execute empty code');
      return;
    }

    const submission: CodeSubmission = {
      projectId,
      milestoneId,
      language: currentLanguage,
      code: effectiveCode,
      input: inputText,
    };

    // If JavaScript, include the whole workspace under the same root
    if (/^js|javascript$/i.test(currentLanguage)) {
      const safeFiles = files.map(f => ({ path: normalizePath(f.path), content: f.value }));
      const safeEntry = normalizePath(entryPath);
      submission.workspace = { files: safeFiles, entryPath: safeEntry };
    }

    executeCodeMutation.mutate(submission);
  }, [code, currentLanguage, projectId, milestoneId, executeCodeMutation, inputText, files, entryPath]);

  const handleValidate = useCallback(() => {
    if (!code?.trim()) {
      toast.error('Cannot validate empty code');
      return;
    }
    validateCodeMutation.mutate();
  }, [code, validateCodeMutation]);

  // Add keyboard shortcuts for IDE actions
  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Ctrl+S or Cmd+S to save
      if ((event.ctrlKey || event.metaKey) && event.key === 's') {
        event.preventDefault();
        handleSave();
      }
      // Ctrl+Enter or Cmd+Enter to run
      else if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
        event.preventDefault();
        handleRun();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleSave, handleRun]);

  const handleLanguageChange = useCallback((language: string) => {
    console.log('🔄 Language change requested:', language);
    if (!language || language === currentLanguage) {
      console.log('🔄 Language unchanged or invalid:', language);
      return;
    }
    setCurrentLanguage(language);
    // Populate default template when current code is empty or still the previous default
    if (editorReady && (!code?.trim() || code === getDefaultCode(currentLanguage))) {
      const defaultCode = getDefaultCode(language);
      setCode(defaultCode);
      console.log('✅ Default code set for language:', language);
    }
  }, [editorReady, code, currentLanguage]);

  const handleDownload = useCallback(() => {
    if (code?.trim()) {
      downloadCode(code, currentLanguage);
    } else {
      toast.error('No code to download');
    }
  }, [code, currentLanguage]);

  // Persist preferences
  useEffect(() => { try { localStorage.setItem('psyduck-ide-theme', editorTheme); } catch {} }, [editorTheme]);
  useEffect(() => { try { localStorage.setItem('psyduck-ide-fontSize', String(fontSize)); } catch {} }, [fontSize]);
  useEffect(() => { try { localStorage.setItem('psyduck-ide-tabSize', String(tabSize)); } catch {} }, [tabSize]);
  useEffect(() => { try { localStorage.setItem('psyduck-ide-sidebarWidth', String(sidebarWidth)); } catch {} }, [sidebarWidth]);

  // File operations
  const activeFile = files.find(f => f.id === activeFileId) || files[0];
  useEffect(() => {
    if (!activeFile) return;
    setCurrentLanguage(activeFile.language);
    setCode(activeFile.value);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeFileId]);

  const addFile = () => {
    const count = files.length + 1;
    const ext = currentLanguage === 'typescript' ? 'ts' : 'js';
    const folder = newFileFolder || ROOT_FOLDER;
    const path = normalizePath(`${folder}/file${count}.${ext}`);
    const file: EditorFile = { id: `${Date.now()}`, path, language: currentLanguage, value: getDefaultCode(currentLanguage) };
    setFiles(prev => [...prev, file]);
    setActiveFileId(file.id);
  };

  const addFolder = () => {
    // Create a simple folder under root with incremental name
    const count = folders.filter(f => f.startsWith(`${ROOT_FOLDER}/folder`)).length + 1;
    const folder = normalizePath(`${ROOT_FOLDER}/folder${count}`);
    if (!folders.includes(folder)) setFolders(prev => [...prev, folder]);
    setNewFileFolder(folder);
  };

  const removeFile = (id: string) => {
    if (files.length === 1) return;
    const idx = files.findIndex(f => f.id === id);
    const next = files.filter(f => f.id !== id);
    setFiles(next);
    if (activeFileId === id) {
      const newIdx = Math.max(0, idx - 1);
      setActiveFileId(next[newIdx].id);
    }
  };

  const updateActiveFileValue = (nextCode: string) => {
    setCode(nextCode);
    setFiles(prev => prev.map(f => f.id === activeFileId ? { ...f, value: nextCode } : f));
  };

  // Sidebar resizing handlers
  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!isResizing) return;
      const next = Math.min(480, Math.max(160, e.clientX));
      setSidebarWidth(next);
    };
    const onUp = () => setIsResizing(false);
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, [isResizing]);

  // Ensure supportedLanguages is always an array and handle all possible states
  const supportedLanguages: SupportedLanguage[] = React.useMemo(() => {
    if (Array.isArray(supportedLanguagesData) && supportedLanguagesData.length > 0) {
      return supportedLanguagesData;
    }
    // Return default languages if API data is not available
    return [
      { language: 'javascript', version: '18.x', extensions: ['js'], template: '', examples: {} },
      { language: 'python', version: '3.11', extensions: ['py'], template: '', examples: {} },
      { language: 'java', version: '17', extensions: ['java'], template: '', examples: {} },
      { language: 'cpp', version: 'C++17', extensions: ['cpp'], template: '', examples: {} },
    ];
  }, [supportedLanguagesData]);

  const filesUnderRoot = files.map(f => ({ ...f, path: normalizePath(f.path) }));

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header */}
      <IDEHeader
        currentLanguage={currentLanguage}
        supportedLanguages={supportedLanguages}
        isExecuting={isExecuting}
        isSaving={saveCodeMutation.isPending}
        onLanguageChange={handleLanguageChange}
        onSave={handleSave}
        onDownload={handleDownload}
        onRun={handleRun}
        onValidate={handleValidate}
        isValidating={validateCodeMutation.isPending}
        projectId={projectId}
        milestoneId={milestoneId}
        minimapEnabled={minimapEnabled}
        wordWrapEnabled={wordWrapEnabled}
        onToggleMinimap={setMinimapEnabled}
        onToggleWordWrap={setWordWrapEnabled}
        theme={editorTheme}
        onThemeChange={setEditorTheme}
        fontSize={fontSize}
        onFontSizeChange={setFontSize}
        tabSize={tabSize}
        onTabSizeChange={setTabSize}
      />

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* File Explorer */}
        <div className="border-r bg-card/40 flex flex-col" style={{ width: sidebarWidth }}>
          <div className="flex items-center justify-between p-2 border-b">
            <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1"><Folder className="h-3.5 w-3.5" /> Explorer</span>
            <div className="flex items-center gap-2">
              <Select value={newFileFolder} onValueChange={setNewFileFolder}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Folder" />
                </SelectTrigger>
                <SelectContent>
                  {folders.map(f => (
                    <SelectItem key={f} value={f}>{f}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <button className="text-xs underline" onClick={addFolder} title="New folder">
                <Plus className="h-4 w-4" aria-hidden="true" />
                <span className="sr-only">New folder</span>
              </button>
              <button className="text-xs underline" onClick={addFile} title="New file">
                <Plus className="h-4 w-4" aria-hidden="true" />
                <span className="sr-only">New file</span>
              </button>
            </div>
          </div>
          <ScrollArea className="flex-1">
            <ul className="p-2 space-y-1">
              {filesUnderRoot.map(f => (
                <li key={f.id} className={`flex items-center justify-between px-2 py-1 rounded cursor-pointer ${activeFileId === f.id ? 'bg-accent' : 'hover:bg-muted'}`} onClick={() => setActiveFileId(f.id)}>
                  <div className="min-w-0">
                    <div className="text-sm truncate flex items-center gap-1"><FileCode className="h-3.5 w-3.5" /> {basename(f.path)}</div>
                    <div className="text-[10px] text-muted-foreground truncate">{parentDir(f.path)}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    {normalizePath(entryPath) === normalizePath(f.path) && (
                      <Badge className="text-[10px] flex items-center gap-1" variant="secondary"><PlayCircle className="h-3 w-3" /> Entry</Badge>
                    )}
                    {files.length > 1 && (
                      <button className="opacity-60 hover:opacity-100" onClick={(e) => { e.stopPropagation(); setEntryPath(f.path); toast.message(`Entry set to ${basename(f.path)}`); }} title="Set as entry">
                        <span className="text-[10px] underline">Set Entry</span>
                      </button>
                    )}
                    {files.length > 1 && (
                      <button className="opacity-60 hover:opacity-100" onClick={(e) => { e.stopPropagation(); removeFile(f.id); }} title="Delete file">
                        <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                        <span className="sr-only">Delete file</span>
                      </button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </ScrollArea>
          <div
            className="w-1 cursor-col-resize border-l border-border hover:bg-muted/50"
            onMouseDown={() => setIsResizing(true)}
            title="Drag to resize"
          />
        </div>

        {/* Editor Panel */}
        <div className="flex-1 flex flex-col">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
            <TabsList className="w-fit m-4 mb-0">
              <TabsTrigger value="editor" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Editor
                {!editorReady && (
                  <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse ml-1" title="Initializing..."></div>
                )}
                {editorReady && (
                  <div className="w-2 h-2 bg-green-500 rounded-full ml-1" title="Ready"></div>
                )}
              </TabsTrigger>
              <TabsTrigger value="output" className="flex items-center gap-2">
                <Terminal className="h-4 w-4" />
                Output
                {executionResult && (
                  <Badge variant={executionResult.success ? "default" : "destructive"} className="ml-1">
                    {executionResult.success ? 'Success' : 'Error'}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="problems" className="flex items-center gap-2">
                <Bug className="h-4 w-4" /> Problems
                {markers.length > 0 && (
                  <Badge variant="destructive" className="ml-1">{markers.length}</Badge>
                )}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="editor" className="flex-1 m-4 mt-2" forceMount>
              <Card className="h-full">
                <CardContent className="p-0 h-full">
                  <CodeEditor
                    value={code}
                    language={currentLanguage}
                    className="h-full w-full"
                    onChange={updateActiveFileValue}
                    onReady={() => setEditorReady(true)}
                    showMinimap={minimapEnabled}
                    wordWrap={wordWrapEnabled ? 'on' : 'off'}
                    fontSize={fontSize}
                    tabSize={tabSize}
                    theme={editorTheme}
                    storageKey={`psyduck-ide-${activeFile?.path}`}
                    autoSave
                    onStatusChange={setStatus}
                  />
                </CardContent>
              </Card>
              <div className="h-7 text-xs text-muted-foreground px-3 flex items-center justify-between border-t bg-card/60">
                <span>{basename(activeFile?.path || '')} • {currentLanguage}</span>
                <span>Ln {status.line}, Col {status.column} • {status.length} chars {status.selectionLength ? `• Sel ${status.selectionLength}` : ''}</span>
              </div>
            </TabsContent>

            <TabsContent value="output" className="flex-1 m-4 mt-2" forceMount>
              <Card className="h-full">
                <CardContent className="p-4 h-full flex flex-col gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">Program input (stdin)</span>
                  </div>
                  <textarea
                    className="w-full h-20 rounded border bg-background p-2 text-sm font-mono"
                    placeholder="Enter input to pass to your program..."
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                  />
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => {
                      try { navigator.clipboard.writeText(executionResult ? (executionResult.success ? (executionResult.output || '') : (executionResult.errorMessage || '')) : ''); toast.success('Output copied'); } catch {}
                    }} title="Copy output">
                      <Copy className="h-4 w-4 mr-2" /> Copy Output
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => setExecutionResult(null)} title="Clear output">
                      <Trash2 className="h-4 w-4 mr-2" /> Clear
                    </Button>
                  </div>
                  <div className="flex-1 min-h-0">
                    <ScrollArea className="h-full">
                      <pre className="text-sm whitespace-pre-wrap">{executionResult ? (executionResult.success ? (executionResult.output || '') : (executionResult.errorMessage || '')) : 'No output yet.'}</pre>
                    </ScrollArea>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="problems" className="flex-1 m-4 mt-2" forceMount>
              <Card className="h-full">
                <CardContent className="p-0 h-full">
                  <ScrollArea className="h-full">
                    {markers.length === 0 ? (
                      <div className="p-4 text-sm text-muted-foreground">No problems detected.</div>
                    ) : (
                      <table className="w-full text-sm">
                        <thead className="text-left sticky top-0 bg-card border-b">
                          <tr>
                            <th className="py-2 px-3">Severity</th>
                            <th className="py-2 px-3">Message</th>
                            <th className="py-2 px-3">Line</th>
                          </tr>
                        </thead>
                        <tbody>
                          {markers.map((m, idx) => (
                            <tr key={idx} className="border-b hover:bg-muted/40">
                              <td className="py-2 px-3">
                                <span className="inline-flex items-center gap-1">
                                  {m.severity === 8 ? <AlertTriangle className="h-3.5 w-3.5 text-red-500" /> : <AlertTriangle className="h-3.5 w-3.5 text-yellow-500" />}
                                  {m.severity === 8 ? 'Error' : 'Warn'}
                                </span>
                              </td>
                              <td className="py-2 px-3">{m.message}</td>
                              <td className="py-2 px-3">{m.startLineNumber}:{m.startColumn}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </ScrollArea>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}