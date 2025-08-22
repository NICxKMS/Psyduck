import React, { useEffect, useRef, useState } from 'react';
import { EditorState, Compartment } from '@codemirror/state';
import { EditorView, keymap, drawSelection, highlightActiveLine, highlightActiveLineGutter, lineNumbers } from '@codemirror/view';
import { defaultHighlightStyle, indentOnInput, syntaxHighlighting, bracketMatching } from '@codemirror/language';
import { autocompletion, closeBrackets, closeBracketsKeymap, completionKeymap } from '@codemirror/autocomplete';
import { searchKeymap, highlightSelectionMatches } from '@codemirror/search';
import { history, defaultKeymap, historyKeymap } from '@codemirror/commands';
import { lintKeymap } from '@codemirror/lint';
// Language packs are loaded dynamically to keep the base bundle small

export interface CodeEditorProps {
	value: string;
	language: string;
	className?: string;
	placeholder?: string;
	// Feature toggles
	readOnly?: boolean;
	showMinimap?: boolean;
	wordWrap?: 'off' | 'on' | 'bounded' | 'wordWrapColumn';
	fontSize?: number;
	lineNumbers?: 'on' | 'off' | 'relative' | 'interval';
	tabSize?: number;
	intellisense?: boolean;
	// Appearance
	theme?: 'light' | 'dark' | 'system';
	// Persistence
	storageKey?: string;
	autoSave?: boolean;
	// Events/APIs
	registerApi?: (api: {
		format: () => void;
		setTheme: (theme: string) => void;
		getValue: () => string;
		setValue: (next: string) => void;
		focus: () => void;
	}) => void;
	onStatusChange?: (status: { line: number; column: number; length: number; selectionLength: number }) => void;
	onChange: (code: string) => void;
	onReady?: () => void;
}

const loadLanguageExtension = async (lang: string) => {
	const lower = (lang || '').toLowerCase();
	try {
		switch (lower) {
			case 'typescript': {
				const { javascript } = await import('@codemirror/lang-javascript');
				return javascript({ jsx: true, typescript: true });
			}
			case 'javascript': {
				const { javascript } = await import('@codemirror/lang-javascript');
				return javascript({ jsx: true, typescript: false });
			}
			case 'python': {
				const { python } = await import('@codemirror/lang-python');
				return python();
			}
			case 'java': {
				const { java } = await import('@codemirror/lang-java');
				return java();
			}
			case 'cpp':
			case 'c': {
				const { cpp } = await import('@codemirror/lang-cpp');
				return cpp();
			}
			case 'html': {
				const { html } = await import('@codemirror/lang-html');
				return html();
			}
			case 'css': {
				const { css } = await import('@codemirror/lang-css');
				return css();
			}
			case 'sql': {
				const { sql } = await import('@codemirror/lang-sql');
				return sql();
			}
			case 'rust': {
				const { rust } = await import('@codemirror/lang-rust');
				return rust();
			}
			case 'go': {
				const { go } = await import('@codemirror/lang-go');
				return go();
			}
			default: {
				const { javascript } = await import('@codemirror/lang-javascript');
				return javascript({ jsx: true });
			}
		}
	} catch {
		const { javascript } = await import('@codemirror/lang-javascript');
		return javascript({ jsx: true });
	}
};

