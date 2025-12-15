import { defineConfig } from 'vite';
import { resolve } from 'path';


export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: 'index.html',
        playground: 'playground.html'
      }
    }
  }
});


