import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../../lib/prizma';
import { requireAuth, createCorsResponse } from '../../../../../lib/jwt';
import { z } from 'zod';

// Обработка OPTIONS для CORS preflight
export async function OPTIONS(request: NextRequest) {
  return createCorsResponse(request);
}

// GET - Получить профиль пользователя
export async function GET(request: NextRequest) {
  const auth = requireAuth(request);

  if ('error' in auth) {
    return auth.error;
  }

  const { userId } = auth.payload;

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        image: true,
        phone: true,
        birthDate: true,
        role: true,
        createdAt: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error('[MOBILE_PROFILE] GET error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch profile' },
      { status: 500 }
    );
  }
}

// PATCH - Обновить профиль пользователя
const updateProfileSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  phone: z.string().regex(/^\+7 \(\d{3}\) \d{3}-\d{2}-\d{2}$/).optional(),
  birthDate: z.string().regex(/^\d{2}\.\d{2}\.\d{4}$/).optional(),
});

export async function PATCH(request: NextRequest) {
  const auth = requireAuth(request);

  if ('error' in auth) {
    return auth.error;
  }

  const { userId } = auth.payload;

  try {
    const body = await request.json();
    const parsed = updateProfileSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation error', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const updates: any = {};

    if (parsed.data.name !== undefined) {
      updates.name = parsed.data.name;
    }

    if (parsed.data.phone !== undefined) {
      updates.phone = parsed.data.phone;
    }

    if (parsed.data.birthDate !== undefined) {
      // Преобразовать формат DD.MM.YYYY в Date
      const [day, month, year] = parsed.data.birthDate.split('.');
      updates.birthDate = new Date(`${year}-${month}-${day}`);
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: updates,
      select: {
        id: true,
        email: true,
        name: true,
        image: true,
        phone: true,
        birthDate: true,
        role: true,
      },
    });

    console.info(`[MOBILE_PROFILE] Updated profile for user ${userId}`);

    return NextResponse.json({ success: true, user });
  } catch (error) {
    console.error('[MOBILE_PROFILE] PATCH error:', error);
    return NextResponse.json(
      { error: 'Failed to update profile' },
      { status: 500 }
    );
  }
}
