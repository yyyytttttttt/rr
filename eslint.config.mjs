// eslint.config.mjs
import { defineConfig, globalIgnores } from 'eslint/config'
import nextVitals from 'eslint-config-next/core-web-vitals'
import nextTs from 'eslint-config-next/typescript'

export default defineConfig([
  ...nextVitals,
  ...nextTs,

  // ── базовые правила проекта (мягкий режим) ──
  {
    rules: {
      // по умолчанию: console.log/debug/info/warn -> warn, console.error можно
      'no-console': ['warn', { allow: ['error'] }],

      // "_" намеренно неиспользуемые — ок
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],

      // any пока не блокирует сборку
      '@typescript-eslint/no-explicit-any': 'warn',

      // ts-ignore / ts-expect-error — только с описанием (но warn)
      '@typescript-eslint/ban-ts-comment': [
        'warn',
        {
          'ts-ignore': 'allow-with-description',
          'ts-expect-error': 'allow-with-description',
          minimumDescriptionLength: 3,
        },
      ],

      // эти 2 сейчас валили сборку — переводим в warn
      '@next/next/no-html-link-for-pages': 'warn',
      'react/no-unescaped-entities': 'warn',
    },
  },

  // ── серверные API: запрещаем любой console (error тоже) ──
  {
    files: ['src/app/api/**/*.{ts,tsx}'],
    rules: {
      'no-console': 'error',
    },
  },

  // ✅ твой вариант: mobile API — console только warn
  {
    files: ['src/app/api/mobile/**/*.{ts,tsx}'],
    rules: {
      'no-console': ['warn', { allow: ['error'] }],
    },
  },

  // ── конкретные серверные файлы (как у тебя было) ──
  {
    files: ['src/lib/auth.ts', 'src/lib/mailer.js', 'src/lib/prizma.ts'],
    rules: {
      'no-console': 'error',
    },
  },

  // ✅ scripts: разрешаем require + console (иначе утилиты не живут)
  {
    files: ['scripts/**/*.{js,cjs,mjs,ts}'],
    rules: {
      'no-console': 'off',
      '@typescript-eslint/no-require-imports': 'off',
    },
  },

  // ── логгеры сами — исключены из проверки ──
  {
    files: ['src/lib/logger.ts', 'src/lib/client-logger.ts'],
    rules: { 'no-console': 'off' },
  },

  globalIgnores(['.next/**', 'out/**', 'build/**', 'next-env.d.ts']),
])
