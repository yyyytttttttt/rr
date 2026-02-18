import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../../lib/prizma';
import { requireAuth, createCorsResponse } from '../../../../../lib/jwt';
import { serverError } from '../../../../../lib/api-error';

export async function OPTIONS(request: NextRequest) {
  return createCorsResponse(request);
}

function getDaysUntilBirthday(birthDate: Date): { daysUntil: number; isBirthday: boolean } {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  let nextBirthday = new Date(today.getFullYear(), birthDate.getMonth(), birthDate.getDate());
  if (nextBirthday < today) {
    nextBirthday = new Date(today.getFullYear() + 1, birthDate.getMonth(), birthDate.getDate());
  }

  const diffMs = nextBirthday.getTime() - today.getTime();
  const daysUntil = Math.round(diffMs / (1000 * 60 * 60 * 24));
  const isBirthday = daysUntil <= 1 || daysUntil >= 364;

  return { daysUntil: daysUntil === 0 ? 0 : daysUntil, isBirthday };
}

export async function GET(request: NextRequest) {
  const auth = requireAuth(request);
  if ('error' in auth) return auth.error;
  const { userId } = auth.payload;

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { birthDate: true },
    });

    if (!user?.birthDate) {
      return NextResponse.json({
        hasBirthDate: false,
        daysUntil: null,
        isBirthday: false,
        claimed: false,
        promoCode: null,
      });
    }

    const { daysUntil, isBirthday } = getDaysUntilBirthday(user.birthDate);
    const currentYear = new Date().getFullYear();

    const existingClaim = await prisma.birthdayClaim.findUnique({
      where: { one_claim_per_year: { userId, year: currentYear } },
      include: {
        promoCode: {
          select: { code: true, validUntil: true, discountPercent: true },
        },
      },
    });

    return NextResponse.json({
      hasBirthDate: true,
      daysUntil,
      isBirthday,
      claimed: !!existingClaim,
      promoCode: existingClaim
        ? {
            code: existingClaim.promoCode.code,
            validUntil: existingClaim.promoCode.validUntil?.toISOString() ?? null,
            discountPercent: existingClaim.promoCode.discountPercent,
          }
        : null,
    });
  } catch (e) {
    return serverError('[MOB_BDAY_STATUS]', e);
  }
}
