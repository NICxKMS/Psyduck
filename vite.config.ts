import { defineConfig, type AliasOptions } from 'vite';
import fs from 'node:fs';
import react from '@vitejs/plugin-react';
import compression from 'vite-plugin-compression';
export default defineConfig(({ mode }) => {
  const isProd = mode === 'production';
  const alias: AliasOptions | undefined = isProd
    ? {
        react: 'preact/compat',
        'react-dom/test-utils': 'preact/test-utils',
        'react-dom': 'preact/compat',
        'react-dom/client': 'preact/compat',
      }
    : undefined;

  return {
  plugins: [
    react(),
    // cssInjectedByJsPlugin(),
    // Pre-generate compressed assets for generic static servers
    // compression({ algorithm: 'brotliCompress', ext: '.br', threshold: 1024 }),
    // compression({ algorithm: 'gzip', ext: '.gz', threshold: 1024 }),
  ],
  resolve: {
    dedupe: ['react', 'react-dom'],
    alias,
  },
  define: {
    __DEV__: false,
    'process.env.NODE_ENV': JSON.stringify('production'),
  },
  esbuild: {
    drop: ['console', 'debugger'],
    legalComments: 'none',
  },
  build: {
    target: 'es2020',
    sourcemap: false,
    cssCodeSplit: true,
    reportCompressedSize: false,
    modulePreload: { polyfill: false },
    chunkSizeWarningLimit: 1600,
    rollupOptions: {
      output: {
        manualChunks(id) {
          const p = id.replace(/\\/g, '/');

          // Route/page-based chunks
          if (p.includes('/components/IDE') || p.includes('/components/ide/')) return 'route-ide';
          if (p.includes('/components/Dashboard')) return 'route-dashboard';
          if (p.includes('/components/ProjectCatalog') || p.includes('/components/projects/')) return 'route-projects';
          if (p.includes('/components/RecruitingForm') || p.includes('/components/recruiting/')) return 'route-recruiting';
          if (p.includes('/components/ContentCreator')) return 'route-content';

          // App core/providers/contexts into one chunk to avoid tiny files
          if (
            p.includes('/components/app/') ||
            p.includes('/components/providers/') ||
            p.includes('/contexts/') ||
            p.includes('/lib/app/') ||
            p.includes('/lib/performance/')
          ) {
            return 'app-core';
          }

          // Fold small app UI into core
          if (
            p.includes('/components/AppContent') ||
            p.includes('/components/Header') ||
            p.includes('/components/FloatingElementsContainer') ||
            p.includes('/components/RoutePreloader') ||
            p.includes('/components/PerformanceMonitor')
          ) {
            return 'app-core';
          }

          // Group small route pages together to avoid many tiny chunks
          if (
            p.includes('/components/Leaderboard') ||
            p.includes('/components/Settings') ||
            p.includes('/components/Notifications') ||
            p.includes('/components/Profile') ||
            p.includes('/components/Search')
          ) {
            return 'route-minor';
          }
          if (
            p.includes('/components/Login') ||
            p.includes('/components/Register') ||
            p.includes('/components/LandingPage')
          ) {
            return 'route-public';
          }

          // Consolidate React ecosystem
          if (p.includes('/node_modules/react')) return 'react';
          if (p.includes('/node_modules/react-dom')) return 'react';
          if (p.includes('/node_modules/preact')) return 'react';

          // Split Radix UI into manageable groups (<80KB)
          if (
            p.includes('/node_modules/@radix-ui/react-dialog') ||
            p.includes('/node_modules/@radix-ui/react-popover') ||
            p.includes('/node_modules/@radix-ui/react-tooltip') ||
            p.includes('/node_modules/@radix-ui/react-dropdown-menu') ||
            p.includes('/node_modules/@radix-ui/react-context-menu') ||
            p.includes('/node_modules/@radix-ui/react-hover-card')
          ) {
            return 'radix-floating';
          }
          if (
            p.includes('/node_modules/@radix-ui/react-accordion') ||
            p.includes('/node_modules/@radix-ui/react-tabs') ||
            p.includes('/node_modules/@radix-ui/react-navigation-menu') ||
            p.includes('/node_modules/@radix-ui/react-menubar') ||
            p.includes('/node_modules/@radix-ui/react-switch') ||
            p.includes('/node_modules/@radix-ui/react-slider') ||
            p.includes('/node_modules/@radix-ui/react-toggle') ||
            p.includes('/node_modules/@radix-ui/react-toggle-group')
          ) {
            return 'radix-controls';
          }
          if (p.includes('/node_modules/@radix-ui/')) {
            return 'radix-base';
          }

          if (p.includes('/node_modules/@tanstack/')) return 'tanstack';
          if (p.includes('/node_modules/recharts')) return 'recharts';
          if (p.includes('/node_modules/socket.io-client')) return 'socketio';
          if (p.includes('/node_modules/engine.io-client')) return 'socketio';
          if (p.includes('/node_modules/lucide-react')) return 'lucide';

          // Fine-grained CodeMirror chunking to keep chunks < ~80KB
          if (p.includes('/node_modules/@codemirror/') || p.includes('/node_modules/codemirror')) {
            if (p.includes('/node_modules/@codemirror/lang-') || p.includes('/node_modules/@lezer/')) {
              return 'codemirror-langs';
            }
            if (p.includes('/node_modules/@codemirror/state')) return 'cm-state';
            if (p.includes('/node_modules/@codemirror/view')) return 'cm-view';
            if (p.includes('/node_modules/@codemirror/language')) return 'cm-language-core';
            if (p.includes('/node_modules/@codemirror/commands')) return 'cm-commands';
            if (p.includes('/node_modules/@codemirror/autocomplete')) return 'cm-autocomplete';
            if (p.includes('/node_modules/@codemirror/search')) return 'cm-search';
            if (p.includes('/node_modules/@codemirror/lint')) return 'cm-lint';
            return 'cm-other';
          }

          // Group Floating UI together
          if (p.includes('/node_modules/@floating-ui/') || p.includes('/node_modules/floating-ui')) {
            return 'floating-ui';
          }

          // Fallback for other deps: size-based grouping to reduce tiny chunks
          if (p.includes('/node_modules/')) {
            // Try to group very small modules together
            try {
              const cleanId = id.split('?')[0];
              const stat = fs.statSync(cleanId);
              if (stat && stat.size < 20_000) {
                return 'vendor-misc';
              }
            } catch {
              // ignore virtual or missing files
            }

            // Otherwise, split by package name
            const match = p.match(/\/node_modules\/(?:@[^/]+\/)?[^/]+/);
            if (match) {
              const pkg = match[0]
                .replace('/node_modules/', '')
                .replace('@', '')
                .replace('/', '-');
              return pkg;
            }
          }

          return undefined;
        },
        experimentalMinChunkSize: 20000,
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash][extname]',
      },
    },
  },
  };
});


