import { defineConfig } from 'vite';
import { resolve } from 'path';
import { renameSync, existsSync, rmSync, readFileSync, writeFileSync } from 'fs';

export default defineConfig({
  base: './',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    modulePreload: { polyfill: false },
    rollupOptions: {
      input: {
        content: resolve(__dirname, 'src/content_scripts/content.ts'),
        page_script: resolve(__dirname, 'src/content_scripts/page_script.ts'),
        background: resolve(__dirname, 'src/background/background.ts'),
        sidebar: resolve(__dirname, 'src/sidebar/sidebar.html'),
        settings: resolve(__dirname, 'src/settings/settings.html'),
      },
      output: {
        entryFileNames: '[name].js',
        chunkFileNames: '[name].js',
        assetFileNames: (assetInfo) => {
          const info = assetInfo.name ?? '';
          if (info.endsWith('.css')) return 'assets/[name][extname]';
          return 'assets/[name][extname]';
        },
      },
    },
  },
  publicDir: 'public',
  plugins: [
    {
      name: 'flatten-html',
      writeBundle() {
        const moves = [
          { from: 'dist/src/settings/settings.html', to: 'dist/settings.html' },
          { from: 'dist/src/sidebar/sidebar.html', to: 'dist/sidebar.html' },
        ];
        for (const { from, to } of moves) {
          if (existsSync(from)) {
            renameSync(from, to);
            if (existsSync(to)) {
              let html = readFileSync(to, 'utf8');
              html = html.replace(/\.\.\/\.\.\//g, './');
              writeFileSync(to, html, 'utf8');
            }
          }
        }
        // Remove leftover empty src directories
        ['dist/src/settings', 'dist/src/sidebar', 'dist/src'].forEach((d) => {
          try {
            if (existsSync(d)) rmSync(d, { recursive: true });
          } catch {}
        });
      },
    },
  ],
});
