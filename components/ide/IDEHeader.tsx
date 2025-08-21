import React from 'react';
import { Button } from '../ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Switch } from '../ui/switch';
import { Code, Save, Download, Play, ArrowLeft, Palette, Type, Brackets } from 'lucide-react';
import { useRouterContext } from '../../contexts/RouterContext';
import { type SupportedLanguage } from '../../services/codeService';

interface IDEHeaderProps {
  currentLanguage: string;
  supportedLanguages: SupportedLanguage[];
  isExecuting: boolean;
  isSaving: boolean;
  onLanguageChange: (language: string) => void;
  onSave: () => void;
  onDownload: () => void;
  onRun: () => void;
  onValidate?: () => void;
  isValidating?: boolean;
  projectId?: string;
  milestoneId?: string;
  // Feature controls
  onToggleMinimap?: (value: boolean) => void;
  onToggleWordWrap?: (value: boolean) => void;
  minimapEnabled?: boolean;
  wordWrapEnabled?: boolean;
  // Appearance controls
  theme?: 'light' | 'dark' | 'system';
  onThemeChange?: (next: 'light' | 'dark' | 'system') => void;
  fontSize?: number;
  onFontSizeChange?: (size: number) => void;
  tabSize?: number;
  onTabSizeChange?: (size: number) => void;
}

export function IDEHeader({
  currentLanguage,
  supportedLanguages = [], // Ensure default value
  isExecuting,
  isSaving,
  onLanguageChange,
  onSave,
  onDownload,
  onRun,
  onValidate,
  isValidating,
  projectId,
  milestoneId,
  onToggleMinimap,
  onToggleWordWrap,
  minimapEnabled = true,
  wordWrapEnabled = true,
  theme = 'system',
  onThemeChange,
  fontSize = 14,
  onFontSizeChange,
  tabSize = 2,
  onTabSizeChange
}: IDEHeaderProps) {
  const { navigate } = useRouterContext();
  
  // Ensure supportedLanguages is always an array
  const languages = Array.isArray(supportedLanguages) ? supportedLanguages : [];
  
  // Default languages if none are loaded
  const defaultLanguages: SupportedLanguage[] = [
    { language: 'javascript', version: '18.x', extensions: ['js'], template: '', examples: {} },
    { language: 'python', version: '3.11', extensions: ['py'], template: '', examples: {} },
    { language: 'java', version: '17', extensions: ['java'], template: '', examples: {} },
    { language: 'cpp', version: 'C++17', extensions: ['cpp'], template: '', examples: {} },
  ];

  const languagesToShow = languages.length > 0 ? languages : defaultLanguages;

  // Handle back navigation
  const handleBack = React.useCallback(() => {
    // Try to navigate to the specific project page if we have projectId
    if (projectId && projectId !== 'demo-project') {
      navigate(`/projects/${projectId}`);
    } else {
      // Fallback to projects catalog
      navigate('/projects');
    }
    console.log('🔙 Navigating back from IDE');
  }, [navigate, projectId]);

  // Handle keyboard shortcuts
  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Escape key to go back (common UX pattern)
      if (event.key === 'Escape') {
        event.preventDefault();
        handleBack();
      }
      // Ctrl+Backspace or Cmd+Backspace to go back
      else if ((event.ctrlKey || event.metaKey) && event.key === 'Backspace') {
        event.preventDefault();
        handleBack();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleBack]);

  // Get project name for display (could be enhanced with actual project data)
  const getProjectDisplayName = () => {
    if (projectId && projectId !== 'demo-project') {
      return `Project ${projectId}`;
    }
    return 'Demo Project';
  };

  return (
    <div className="border-b p-4 shadow-sm bg-gradient-to-r from-card to-card/80 dark:from-card/90 dark:to-card/70">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {/* Back Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBack}
            className="hover:bg-muted transition-colors"
            title="Back to project (Esc)"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          
          {/* IDE Title and Project Info */}
          <div className="flex items-center gap-3">
            <div className="h-6 w-px bg-border" /> {/* Separator */}
            <div className="flex items-center gap-2">
              <Code className="h-5 w-5 text-psyduck-primary" />
              <div className="flex flex-col">
                <h2 className="font-semibold text-sm">Psyduck IDE</h2>
                <span className="text-xs text-muted-foreground">
                  {getProjectDisplayName()}
                  {milestoneId && milestoneId !== 'demo-milestone' && ` • Milestone ${milestoneId}`}
                </span>
              </div>
            </div>
          </div>
          
          {/* Language Selector */}
          <div className="flex items-center gap-2">
            <div className="h-6 w-px bg-border" /> {/* Separator */}
            <Select value={currentLanguage} onValueChange={onLanguageChange}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Select language" />
              </SelectTrigger>
              <SelectContent>
                {languagesToShow.map((lang) => (
                  <SelectItem key={lang.language} value={lang.language}>
                    <span className="capitalize">{lang.language}</span>
                    <span className="text-xs text-muted-foreground ml-1">
                      {lang.version}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Feature Toggles */}
        <div className="flex items-center gap-4 mr-4">
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Minimap</span>
            <Switch checked={minimapEnabled} onCheckedChange={onToggleMinimap} />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Wrap</span>
            <Switch checked={wordWrapEnabled} onCheckedChange={onToggleWordWrap} />
          </div>
          <div className="hidden md:flex items-center gap-2">
            <Palette className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Theme</span>
            <Select value={theme} onValueChange={(v) => onThemeChange?.(v as any)}>
              <SelectTrigger className="w-28">
                <SelectValue placeholder="Theme" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="system">System</SelectItem>
                <SelectItem value="light">Light</SelectItem>
                <SelectItem value="dark">Dark</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="hidden lg:flex items-center gap-2">
            <Type className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Font</span>
            <Select value={String(fontSize)} onValueChange={(v) => onFontSizeChange?.(Number(v))}>
              <SelectTrigger className="w-20"><SelectValue /></SelectTrigger>
              <SelectContent>
                {[12, 13, 14, 15, 16, 18].map(s => (
                  <SelectItem key={s} value={String(s)}>{s}px</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="hidden lg:flex items-center gap-2">
            <Brackets className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Tab</span>
            <Select value={String(tabSize)} onValueChange={(v) => onTabSizeChange?.(Number(v))}>
              <SelectTrigger className="w-16"><SelectValue /></SelectTrigger>
              <SelectContent>
                {[2, 4, 8].map(s => (
                  <SelectItem key={s} value={String(s)}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onSave}
            disabled={isSaving}
            title="Save code (Ctrl+S)"
          >
            <Save className="h-4 w-4 mr-2" />
            {isSaving ? 'Saving...' : 'Save'}
          </Button>
          
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onDownload}
            title="Download code"
          >
            <Download className="h-4 w-4 mr-2" />
            Download
          </Button>
          
          <Button 
            size="sm" 
            onClick={onRun}
            disabled={isExecuting}
            className="bg-psyduck-success hover:bg-psyduck-success/90 text-white"
            title="Run code (Ctrl+Enter)"
          >
            <Play className="h-4 w-4 mr-2" />
            {isExecuting ? 'Running...' : 'Run Code'}
          </Button>

          {onValidate && (
            <Button
              variant="secondary"
              size="sm"
              onClick={onValidate}
              disabled={isValidating}
              title="Validate code"
            >
              {isValidating ? 'Validating...' : 'Validate'}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}