// @ts-check
const tseslint = require('typescript-eslint');
const angular = require('angular-eslint');

module.exports = tseslint.config(
  {
    ignores: ['dist/**', 'node_modules/**', '.angular/**'],
  },

  // Base TypeScript rules for all src files
  {
    files: ['src/**/*.ts'],
    extends: [
      ...tseslint.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['tsconfig.json', 'tsconfig.app.json', 'tsconfig.spec.json'],
        tsconfigRootDir: __dirname,
      },
    },
    plugins: {
      '@angular-eslint': angular.tsPlugin,
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      '@angular-eslint/component-max-inline-declarations': [
        'error',
        { template: 0, styles: 0, animations: 0 },
      ],
    },
  },

  // Boundary: shared/ui must not import from data-access or features
  {
    files: ['src/app/shared/ui/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'warn',
        {
          patterns: [
            {
              group: ['**/data-access/**', '../../data-access/**'],
              message: 'shared/ui must not import from data-access',
            },
            {
              group: ['**/features/**', '../../features/**'],
              message: 'shared/ui must not import from features',
            },
          ],
        },
      ],
    },
  },

  // Boundary: shared/util must not import from data-access, features, or core
  {
    files: ['src/app/shared/util/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'warn',
        {
          patterns: [
            {
              group: ['**/data-access/**', '../../data-access/**'],
              message: 'shared/util must not import from data-access',
            },
            {
              group: ['**/features/**', '../../features/**'],
              message: 'shared/util must not import from features',
            },
            {
              group: ['**/core/**', '../../core/**'],
              message: 'shared/util must not import from core',
            },
          ],
        },
      ],
    },
  },

  // Boundary: data-access must not import from features
  {
    files: ['src/app/data-access/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'warn',
        {
          patterns: [
            {
              group: ['**/features/**', '../features/**'],
              message: 'data-access must not import from features',
            },
          ],
        },
      ],
    },
  },
);
