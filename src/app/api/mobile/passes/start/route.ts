export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAuth, createCorsResponse } from '../../../../../lib/jwt';
import { rateLimit, sanitizeIp } from '../../../../../lib/rate-limit';
import { serverError } from '../../../../../lib/api-error';
import { startPass, PassError } from '../../../../../lib/wellness-pass';

const limiter = rateLimit({ windowMs: 60_000, max: 5, keyPrefix: 'mob-passes-start' });

const bodySchema = z.object({
  slug: z.string().min(1).max(100),
});

export async function OPTIONS(request: NextRequest) {
  return createCorsResponse(request);
}

export async function POST(request: NextRequest) {
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

  const body = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation error', details: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  try {
    const result = await startPass(userId, parsed.data.slug);
    return NextResponse.json({ ok: true, ...result }, {
      status: 201,
      headers: { 'Cache-Control': 'no-store' },
    });
  } catch (e) {
    if (e instanceof PassError) {
      const statusMap: Record<string, number> = {
        PASS_NOT_FOUND: 404,
        PASS_ALREADY_COMPLETED: 409,
        PASS_ALREADY_ACTIVE: 409,
      };
      return NextResponse.json(
        { error: e.code, message: e.message },
        { status: statusMap[e.code] ?? 400 },
      );
    }
    return serverError('[MOB_PASSES_START]', e);
  }
}
