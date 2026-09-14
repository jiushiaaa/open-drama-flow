import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';
import { fileURLToPath } from 'node:url';
import { readFileSync } from 'node:fs';
const notices = ['LICENSE.infinite-canvas', 'node_modules/react/LICENSE', 'node_modules/react-dom/LICENSE', 'node_modules/lucide-react/LICENSE'].map(file => `${file}\n\n${readFileSync(new URL(file, import.meta.url), 'utf8')}`).join('\n\n---\n\n');
export default defineConfig({
  plugins: [tailwindcss(), { name: 'canvas-licenses', generateBundle() { this.emitFile({ type: 'asset', fileName: 'THIRD-PARTY-LICENSES.txt', source: notices }); } }],
  define: { 'process.env.NODE_ENV': JSON.stringify('production') },
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
  build: { outDir: '../public/canvas-ui', emptyOutDir: true, rollupOptions: { output: { banner: '/*! OpenDramaFlow canvas; adapted from basketikun/infinite-canvas d213a746 (MIT). See THIRD-PARTY-LICENSES.txt. */' } }, lib: { entry: 'src/entry.tsx', formats: ['es'], fileName: () => 'canvas.js', cssFileName: 'canvas' } }
});
