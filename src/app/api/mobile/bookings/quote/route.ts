import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAuth, createCorsResponse } from '../../../../../lib/jwt';
import { rateLimit, sanitizeIp } from '../../../../../lib/rate-limit';
import { serverError } from '../../../../../lib/api-error';
import { calculateBookingQuote, QuoteError } from '../../../../../lib/booking-quote';

const limiter = rateLimit({ windowMs: 60_000, max: 20, keyPrefix: 'mob-booking-quote' });

const bodySchema = z.object({
  serviceIds: z.array(z.string().min(1)).min(1).max(10),
  promoCode: z.string().max(50).optional(),
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
    const quote = await calculateBookingQuote({
      serviceIds: parsed.data.serviceIds,
      promoCode: parsed.data.promoCode,
      userId,
    });
    return NextResponse.json(quote);
  } catch (e) {
    if (e instanceof QuoteError) {
      return NextResponse.json(
        { error: e.code, message: e.message },
        { status: 400 },
      );
    }
    return serverError('[MOB_BOOKING_QUOTE]', e);
  }
}
