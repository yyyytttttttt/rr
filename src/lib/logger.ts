/**
 * Centralized logger with redaction and environment-aware levels.
 *
 * Levels (ascending):
 *   debug  – only in development
 *   info   – only in development
 *   warn   – always
 *   error  – always
 *
 * Redaction: any object key matching REDACT_KEYS (case-insensitive)
 * has its value replaced with "***" recursively.
 */

const REDACT_KEYS: readonly string[] = [
  'password', 'pass', 'token', 'secret',
  'authorization', 'cookie', 'set-cookie',
  'database_url', 'nextauth_secret', 'jwt',
  'refresh', 'access', 'api_key', 'client_secret',
  'smtp_pass', 'smtp_user', 'mail_from',
  'oldpassword', 'newpassword',
];

const REDACT_SET = new Set(REDACT_KEYS.map((k) => k.toLowerCase()));

function redact(value: unknown, seen?: Set<unknown>): unknown {
  if (value === null || value === undefined) return value;
  if (typeof value !== 'object') return value;

  // circular-ref guard
  if (!seen) seen = new Set();
  if (seen.has(value)) return '[Circular]';
  seen.add(value);

  if (Array.isArray(value)) {
    return value.map((item) => redact(item, seen));
  }

  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
    out[k] = REDACT_SET.has(k.toLowerCase()) ? '***' : redact(v, seen);
  }
  return out;
}

function redactArgs(args: unknown[]): unknown[] {
  return args.map((a) => (typeof a === 'object' && a !== null ? redact(a) : a));
}

const isProd = process.env.NODE_ENV === 'production';

export const logger = {
  /** Dev-only. Suppressed entirely in production. */
  debug(...args: unknown[]) {
    if (isProd) return;
    console.log('[debug]', ...redactArgs(args));
  },

  /** Dev-only. Suppressed entirely in production. */
  info(...args: unknown[]) {
    if (isProd) return;
    console.log('[info]', ...redactArgs(args));
  },

  /** Always on. */
  warn(...args: unknown[]) {
    console.warn('[warn]', ...redactArgs(args));
  },

  /** Always on. In production, Error stacks are stripped. */
  error(...args: unknown[]) {
    const sanitized = args.map((a) => {
      if (a instanceof Error) {
        return isProd ? a.message : a;
      }
      return typeof a === 'object' && a !== null ? redact(a) : a;
    });
    console.error('[error]', ...sanitized);
  },
};
