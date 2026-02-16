import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../../lib/auth';
import { prisma } from '../../../../lib/prizma';
import { serverError } from '../../../../lib/api-error';

function getDaysUntilBirthday(birthDate: Date): { daysUntil: number; isBirthday: boolean } {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  // This year's birthday
  let nextBirthday = new Date(today.getFullYear(), birthDate.getMonth(), birthDate.getDate());

  // If birthday already passed this year, check next year
  if (nextBirthday < today) {
    nextBirthday = new Date(today.getFullYear() + 1, birthDate.getMonth(), birthDate.getDate());
  }

  const diffMs = nextBirthday.getTime() - today.getTime();
  const daysUntil = Math.round(diffMs / (1000 * 60 * 60 * 24));

  // Birthday ±1 day grace
  const isBirthday = daysUntil <= 1 || daysUntil >= 364;

  return { daysUntil: daysUntil === 0 ? 0 : daysUntil, isBirthday };
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
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
      where: { one_claim_per_year: { userId: session.user.id, year: currentYear } },
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
    return serverError('[BDAY_STATUS]', e);
  }
}
