export const LANGUAGE_TEMPLATES: Record<string, string> = {
  javascript: `// Welcome to the Psyduck IDE!
console.log('Hello, World!');

// Your code here...
`,
  python: `# Welcome to the Psyduck IDE!
print('Hello, World!')

# Your code here...
`,
  java: `// Welcome to the Psyduck IDE!
public class Main {
    public static void main(String[] args) {
        System.out.println("Hello, World!");
        // Your code here...
    }
}`,
  cpp: `// Welcome to the Psyduck IDE!
#include <iostream>
using namespace std;

int main() {
    cout << "Hello, World!" << endl;
    // Your code here...
    return 0;
}`,
  typescript: `// Welcome to the Psyduck IDE!
function greet(name: string): string {
    return \`Hello, \${name}!\`;
}

console.log(greet('World'));

// Your code here...
`,
};

export const FILE_EXTENSIONS: Record<string, string> = {
  javascript: 'js',
  typescript: 'ts',
  python: 'py',
  java: 'java',
  cpp: 'cpp',
  c: 'c',
  html: 'html',
  css: 'css',
  sql: 'sql',
  go: 'go',
  rust: 'rs',
};
// Monaco-specific configuration removed