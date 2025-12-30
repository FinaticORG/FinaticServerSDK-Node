import typescript from '@rollup/plugin-typescript';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';

const external = [
  'axios',
  'undici',
  'uuid',
  'pino',
  'zod',
  // p-retry removed - will be bundled (ESM-only package)
  'node-cache',
];

export default [
  // ES Module build
  {
    input: 'src/index.ts',
    output: {
      file: 'dist/index.mjs',
      format: 'es',
      sourcemap: true,
    },
    external,
    plugins: [
      resolve({
        preferBuiltins: true,
      }),
      commonjs(),
      typescript({
        tsconfig: './tsconfig.json',
        declaration: false,
        declarationMap: false,
        module: 'esnext',
        filterRoot: process.cwd(),
      }),
    ],
  },
  // CommonJS build
  {
    input: 'src/index.ts',
    output: {
      file: 'dist/index.cjs',
      format: 'cjs',
      sourcemap: true,
      exports: 'named',
    },
    external,
    plugins: [
      resolve({
        preferBuiltins: true,
      }),
      commonjs(),
      typescript({
        tsconfig: './tsconfig.json',
        declaration: false,
        declarationMap: false,
        module: 'esnext',
        filterRoot: process.cwd(),
      }),
    ],
  },
];

