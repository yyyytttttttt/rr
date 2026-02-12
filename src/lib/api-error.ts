/**
 * Safe error response helpers — never leak internal messages in production.
 * Import instead of inline NextResponse.json({ error, message: e.message }).
 */
import { NextResponse } from 'next/server';
import { logger } from './logger';

const isProd = process.env.NODE_ENV === 'production';

/**
 * Log the real error and return a sanitized 500 response.
 * @param tag   Log prefix, e.g. '[ADMIN_SERVICES]'
 * @param error Caught value
 */
export function serverError(tag: string, error: unknown): NextResponse {
  logger.error(tag, error);
  return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
}

/**
 * Same as serverError but for routes that want a custom user-facing message.
 */
export function serverErrorMsg(tag: string, error: unknown, userMsg: string): NextResponse {
  logger.error(tag, error);
  return NextResponse.json({ error: userMsg }, { status: 500 });
}
