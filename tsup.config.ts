import { defineConfig } from 'tsup';

export default defineConfig({
  target: 'esnext',
  entry: ['src/**/*'],
  splitting: false,
  sourcemap: false,
  clean: true,
  format: ['cjs', 'esm'],
  dts: true,
});
