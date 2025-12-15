import { defineConfig } from 'vite';
import { resolve } from 'path';


export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: 'index.html',
        playground: '/public/playground.html'
      }
    }
  }
});


