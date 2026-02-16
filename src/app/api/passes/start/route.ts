export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import { authOptions } from '../../../../lib/auth';
import { rateLimit, sanitizeIp } from '../../../../lib/rate-limit';
import { serverError } from '../../../../lib/api-error';
import { startPass, PassError } from '../../../../lib/wellness-pass';

const limiter = rateLimit({ windowMs: 60_000, max: 5, keyPrefix: 'passes-start' });

const bodySchema = z.object({
  slug: z.string().min(1).max(100),
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

  const body = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'VALIDATION' }, { status: 400 });
  }

  try {
    const result = await startPass(session.user.id, parsed.data.slug);
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
    return serverError('[PASSES_START]', e);
  }
}
