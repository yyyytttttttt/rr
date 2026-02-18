export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAuth, createCorsResponse } from '../../../../../lib/jwt';
import { rateLimit, sanitizeIp } from '../../../../../lib/rate-limit';
import { serverError } from '../../../../../lib/api-error';
import { completeDayActive, getActivePass, PassError } from '../../../../../lib/wellness-pass';

const limiter = rateLimit({ windowMs: 60_000, max: 20, keyPrefix: 'mob-passes-complete' });

const bodySchema = z.object({
  dayNumber: z.number().int().min(1).max(365).optional(),
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

  const body = await request.json().catch(() => ({}));
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation error', details: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  try {
    const { active, rewardCode } = await completeDayActive(userId, parsed.data.dayNumber);
    return NextResponse.json({
      ok: true,
      active,
      rewardPromoCode: rewardCode,
    }, {
      headers: { 'Cache-Control': 'no-store' },
    });
  } catch (e) {
    if (e instanceof PassError) {
      const statusMap: Record<string, number> = {
        PASS_NOT_ACTIVE: 409,
        NOT_ENROLLED: 404,
        ALREADY_FINISHED: 409,
        WRONG_DAY: 409,
        DAY_LOCKED: 409,
        DAY_NOT_FOUND: 404,
      };
      return NextResponse.json(
        { error: e.code, message: e.message },
        { status: statusMap[e.code] ?? 400 },
      );
    }

    // P2002 = unique constraint (idempotent: day already completed in race)
    if (typeof e === 'object' && e !== null && 'code' in e && (e as { code: string }).code === 'P2002') {
      try {
        const active = await getActivePass(userId);
        return NextResponse.json({ ok: true, active, rewardPromoCode: null }, {
          headers: { 'Cache-Control': 'no-store' },
        });
      } catch {
        // fall through
      }
    }

    return serverError('[MOB_PASSES_COMPLETE]', e);
  }
}
