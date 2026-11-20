import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import styleSnapshot from './tools/style-snapshot/plugin.js';

// The engine initializes only once at startup (src/engine/index.js): a hot-reloaded engine
// module would restart without its state. So we reload the whole page.
const engineWithoutHmr = {
  name: 'engine-no-hmr',
  handleHotUpdate({ file, server }) {
    if (file.includes('/src/engine/')) {
      server.ws.send({ type: 'full-reload' });
      return [];
    }
  },
};

export default defineConfig({
  plugins: [react(), engineWithoutHmr, styleSnapshot()],
  build: {
    // The engine and its embedded images weigh several MB: pointless warning.
    chunkSizeWarningLimit: 6000,
  },
});