export const CodeEditor: React.FC<CodeEditorProps> = ({
	value,
	language,
	className,
	placeholder = 'Start typing your code here...',
	readOnly = false,
	showMinimap = true,
	wordWrap = 'on',
	fontSize = 14,
	lineNumbers: showLineNumbers = 'on',
	tabSize = 2,
	intellisense = true,
	// Appearance
	theme = 'system',
	// Persistence
	storageKey,
	autoSave = true,
	// Events/APIs
	registerApi,
	onStatusChange,
	onChange,
	onReady,
}) => {
	const containerRef = useRef<HTMLDivElement>(null);
	const viewRef = useRef<EditorView | null>(null);
	const languageCompartment = useRef(new Compartment()).current;
	const editableCompartment = useRef(new Compartment()).current;
	const tabSizeCompartment = useRef(new Compartment()).current;
	const wrapCompartment = useRef(new Compartment()).current;
	const fontSizeCompartment = useRef(new Compartment()).current;
	const themeCompartment = useRef(new Compartment()).current;
	const [isReady, setIsReady] = useState(false);

	// Initialize editor
	useEffect(() => {
		if (!containerRef.current) return;
		if (viewRef.current) return;

		const wrapExt = wordWrap === 'off' ? [] : [EditorView.lineWrapping];
		const lineNumbersExt = showLineNumbers === 'off' ? [] : [lineNumbers(), highlightActiveLineGutter()];

		const state = EditorState.create({
			doc: value ?? '',
			extensions: [
				keymap.of([
					...closeBracketsKeymap,
					...defaultKeymap,
					...searchKeymap,
					...historyKeymap,
					...completionKeymap,
					...lintKeymap,
				]),
				languageCompartment.of([]),
				editableCompartment.of(EditorView.editable.of(!readOnly)),
				lineNumbersExt,
				drawSelection(),
				highlightActiveLine(),
				indentOnInput(),
				bracketMatching(),
				highlightSelectionMatches(),
				closeBrackets(),
				intellisense ? autocompletion() : [],
				fontSizeCompartment.of(EditorView.theme({
					'&': { fontSize: `${fontSize}px` },
					'.cm-scroller': { fontFamily: "'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace" },
				})),
				themeCompartment.of(EditorView.theme({
					'&': { backgroundColor: 'transparent', color: 'inherit' },
					'.cm-content': { caretColor: 'inherit' },
					'.cm-activeLine': { backgroundColor: 'var(--tw-colors-muted, rgba(0,0,0,0.04))' },
					'.cm-gutters': { backgroundColor: 'transparent', color: 'inherit', borderRight: '1px solid var(--tw-colors-border, rgba(0,0,0,0.08))' },
				})),
				syntaxHighlighting(defaultHighlightStyle, { fallback: true }),
				wrapCompartment.of(wrapExt),
				tabSizeCompartment.of(EditorState.tabSize.of(tabSize)),
				history(),
			],
		});

		const view = new EditorView({
			state,
			parent: containerRef.current,
			dispatch: (tr) => {
				view.update([tr]);
				if (tr.docChanged) {
					const newDoc = tr.state.doc.toString();
					onChange(newDoc);
					if (autoSave && storageKey) {
						try { localStorage.setItem(storageKey, newDoc); } catch {}
					}
				}
				if (onStatusChange && (tr.selection || tr.docChanged)) {
					const sel = tr.state.selection.main;
					const pos = sel.head;
					const doc = tr.state.doc;
					const line = doc.lineAt(pos);
					onStatusChange({
						line: line.number,
						column: pos - line.from + 1,
						length: doc.length,
						selectionLength: Math.abs(sel.to - sel.from),
					});
				}
			},
		});

		viewRef.current = view;

			// Load language pack lazily after view creation
			(async () => {
				const ext = await loadLanguageExtension(language);
				try { view.dispatch({ effects: languageCompartment.reconfigure(ext) }); } catch {}
			})();

			setIsReady(true);
			onReady?.();

			return () => {
			try { view.destroy(); } catch {}
			viewRef.current = null;
		};
	// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	// React to external prop changes
	useEffect(() => {
		const view = viewRef.current;
		if (!view) return;
		const current = view.state.doc.toString();
		if (current !== value) {
			view.dispatch({ changes: { from: 0, to: current.length, insert: value } });
		}
	}, [value]);

	useEffect(() => {
		const view = viewRef.current;
		if (!view) return;
		let cancelled = false;
		(async () => {
			const ext = await loadLanguageExtension(language);
			if (cancelled) return;
			try { view.dispatch({ effects: languageCompartment.reconfigure(ext) }); } catch {}
		})();
		return () => { cancelled = true; };
	}, [language]);

	useEffect(() => {
		const view = viewRef.current;
		if (!view) return;
		view.dispatch({ effects: editableCompartment.reconfigure(EditorView.editable.of(!readOnly)) });
	}, [readOnly]);

	useEffect(() => {
		if (!autoSave || !storageKey) return;
		try { localStorage.setItem(storageKey, value); } catch {}
	}, [autoSave, storageKey, value]);

	useEffect(() => {
		if (!storageKey) return;
		try {
			const saved = localStorage.getItem(storageKey);
			if (saved && typeof saved === 'string' && saved !== value) {
				onChange(saved);
			}
		} catch {}
		// run once
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	useEffect(() => {
		const view = viewRef.current;
		if (!view) return;
		view.dispatch({ effects: wrapCompartment.reconfigure(wordWrap === 'off' ? [] : [EditorView.lineWrapping]) });
	}, [wordWrap]);

	useEffect(() => {
		const view = viewRef.current;
		if (!view) return;
		view.dispatch({ effects: tabSizeCompartment.reconfigure(EditorState.tabSize.of(tabSize)) });
	}, [tabSize]);

	useEffect(() => {
		const view = viewRef.current;
		if (!view) return;
		view.dispatch({ effects: fontSizeCompartment.reconfigure(EditorView.theme({ '&': { fontSize: `${fontSize}px` } })) });
	}, [fontSize]);

	// Theme handling
	useEffect(() => {
		const view = viewRef.current;
		if (!view) return;
		const isDark = (() => {
			if (theme === 'dark') return true;
			if (theme === 'light') return false;
			try { return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches; } catch { return false; }
		})();
		const themed = EditorView.theme(
			isDark
				? {
					'&': { backgroundColor: 'transparent', color: 'rgb(226 232 240)' },
					'.cm-content': { caretColor: 'rgb(226 232 240)' },
					'.cm-activeLine': { backgroundColor: 'rgba(148, 163, 184, 0.12)' },
					'.cm-selectionLayer .cm-selectionBackground': { backgroundColor: 'rgba(59, 130, 246, 0.35)' },
					'.cm-gutters': { backgroundColor: 'transparent', color: 'rgb(148 163 184)', borderRight: '1px solid rgba(148,163,184,0.25)' },
				}
				: {
					'&': { backgroundColor: 'transparent', color: 'rgb(15 23 42)' },
					'.cm-content': { caretColor: 'rgb(15 23 42)' },
					'.cm-activeLine': { backgroundColor: 'rgba(15, 23, 42, 0.06)' },
					'.cm-selectionLayer .cm-selectionBackground': { backgroundColor: 'rgba(59, 130, 246, 0.28)' },
					'.cm-gutters': { backgroundColor: 'transparent', color: 'rgb(71 85 105)', borderRight: '1px solid rgba(15,23,42,0.12)' },
				}
		);
		view.dispatch({ effects: themeCompartment.reconfigure(themed) });
	}, [theme]);

	// Register public API for parent components
	useEffect(() => {
		if (!registerApi) return;
		registerApi({
			format: () => {
				// placeholder: could integrate Prettier in the future
			},
			setTheme: (_theme: string) => {
				// theming handled via Tailwind + EditorView.theme if needed
			},
			getValue: () => {
				try { return String(viewRef.current?.state.doc.toString() ?? ''); } catch { return ''; }
			},
			setValue: (next: string) => {
				const view = viewRef.current;
				if (!view) return;
				const current = view.state.doc.toString();
				view.dispatch({ changes: { from: 0, to: current.length, insert: next } });
			},
			focus: () => {
				try { viewRef.current?.focus(); } catch {}
			},
		});
	}, [registerApi]);

	return (
		<div className={className}>
			<div ref={containerRef} className="h-full w-full">
				{!isReady && (
				<textarea
					className="h-full w-full p-3 font-mono text-sm bg-background text-foreground outline-none resize-none"
					value={value}
					placeholder={placeholder}
						readOnly
				/>
			)}
			</div>
		</div>
	);
};

export default CodeEditor;


