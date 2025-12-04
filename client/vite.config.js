import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: '/', // root domain (urnavi.com)
  plugins: [react()],
});
