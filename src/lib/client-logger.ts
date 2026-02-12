'use client';

// ---------------------------------------------------------------------------
// client-logger  –  безопасный логгер для клиентских компонентов
// • debug / info  подавляются в production
// • warn  / error всегда активны
// • любой объект перед выводом проходит через redact()
// ---------------------------------------------------------------------------

const REDACT_KEYS: ReadonlySet<string> = new Set([
  'email', 'phone', 'birth', 'birthdate',
  'token', 'secret', 'authorization', 'cookie', 'set-cookie',
  'password', 'oldpassword', 'newpassword',
  'client_secret', 'api_key', 'jwt', 'refresh', 'access',
  'smtp_pass', 'smtp_user', 'mail_from',
  'database_url', 'nextauth_secret',
]);

const REDACTED = '***';
const isProd = typeof process !== 'undefined' && process.env.NODE_ENV === 'production';

function isObject(v: unknown): v is Record<string, unknown> {
  return v !== null && typeof v === 'object' && !Array.isArray(v);
}

/**
 * Рекурсивно заменяет значения чувствительных ключей на '***'.
 * Безопасен к циклическим ссылкам.
 */
function redact(value: unknown, seen = new WeakSet()): unknown {
  if (value === null || value === undefined) return value;

  if (Array.isArray(value)) {
    return value.map((item) => redact(item, seen));
  }

  if (isObject(value)) {
    if (seen.has(value)) return '[Circular]';
    seen.add(value);

    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value)) {
      out[k] = REDACT_KEYS.has(k.toLowerCase()) ? REDACTED : redact(v, seen);
    }
    return out;
  }

  return value;
}

function sanitize(args: unknown[]): unknown[] {
  return args.map((a) => (isObject(a) || Array.isArray(a) ? redact(a) : a));
}

export const clog = {
  debug(...args: unknown[]) {
    if (isProd) return;
    console.debug(...sanitize(args));      // eslint-disable-line no-console
  },
  info(...args: unknown[]) {
    if (isProd) return;
    console.info(...sanitize(args));       // eslint-disable-line no-console
  },
  warn(...args: unknown[]) {
    console.warn(...sanitize(args));       // eslint-disable-line no-console
  },
  error(...args: unknown[]) {
    console.error(...sanitize(args));      // eslint-disable-line no-console
  },
};
