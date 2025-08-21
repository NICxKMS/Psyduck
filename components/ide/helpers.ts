import { LANGUAGE_TEMPLATES, FILE_EXTENSIONS } from './constants';

export const getDefaultCode = (language: string): string => {
  if (!language || typeof language !== 'string') {
    console.warn('⚠️ Invalid language provided to getDefaultCode:', language);
    return LANGUAGE_TEMPLATES.javascript;
  }
  
  const template = LANGUAGE_TEMPLATES[language.toLowerCase()];
  if (!template) {
    console.warn('⚠️ No template found for language, using javascript:', language);
    return LANGUAGE_TEMPLATES.javascript;
  }
  
  return template;
};

export const getFileExtension = (language: string): string => {
  if (!language || typeof language !== 'string') {
    console.warn('⚠️ Invalid language provided to getFileExtension:', language);
    return 'txt';
  }
  
  return FILE_EXTENSIONS[language.toLowerCase()] || 'txt';
};

export const downloadCode = (code: string, language: string, filename = 'code') => {
  try {
    if (!code || typeof code !== 'string') {
      throw new Error('Invalid code content');
    }
    
    if (!language || typeof language !== 'string') {
      throw new Error('Invalid language');
    }
    
    const extension = getFileExtension(language);
    const blob = new Blob([code], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}.${extension}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    console.log('✅ Code downloaded successfully');
  } catch (error) {
    console.error('❌ Failed to download code:', error);
    throw error;
  }
};

export const getDomainIcon = (domain: string): string => {
  if (!domain || typeof domain !== 'string') {
    return '💻';
  }
  
  switch (domain.toLowerCase()) {
    case 'mern stack': return '🌐';
    case 'react native': return '📱';
    case 'flutter': return '🎯';
    case 'data analytics': return '📊';
    case 'ai/ml': return '🤖';
    default: return '💻';
  }
};

export const getDifficultyColor = (difficulty: string): string => {
  if (!difficulty || typeof difficulty !== 'string') {
    return 'bg-gray-100 text-gray-800 border-gray-300';
  }
  
  switch (difficulty.toLowerCase()) {
    case 'beginner': return 'bg-green-100 text-green-800 border-green-300';
    case 'intermediate': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
    case 'advanced': return 'bg-red-100 text-red-800 border-red-300';
    default: return 'bg-gray-100 text-gray-800 border-gray-300';
  }
};

// Utility function to validate language support (based on known extensions)
export const isLanguageSupported = (language: string): boolean => {
  if (!language || typeof language !== 'string') return false;
  return language.toLowerCase() in FILE_EXTENSIONS;
};

// Utility function to get language display name
export const getLanguageDisplayName = (language: string): string => {
  if (!language || typeof language !== 'string') {
    return 'Unknown';
  }
  
  const displayNames: Record<string, string> = {
    javascript: 'JavaScript',
    typescript: 'TypeScript',
    python: 'Python',
    java: 'Java',
    cpp: 'C++',
    c: 'C',
    html: 'HTML',
    css: 'CSS',
    sql: 'SQL',
    go: 'Go',
    rust: 'Rust',
  };
  
  const lowerLang = language.toLowerCase();
  return displayNames[lowerLang] || language.charAt(0).toUpperCase() + language.slice(1);
};

// Utility function to format code execution time
export const formatExecutionTime = (milliseconds: number): string => {
  if (typeof milliseconds !== 'number' || isNaN(milliseconds) || milliseconds < 0) {
    return '0ms';
  }
  
  if (milliseconds < 1000) {
    return `${Math.round(milliseconds)}ms`;
  }
  return `${(milliseconds / 1000).toFixed(2)}s`;
};

// Utility function to format memory usage
export const formatMemoryUsage = (bytes: number): string => {
  if (typeof bytes !== 'number' || isNaN(bytes) || bytes < 0) {
    return '0 B';
  }
  
  const units = ['B', 'KB', 'MB', 'GB'];
  let size = bytes;
  let unitIndex = 0;
  
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }
  
  return `${size.toFixed(2)} ${units[unitIndex]}`;
};

// Utility function to validate code before execution
export const validateCode = (code: string, language: string): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (!code || typeof code !== 'string' || code.trim().length === 0) {
    errors.push('Code cannot be empty');
  }
  
  if (!isLanguageSupported(language)) {
    errors.push(`Language "${language}" is not supported`);
  }
  
  // Language-specific basic validation
  if (code && typeof code === 'string') {
    switch (language?.toLowerCase()) {
      case 'javascript':
      case 'typescript':
        if (code.includes('eval(')) {
          errors.push('Use of eval() is not allowed for security reasons');
        }
        break;
      case 'python':
        if (code.includes('exec(') || code.includes('eval(')) {
          errors.push('Use of exec() or eval() is not allowed for security reasons');
        }
        break;
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// Monaco-specific helpers removed