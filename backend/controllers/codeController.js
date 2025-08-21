// Node-only code execution (JavaScript) with a constrained VM sandbox.
// WARNING: For development only. Do not use in production without hardening.
const vm = require('node:vm');
const {
  codeHistory,
  sharedCodes,
  executions,
  languageTemplates,
} = require('../data/db');

exports.executeCode = async (req, res) => {
    const { code, language, input, workspace } = req.body;

    if (!code || typeof code !== 'string') {
        return res.status(400).json({ success: false, message: 'Code is required' });
    }

    // Only allow JavaScript for now
    if (!language || !/^js|javascript$/i.test(language)) {
        return res.status(400).json({ success: false, message: 'Only JavaScript execution is supported currently' });
    }

    const start = Date.now();

    try {
        // Create a tightly scoped sandbox
        const sandbox = {
            console: {
                logs: [],
                log: (...args) => sandbox.console.logs.push(args.join(' ')),
                error: (...args) => sandbox.console.logs.push(args.join(' ')),
                warn: (...args) => sandbox.console.logs.push(args.join(' ')),
            },
            input,
        };

        const context = vm.createContext(sandbox, { name: 'psyduck-sandbox' });

        let result;
        if (workspace && Array.isArray(workspace.files) && typeof workspace.entryPath === 'string') {
            // Multi-file workspace execution (virtual module system)
            const files = Object.create(null);
            for (const f of workspace.files) {
                if (!f || typeof f.path !== 'string' || typeof f.content !== 'string') continue;
                // Normalize to a shared root prefix
                const p = String(f.path).replace(/\\/g, '/');
                files[p] = f.content;
            }

            const entry = String(workspace.entryPath).replace(/\\/g, '/');
            if (!files[entry]) {
                return res.status(400).json({ success: false, message: 'Entry file not found in workspace' });
            }

            // Very small virtual require implementation
            const moduleCache = Object.create(null);
            const requireVirtual = (specifier) => {
                if (typeof specifier !== 'string') throw new Error('Invalid require');
                const cleaned = specifier.replace(/\\/g, '/');
                // Support relative paths only to avoid escaping the workspace root
                if (!cleaned.startsWith('./') && !cleaned.startsWith('../')) {
                    throw new Error('Only relative requires are allowed');
                }
                // Resolve path relative to current executing file using a naive resolver
                const stackTop = sandbox.__currentModulePath || entry;
                const baseDir = stackTop.split('/').slice(0, -1).join('/');
                const resolved = (baseDir ? baseDir + '/' : '') + cleaned;
                const normalized = resolved.replace(/\/\.\//g, '/').replace(/\/[^/]+\/\.\.\//g, '/');
                const target = normalized;
                if (!files[target]) throw new Error(`Module not found: ${specifier}`);
                if (moduleCache[target]) return moduleCache[target].exports;
                const module = { exports: {} };
                moduleCache[target] = module;
                const wrappedModule = `((module, exports, require) => {\n${files[target]}\n})`;
                const fn = new vm.Script(wrappedModule, { filename: target }).runInContext(context, { timeout: 200 });
                const prev = sandbox.__currentModulePath;
                sandbox.__currentModulePath = target;
                try { fn(module, module.exports, requireVirtual); } finally { sandbox.__currentModulePath = prev; }
                return module.exports;
            };

            const program = `
              (async () => {
                const __main = require('${('./' + entry).replace(/'/g, "'")}')
                if (typeof __main === 'function') { return await __main(); }
                return '';
              })();
            `;
            // Seed require into sandbox
            sandbox.require = requireVirtual;
            const script = new vm.Script(program, { filename: entry });
            result = await script.runInContext(context, { timeout: 800, displayErrors: true });
        } else {
            // Single-file execution
            const wrapped = `
              (async () => {
                ${code}
              })();
            `;
            const script = new vm.Script(wrapped, { filename: 'user-code.js' });
            result = await script.runInContext(context, { timeout: 500, displayErrors: true });
        }

        const end = Date.now();
        const stdout = (sandbox.console.logs || []).join('\n');

        const payload = {
            success: true,
            message: 'Code executed successfully',
            data: {
                id: String(Date.now()),
                success: true,
                output: stdout || (result !== undefined ? String(result) : ''),
                executionTime: end - start,
                memoryUsage: process.memoryUsage().heapUsed,
                status: 'completed',
                errorMessage: null,
            }
        };
        try { executions[payload.data.id] = payload.data; } catch {}
        return res.status(200).json(payload);
    } catch (err) {
        const end = Date.now();
        return res.status(200).json({
            success: false,
            message: 'Code execution failed',
            data: {
                id: String(Date.now()),
                success: false,
                output: '',
                executionTime: end - start,
                memoryUsage: process.memoryUsage().heapUsed,
                status: 'error',
                errorMessage: err && err.message ? String(err.message) : 'Unknown error',
            }
        });
    }
};

exports.getSupportedLanguages = async (_req, res) => {
    try {
        const languages = [
            { language: 'javascript', version: '18.x', extensions: ['js'], template: languageTemplates.javascript, examples: {} },
            { language: 'python', version: '3.11', extensions: ['py'], template: languageTemplates.python, examples: {} },
            { language: 'java', version: '17', extensions: ['java'], template: languageTemplates.java, examples: {} },
            { language: 'cpp', version: 'C++17', extensions: ['cpp'], template: languageTemplates.cpp, examples: {} },
        ];
        return res.status(200).json(languages);
    } catch (err) {
        return res.status(500).json({ message: 'Failed to load languages', error: String(err && err.message ? err.message : err) });
    }
};

exports.getLatestCode = async (req, res) => {
    const { projectId, milestoneId } = req.params;
    const list = codeHistory[projectId] || [];
    const latest = list.filter((h) => !milestoneId || h.milestoneId === milestoneId).slice(-1)[0];
    if (latest) {
        return res.status(200).json({ code: latest.code, language: latest.language, lastModified: latest.createdAt });
    }
    const language = 'javascript';
    const code = `// Project: ${projectId}\n// Milestone: ${milestoneId}\n${languageTemplates.javascript}`;
    return res.status(200).json({ code, language, lastModified: new Date().toISOString() });
};

exports.saveCode = async (req, res) => {
    const { projectId, milestoneId, language, code } = req.body;
    if (!projectId || !milestoneId || !language || typeof code !== 'string') {
        return res.status(400).json({ message: 'Invalid payload' });
    }
    const entry = {
        id: String(Date.now()),
        projectId,
        milestoneId,
        language,
        code,
        createdAt: new Date().toISOString(),
    };
    if (!codeHistory[projectId]) codeHistory[projectId] = [];
    codeHistory[projectId].push(entry);
    return res.status(200).json({ message: 'Saved', data: { id: entry.id } });
};

exports.getCodeHistory = async (req, res) => {
    const { projectId } = req.params;
    return res.status(200).json(codeHistory[projectId] || []);
};

exports.shareCode = async (req, res) => {
    const { projectId, milestoneId, code, language } = req.body;
    const shareId = `share-${Date.now()}`;
    sharedCodes[shareId] = {
        code: String(code || ''),
        language: String(language || 'javascript'),
        projectTitle: String(projectId || 'Demo Project'),
        milestoneTitle: String(milestoneId || 'default'),
        sharedBy: (req.user && req.user.email) || 'anonymous',
        sharedAt: new Date().toISOString(),
    };
    return res.status(200).json({ shareUrl: `/share/${shareId}`, shareId });
};

exports.getSharedCode = async (req, res) => {
    const { shareId } = req.params;
    const data = sharedCodes[shareId];
    if (!data) return res.status(404).json({ message: 'Share not found' });
    return res.status(200).json(data);
};

exports.getLanguageTemplate = async (req, res) => {
    const { language } = req.params;
    const template = languageTemplates[language?.toLowerCase?.()] || '';
    return res.status(200).json({ template });
};
// Return a minimal list of supported languages for the IDE
exports.getSupportedLanguages = async (_req, res) => {
	try {
		const languages = [
			{ language: 'javascript', version: '18.x', extensions: ['js'], template: "console.log('Hello, World!')\n", examples: {} },
			{ language: 'python', version: '3.11', extensions: ['py'], template: "print('Hello, World!')\n", examples: {} },
			{ language: 'java', version: '17', extensions: ['java'], template: 'public class Main {\n  public static void main(String[] args) {\n    System.out.println("Hello, World!");\n  }\n}\n', examples: {} },
			{ language: 'cpp', version: 'C++17', extensions: ['cpp'], template: '#include <iostream>\nint main(){ std::cout << "Hello, World!"; }\n', examples: {} },
		];
		return res.status(200).json(languages);
	} catch (err) {
		return res.status(500).json({ message: 'Failed to load languages', error: String(err && err.message ? err.message : err) });
	}
};

// Return latest code for a project/milestone (in-memory stub)
exports.getLatestCode = async (req, res) => {
	const { projectId, milestoneId } = req.params;
	// Simple default starter; in a real app, fetch from DB
	const language = 'javascript';
	const code = `// Project: ${projectId}\n// Milestone: ${milestoneId}\nconsole.log('Hello, World!');\n`;
	return res.status(200).json({
		code,
		language,
		lastModified: new Date().toISOString(),
	});
};

