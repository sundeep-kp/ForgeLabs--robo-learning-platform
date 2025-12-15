import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        
        input: 'index.html',
        // Second entry point for the PLAYGROUND page
        playground: resolve(__dirname, 'public/playground.html'), 
      },
    },
  },
  // Ensure development server serves learn.html by default
  
});
