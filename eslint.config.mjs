import nextConfig from 'eslint-config-next/flat';

export default [
  ...nextConfig,

  // ── глобальное правило: console.log / debug / info / warn запрещены ──
  {
    rules: {
      'no-console': ['warn', { allow: ['error'] }],
    },
  },

  // ── серверные файлы: запрещён даже console.error (используйте logger) ──
  {
    files: [
      'src/app/api/**/*.ts',
      'src/app/api/**/*.tsx',
      'src/lib/auth.ts',
      'src/lib/mailer.js',
      'src/lib/prizma.ts',
      'scripts/**/*.js',
    ],
    rules: {
      'no-console': 'error',
    },
  },

  // ── логгеры сами — исключены из проверки ──
  {
    files: ['src/lib/logger.ts', 'src/lib/client-logger.ts'],
    rules: {
      'no-console': 'off',
    },
  },
];
