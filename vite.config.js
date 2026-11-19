import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Le moteur s'initialise une seule fois au démarrage (src/engine/index.js) : un module du
// moteur rechargé à chaud repartirait sans son état. On recharge donc toute la page.
const engineWithoutHmr = {
  name: 'moteur-sans-hmr',
  handleHotUpdate({ file, server }) {
    if (file.includes('/src/engine/')) {
      server.ws.send({ type: 'full-reload' });
      return [];
    }
  },
};

export default defineConfig({
  plugins: [react(), engineWithoutHmr],
  build: {
    // Le moteur et ses images intégrées pèsent plusieurs Mo : avertissement inutile.
    chunkSizeWarningLimit: 6000,
  },
});
