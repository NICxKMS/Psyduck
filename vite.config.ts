import { defineConfig, splitVendorChunkPlugin } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react(), splitVendorChunkPlugin()],
  build: {
    chunkSizeWarningLimit: 1600,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined;
          if (id.includes('node_modules/react')) return 'react';
          if (id.includes('node_modules/@radix-ui/')) return 'radix';
          if (id.includes('node_modules/@tanstack/')) return 'tanstack';
          if (id.includes('node_modules/@codemirror/')) return 'codemirror';
          return undefined;
        },
      },
    },
  },
});


