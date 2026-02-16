export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import { authOptions } from '../../../../lib/auth';
import { rateLimit, sanitizeIp } from '../../../../lib/rate-limit';
import { serverError } from '../../../../lib/api-error';
import { completeDayActive, PassError } from '../../../../lib/wellness-pass';

const limiter = rateLimit({ windowMs: 60_000, max: 20, keyPrefix: 'passes-complete-v2' });

const bodySchema = z.object({
  dayNumber: z.number().int().min(1).max(365).optional(),
});

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
  }

  const ip = sanitizeIp(
    req.headers.get('x-forwarded-for'),
    req.headers.get('x-real-ip'),
  );
  const rl = await limiter(ip);
  if (!rl.ok) {
    return NextResponse.json(
      { error: 'TOO_MANY_REQUESTS' },
      { status: 429, headers: { 'Retry-After': String(rl.retryAfterSec) } },
    );
  }

  const body = await req.json().catch(() => ({}));
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'VALIDATION' }, { status: 400 });
  }

  try {
    const { active, rewardCode } = await completeDayActive(
      session.user.id,
      parsed.data.dayNumber,
    );

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
        const { getActivePass } = await import('../../../../lib/wellness-pass');
        const active = await getActivePass(session.user.id);
        return NextResponse.json({ ok: true, active, rewardPromoCode: null }, {
          headers: { 'Cache-Control': 'no-store' },
        });
      } catch {
        // fall through
      }
    }

    return serverError('[PASSES_COMPLETE_V2]', e);
  }
}
