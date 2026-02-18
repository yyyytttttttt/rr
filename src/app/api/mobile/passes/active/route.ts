export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, createCorsResponse } from '../../../../../lib/jwt';
import { rateLimit, sanitizeIp } from '../../../../../lib/rate-limit';
import { serverError } from '../../../../../lib/api-error';
import { getActivePass } from '../../../../../lib/wellness-pass';

const limiter = rateLimit({ windowMs: 60_000, max: 30, keyPrefix: 'mob-passes-active' });

export async function OPTIONS(request: NextRequest) {
  return createCorsResponse(request);
}

export async function GET(request: NextRequest) {
  const auth = requireAuth(request);
  if ('error' in auth) return auth.error;
  const { userId } = auth.payload;

  const ip = sanitizeIp(
    request.headers.get('x-forwarded-for'),
    request.headers.get('x-real-ip'),
  );
  const rl = await limiter(ip);
  if (!rl.ok) {
    return NextResponse.json(
      { error: 'Too many requests' },
      { status: 429, headers: { 'Retry-After': String(rl.retryAfterSec) } },
    );
  }

  try {
    const active = await getActivePass(userId);
    return NextResponse.json({ active }, {
      headers: { 'Cache-Control': 'no-store' },
    });
  } catch (e) {
    return serverError('[MOB_PASSES_ACTIVE]', e);
  }
}
