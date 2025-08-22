import { defineConfig, type AliasOptions } from 'vite';
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
          if (p.includes('/components/Profile')) return 'route-profile';
          if (p.includes('/components/Notifications')) return 'route-notifications';
          if (p.includes('/components/Settings')) return 'route-settings';
          if (p.includes('/components/LandingPage')) return 'route-landing';
          if (p.includes('/components/Search')) return 'route-search';
          if (p.includes('/components/Leaderboard')) return 'route-leaderboard';
          if (p.includes('/components/RecruitingForm') || p.includes('/components/recruiting/')) return 'route-recruiting';
          if (p.includes('/components/ContentCreator')) return 'route-content';

          // Library/domain chunks
          if (p.includes('/node_modules/react')) return 'react';
          if (p.includes('/node_modules/@radix-ui/')) return 'radix';
          if (p.includes('/node_modules/@tanstack/')) return 'tanstack';
          if (p.includes('/node_modules/recharts')) return 'recharts';
          if (p.includes('/node_modules/socket.io-client')) return 'socketio';
          if (p.includes('/node_modules/embla-carousel')) return 'embla';
          if (p.includes('/node_modules/lucide-react')) return 'lucide';

          // Fallback vendor for other dependencies
          if (p.includes('/node_modules/')) return 'vendor';

          return undefined;
        },
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash][extname]',
      },
    },
  },
  };
});


