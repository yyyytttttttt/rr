/**
 * Rate limiter — in-memory (single-instance / dev) or Redis (multi-instance).
 *
 * ENV:
 *   REDIS_URL            — ioredis connection string. If set, Redis is used.
 *                          On Redis error, falls back to in-memory silently.
 *   TRUSTED_PROXY_COUNT  — number of trusted reverse proxies (default 1).
 *                          0 = don't trust X-Forwarded-For.
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _redis: any | null | undefined; // undefined = not yet initialised

// Lua: atomic INCR + PEXPIRE (sets TTL only on first increment)
const LUA_INCR = `
local c = redis.call('INCR', KEYS[1])
if c == 1 then redis.call('PEXPIRE', KEYS[1], ARGV[1]) end
return c
`;

async function getRedis(): Promise</* Redis */ any | null> {
  if (_redis !== undefined) return _redis;
  const url = process.env.REDIS_URL;
  if (!url) { _redis = null; return null; }
  try {
    const { default: Redis } = await import('ioredis');
    const client = new Redis(url, {
      maxRetriesPerRequest: 2,
      enableReadyCheck: false,
      lazyConnect: true,
    });
    client.on('error', (e: Error) => {
      // Log but don't crash — in-memory will take over
      process.stderr.write(`[rate-limit] Redis error: ${e.message}\n`);
    });
    await client.connect();
    _redis = client;
  } catch (e: unknown) {
    process.stderr.write(`[rate-limit] Redis unavailable, falling back to in-memory: ${(e as Error).message}\n`);
    _redis = null;
  }
  return _redis;
}

// ─── Trust-proxy-aware IP extraction ───────────────────────────────────────

const PROXY_COUNT = Math.max(0, parseInt(process.env.TRUSTED_PROXY_COUNT ?? '1', 10));

function sanitizeOne(ip: string): string {
  const t = ip.trim();
  if (/^[0-9a-fA-F.:[\]]+$/.test(t) && t.length > 0 && t.length <= 45) return t;
  return 'unknown';
}

/**
 * Extract the real client IP from XFF/X-Real-IP, respecting TRUSTED_PROXY_COUNT.
 * With N trusted proxies, takes the Nth IP from the right in X-Forwarded-For.
 */
export function sanitizeIp(
  xff: string | null | undefined,
  real?: string | null | undefined,
): string {
  if (PROXY_COUNT === 0) return real ? sanitizeOne(real) : 'unknown';
  if (!xff) return real ? sanitizeOne(real) : 'unknown';
  const ips = xff.split(',').map(s => s.trim()).filter(Boolean);
  if (ips.length === 0) return real ? sanitizeOne(real) : 'unknown';
  const idx = Math.max(0, ips.length - PROXY_COUNT);
  return sanitizeOne(ips[idx]);
}

// ─── In-memory store ────────────────────────────────────────────────────────

interface Entry { count: number; resetAt: number }
const store = new Map<string, Entry>();

if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [k, v] of store) {
      if (v.resetAt < now) store.delete(k);
    }
  }, 60_000);
}

// ─── Public API ─────────────────────────────────────────────────────────────

export interface RateLimitOptions {
  windowMs: number;
  max: number;
  keyPrefix: string;
}

/** Returns an async check function. Call with `await`. */
export function rateLimit(opts: RateLimitOptions) {
  return async function check(ip: string): Promise<{ ok: boolean; retryAfterSec: number }> {
    const key = `rl:${opts.keyPrefix}:${ip}`;

    const r = await getRedis();
    if (r) {
      try {
        const count = (await r.eval(LUA_INCR, 1, key, String(opts.windowMs))) as number;
        if (count > opts.max) {
          const ttlMs = (await r.pttl(key)) as number;
          return { ok: false, retryAfterSec: Math.ceil(Math.max(ttlMs, 0) / 1000) };
        }
        return { ok: true, retryAfterSec: 0 };
      } catch {
        // Redis error — fall through to in-memory
      }
    }

    // In-memory fallback
    const now = Date.now();
    let entry = store.get(key);
    if (!entry || entry.resetAt < now) {
      entry = { count: 1, resetAt: now + opts.windowMs };
      store.set(key, entry);
      return { ok: true, retryAfterSec: 0 };
    }
    entry.count++;
    if (entry.count > opts.max) {
      return { ok: false, retryAfterSec: Math.ceil((entry.resetAt - now) / 1000) };
    }
    return { ok: true, retryAfterSec: 0 };
  };
}
