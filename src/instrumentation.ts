/**
 * Next.js Instrumentation hook — runs once on server startup (Node.js runtime only).
 * Wraps console.error to strip sensitive keys before they reach log aggregators.
 *
 * Docs: https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation
 */

export async function register() {
  if (process.env.NODE_ENV !== 'production') return;
  if (typeof process === 'undefined') return;

  const REDACT_RE = /password|token|secret|authorization|cookie|set-cookie|api_key|smtp_pass/i;

  const original = console.error.bind(console);

  console.error = (...args: unknown[]) => {
    const sanitized = args.map((a) => {
      if (a instanceof Error) {
        // Strip stack in prod; keep message for observability (no PII expected in message)
        return `[Error] ${a.message}`;
      }
      if (a !== null && typeof a === 'object') {
        return JSON.parse(
          JSON.stringify(a, (key, val) =>
            REDACT_RE.test(key) ? '***' : val,
          ),
        );
      }
      return a;
    });
    original(...sanitized);
  };
}
