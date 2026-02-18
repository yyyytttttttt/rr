import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../../lib/prizma';
import { requireAuth, createCorsResponse } from '../../../../../lib/jwt';
import { rateLimit, sanitizeIp } from '../../../../../lib/rate-limit';
import { serverError } from '../../../../../lib/api-error';

const limiter = rateLimit({ windowMs: 60_000, max: 5, keyPrefix: 'mob-bday-claim' });

export async function OPTIONS(request: NextRequest) {
  return createCorsResponse(request);
}

function isBirthdayWindow(birthDate: Date): boolean {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  let nextBirthday = new Date(today.getFullYear(), birthDate.getMonth(), birthDate.getDate());
  if (nextBirthday < today) {
    nextBirthday = new Date(today.getFullYear() + 1, birthDate.getMonth(), birthDate.getDate());
  }

  const diffMs = nextBirthday.getTime() - today.getTime();
  const daysUntil = Math.round(diffMs / (1000 * 60 * 60 * 24));
  return daysUntil <= 1 || daysUntil >= 364;
}

export async function POST(request: NextRequest) {
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

  const auth = requireAuth(request);
  if ('error' in auth) return auth.error;
  const { userId } = auth.payload;

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { birthDate: true },
    });

    if (!user?.birthDate) {
      return NextResponse.json(
        { error: 'Укажите дату рождения в настройках профиля' },
        { status: 400 },
      );
    }

    if (!isBirthdayWindow(user.birthDate)) {
      return NextResponse.json(
        { error: 'Бонус доступен только в день рождения' },
        { status: 400 },
      );
    }

    const currentYear = new Date().getFullYear();

    const existingClaim = await prisma.birthdayClaim.findUnique({
      where: { one_claim_per_year: { userId, year: currentYear } },
      include: {
        promoCode: {
          select: { code: true, validUntil: true, discountPercent: true },
        },
      },
    });

    if (existingClaim) {
      return NextResponse.json({
        ok: true,
        promoCode: existingClaim.promoCode.code,
        validUntil: existingClaim.promoCode.validUntil?.toISOString() ?? null,
        discountPercent: existingClaim.promoCode.discountPercent,
        message: 'Вы уже получили бонус в этом году',
      });
    }

    const code = `BDAY-${userId.slice(0, 6).toUpperCase()}-${currentYear}`;
    const validUntil = new Date();
    validUntil.setDate(validUntil.getDate() + 30);

    const result = await prisma.$transaction(async (tx) => {
      const promoCode = await tx.promoCode.create({
        data: {
          code,
          discountPercent: 5,
          currency: 'RUB',
          validFrom: new Date(),
          validUntil,
          maxUses: 1,
          usedCount: 0,
          isActive: true,
          description: `День рождения ${currentYear} — скидка 5%`,
        },
      });

      await tx.birthdayClaim.create({
        data: { userId, year: currentYear, promoCodeId: promoCode.id },
      });

      return promoCode;
    });

    return NextResponse.json({
      ok: true,
      promoCode: result.code,
      validUntil: result.validUntil?.toISOString() ?? null,
      discountPercent: result.discountPercent,
      message: 'С днём рождения! Ваш промокод активирован',
    });
  } catch (e) {
    return serverError('[MOB_BDAY_CLAIM]', e);
  }
}
