// POST /api/bookings/quote — server-side price preview (no side effects)
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../../lib/auth';
import { calculateBookingQuote, QuoteError } from '../../../../lib/booking-quote';
import { rateLimit, sanitizeIp } from '../../../../lib/rate-limit';
import { serverError } from '../../../../lib/api-error';

const quoteLimiter = rateLimit({ windowMs: 60_000, max: 20, keyPrefix: 'booking-quote' });

const bodySchema = z.object({
  serviceIds: z.array(z.string().min(1)).min(1).max(10),
  promoCode: z.string().max(50).optional(),
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
  const rl = await quoteLimiter(ip);
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
    const quote = await calculateBookingQuote({
      serviceIds: parsed.data.serviceIds,
      promoCode: parsed.data.promoCode,
      userId: session.user.id,
    });

    return NextResponse.json(quote);
  } catch (e: unknown) {
    if (e instanceof QuoteError) {
      return NextResponse.json({ error: e.code, message: e.message }, { status: 400 });
    }
    return serverError('[BOOKING_QUOTE]', e);
  }
}
