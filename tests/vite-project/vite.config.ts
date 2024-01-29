import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';

const _filename = fileURLToPath(import.meta.url);
const _dirname = dirname(_filename);

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '_/': _dirname + '/src/assets/',
    }
  },
  build: {
    minify: false,
  },
})
