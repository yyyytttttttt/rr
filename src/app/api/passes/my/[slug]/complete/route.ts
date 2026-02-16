/** @deprecated Use /api/passes/complete instead */
export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import { authOptions } from '../../../../../../lib/auth';
import { rateLimit, sanitizeIp } from '../../../../../../lib/rate-limit';
import { serverError } from '../../../../../../lib/api-error';
import { completeDay, PassError } from '../../../../../../lib/wellness-pass';

const limiter = rateLimit({ windowMs: 60_000, max: 10, keyPrefix: 'passes-complete' });

const bodySchema = z.object({
  dayNumber: z.number().int().min(1).max(365),
});

export async function POST(req: Request, { params }: { params: Promise<{ slug: string }> }) {
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

  const body = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'VALIDATION' }, { status: 400 });
  }

  try {
    const { slug } = await params;
    const { dayNumber } = parsed.data;
    const { detail, rewardCode } = await completeDay(session.user.id, slug, dayNumber);

    return NextResponse.json({
      ok: true,
      ...detail,
      rewardPromoCode: rewardCode ?? detail.rewardPromoCode,
    });
  } catch (e) {
    if (e instanceof PassError) {
      const statusMap: Record<string, number> = {
        PASS_NOT_FOUND: 404,
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

    // P2002 = unique constraint violation (idempotent: day already completed)
    if (typeof e === 'object' && e !== null && 'code' in e && (e as { code: string }).code === 'P2002') {
      // Return current state instead of error (idempotent)
      try {
        const { slug } = await params;
        const { getUserPassDetail } = await import('../../../../../../lib/wellness-pass');
        const detail = await getUserPassDetail(session.user.id, slug);
        if (detail) {
          return NextResponse.json({ ok: true, ...detail });
        }
      } catch {
        // fall through to serverError
      }
    }

    return serverError('[PASSES_COMPLETE]', e);
  }
}
