export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../../lib/auth';
import { rateLimit, sanitizeIp } from '../../../../lib/rate-limit';
import { serverError } from '../../../../lib/api-error';
import { getCatalog } from '../../../../lib/wellness-pass';

const limiter = rateLimit({ windowMs: 60_000, max: 30, keyPrefix: 'passes-catalog' });

export async function GET(req: Request) {
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

  try {
    const catalog = await getCatalog(session.user.id);
    return NextResponse.json({ passes: catalog }, {
      headers: { 'Cache-Control': 'no-store' },
    });
  } catch (e) {
    return serverError('[PASSES_CATALOG]', e);
  }
}
