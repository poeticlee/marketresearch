import js from '@eslint/js';
export default [
  { ignores: ['node_modules/**', '**/.next/**', '**/dist/**', 'tools/**', 'tests/e2e/**'] },
  js.configs.recommended,
  {
    files: ['**/*.mjs', '**/*.js', 'apps/web/next.config.js', 'scripts/**/*.mjs'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        console: 'readonly', process: 'readonly', module: 'writable',
        require: 'readonly', __dirname: 'readonly', __filename: 'readonly',
      },
    },
    rules: { 'no-useless-escape': 'off' },
  },
];
