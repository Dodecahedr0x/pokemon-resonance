import js from '@eslint/js';
import globals from 'globals';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';

export default [
  { ignores: ['dist/**', 'node_modules/**', 'art/**', 'public/**', 'scripts/**'] },
  js.configs.recommended,
  {
    files: ['**/*.{js,jsx}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: { ...globals.browser },
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    plugins: { react, 'react-hooks': reactHooks },
    settings: { react: { version: 'detect' } },
    rules: {
      ...react.configs.recommended.rules,
      ...react.configs['jsx-runtime'].rules,
      ...reactHooks.configs.recommended.rules,
      'react/prop-types': 'off',
      // React wires load/error listeners on SVG <image> too; the rule only knows HTML tags.
      'react/no-unknown-property': ['error', { ignore: ['class', 'onLoad', 'onError'] }],

      // Strictness on top of the recommended sets.
      eqeqeq: ['error', 'always', { null: 'ignore' }],
      'no-var': 'error',
      'prefer-const': ['error', { destructuring: 'all' }],
      'no-unused-vars': ['error', { argsIgnorePattern: '^_', caughtErrors: 'none' }],
      'no-shadow': 'error',
      'no-implicit-globals': 'error',
      'no-implicit-coercion': ['error', { allow: ['!!', '+'] }],
      'no-eval': 'error',
      'no-new-func': 'error',
      'no-param-reassign': 'off',
      'no-throw-literal': 'error',
      'no-useless-return': 'error',
      'no-useless-concat': 'error',
      'no-unneeded-ternary': 'error',
      'no-else-return': 'error',
      'no-lonely-if': 'error',
      'no-duplicate-imports': 'error',
      'prefer-template': 'off',
      'object-shorthand': 'error',
      'prefer-arrow-callback': ['error', { allowNamedFunctions: true }],
      'no-console': ['error', { allow: ['warn', 'error'] }],
      curly: ['error', 'multi-line'],
    },
  },
  {
    files: ['vite.config.js', 'eslint.config.js'],
    languageOptions: { globals: { ...globals.node } },
  },
];
