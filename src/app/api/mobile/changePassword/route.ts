import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prizma';
import { requireAuth, createCorsResponse } from '../../../../lib/jwt';
import bcrypt from 'bcrypt';
import { z } from 'zod';
import { logger } from '../../../../lib/logger';
import { rateLimit, sanitizeIp } from '../../../../lib/rate-limit';

const rl = rateLimit({ windowMs: 60_000, max: 5, keyPrefix: 'mobile-change-pwd' });

// Обработка OPTIONS для CORS preflight
export async function OPTIONS(request: NextRequest) {
  return createCorsResponse(request);
}

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(6, 'Минимум 6 символов'),
});

// POST - Изменить пароль
export async function POST(request: NextRequest) {
  const check = await rl(sanitizeIp(request.headers.get('x-forwarded-for')));
  if (!check.ok) return NextResponse.json({ error: 'Too many requests' }, { status: 429, headers: { 'Retry-After': String(check.retryAfterSec) } });

  const auth = requireAuth(request);

  if ('error' in auth) {
    return auth.error;
  }

  const { userId } = auth.payload;

  try {
    const body = await request.json();
    const parsed = changePasswordSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation error', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { currentPassword, newPassword } = parsed.data;

    // Получить пользователя
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        password: true,
        tokenVersion: true,
      },
    });

    if (!user || !user.password) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Проверить текущий пароль
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);

    if (!isCurrentPasswordValid) {
      logger.warn('[MOBILE_CHANGE_PASSWORD] Invalid current password attempt');
      return NextResponse.json(
        { error: 'Current password is incorrect' },
        { status: 401 }
      );
    }

    // Хешировать новый пароль
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Обновить пароль и увеличить tokenVersion (инвалидация всех старых токенов)
    await prisma.user.update({
      where: { id: userId },
      data: {
        password: hashedPassword,
        tokenVersion: (user.tokenVersion || 0) + 1,
        passwordUpdatedAt: new Date(),
      },
    });

    logger.info('[MOBILE_CHANGE_PASSWORD] Password changed successfully');

    return NextResponse.json({
      success: true,
      message: 'Пароль успешно изменен. Пожалуйста, войдите снова с новым паролем.',
    });
  } catch (error) {
    logger.error('[MOBILE_CHANGE_PASSWORD] Error:', error);
    return NextResponse.json(
      { error: 'Failed to change password' },
      { status: 500 }
    );
  }
}
