import js from '@eslint/js';
import tseslint from '@typescript-eslint/eslint-plugin';
import tsparser from '@typescript-eslint/parser';
import prettier from 'eslint-config-prettier';

export default [
  js.configs.recommended,
  prettier,
  {
    files: ['**/*.ts'],
    languageOptions: {
      parser: tsparser,
      parserOptions: {
        ecmaVersion: '2022',
        sourceType: 'module',
        project: './tsconfig.json',
      },
      globals: {
        console: 'readonly',
        window: 'readonly',
        document: 'readonly',
        navigator: 'readonly',
        localStorage: 'readonly',
        sessionStorage: 'readonly',
        Phaser: 'readonly',
        fetch: 'readonly',
        clearInterval: 'readonly',
        setTimeout: 'readonly',
        setInterval: 'readonly',
        self: 'readonly',
        caches: 'readonly',
        URL: 'readonly',
        location: 'readonly',
        Response: 'readonly',
      },
    },
    plugins: {
      '@typescript-eslint': tseslint,
    },
    rules: {
      // TypeScript rules
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
      '@typescript-eslint/no-this-alias': 'off',
      '@typescript-eslint/consistent-type-imports': 'warn',
      '@typescript-eslint/prefer-nullish-coalescing': 'off',
      '@typescript-eslint/prefer-optional-chain': 'off',

      // General rules
      'no-console': 'off',
      'no-undef': 'off',
      'no-case-declarations': 'off',
      'no-unused-vars': 'off',
      'prefer-const': 'warn',
      'no-var': 'warn',
      'eqeqeq': 'warn',
      'no-unused-expressions': 'warn',
      'no-return-await': 'off',
    },
  },
  {
    ignores: [
      'dist/',
      'node_modules/',
      '*.config.js',
      '*.config.ts',
      'scripts/',
      'eslint.config.js',
      '.worktrees/',
      'public/sw.js',
    ],
  },
];
