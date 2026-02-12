// eslint.config.mjs
import { defineConfig, globalIgnores } from 'eslint/config'
import nextVitals from 'eslint-config-next/core-web-vitals'
import nextTs from 'eslint-config-next/typescript'

export default defineConfig([
  ...nextVitals,
  ...nextTs,

  // ── глобально: запрещаем console.*, разрешаем только console.error ──
  {
    rules: {
      'no-console': ['error', { allow: ['error'] }],
    },
  },

  // ── сервер: запрещаем вообще любой console, только logger ──
  {
    files: [
      'src/app/api/**/*.{ts,tsx,js,jsx}',
      'src/lib/**/*.{ts,tsx,js,jsx}',
      'scripts/**/*.{js,mjs,ts}',
    ],
    rules: {
      'no-console': 'error',
    },
  },

  // ── сами логгеры ──
  {
    files: ['src/lib/logger.ts', 'src/lib/client-logger.ts'],
    rules: { 'no-console': 'off' },
  },

  globalIgnores([
    '.next/**',
    'out/**',
    'build/**',
    'next-env.d.ts',
  ]),
])
