import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import pluginReact from 'eslint-plugin-react';
import { defineConfig, globalIgnores } from 'eslint/config';

const reactRecommended = pluginReact.configs.flat.recommended;
const reactJsxRuntime = pluginReact.configs.flat['jsx-runtime'];
if (!reactRecommended || !reactJsxRuntime) {
  throw new Error('The React plugin must provide recommended and JSX-runtime flat configs');
}

export default defineConfig([
  globalIgnores(['.output/**', '.wxt/**', '.agents/**', '.scratch/**']),
  {
    files: ['**/*.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    extends: [js.configs.recommended, tseslint.configs.recommended],
    languageOptions: { globals: globals.browser },
    rules: {
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    },
  },
  {
    files: ['**/*.{jsx,tsx}'],
    extends: [reactRecommended, reactJsxRuntime],
    settings: { react: { version: 'detect' } },
  },
]);
