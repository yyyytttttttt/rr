export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../../lib/prizma";
import { createCorsResponse } from "../../../../lib/jwt";
import crypto from "crypto";
import { sendMail } from "../../../../lib/mailer";
import { z } from "zod";
import { logger } from "../../../../lib/logger";
import { rateLimit, sanitizeIp } from "../../../../lib/rate-limit";

const rl = rateLimit({ windowMs: 60_000, max: 3, keyPrefix: 'mobile-pwd-reset' });

// Обработка OPTIONS для CORS preflight
export async function OPTIONS(request: NextRequest) {
  return createCorsResponse(request);
}

const schema = z.object({
  email: z.string().email('Неверный формат email')
});

const TTL_MIN = Number(process.env.TTL_MIN || 60); // По умолчанию 60 минут

/**
 * POST /api/mobile/request-password-reset
 * Запрос на сброс пароля для мобильного приложения
 */
export async function POST(req: NextRequest) {
  const check = await rl(sanitizeIp(req.headers.get('x-forwarded-for')));
  if (!check.ok) return NextResponse.json({ error: 'Too many requests' }, { status: 429, headers: { 'Retry-After': String(check.retryAfterSec) } });

  try {
    const body = await req.json().catch(() => null);
    const parsed = schema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Ошибка валидации",
          details: parsed.error.flatten().fieldErrors
        },
        { status: 400 }
      );
    }

    const email = parsed.data.email.toLowerCase();

    // Проверяем существует ли пользователь
    const user = await prisma.user.findUnique({
      where: { email },
      select: { email: true, password: true, name: true }
    });

    // Для безопасности всегда возвращаем успех, даже если пользователь не найден
    if (!user) {
      logger.debug('[MOBILE_PASSWORD_RESET] User not found');
      return NextResponse.json({
        success: true,
        message: "Если email существует, на него отправлена ссылка для сброса пароля"
      });
    }

    // Если у пользователя нет пароля (OAuth), не даем сброс
    if (!user.password) {
      logger.debug('[MOBILE_PASSWORD_RESET] No password set (OAuth user)');
      return NextResponse.json({
        success: true,
        message: "Если email существует, на него отправлена ссылка для сброса пароля"
      });
    }

    // Генерация токена сброса
    const raw = crypto.randomBytes(32).toString("hex");
    const tokenHash = crypto.createHash("sha256").update(raw).digest("hex");
    const expires = new Date(Date.now() + TTL_MIN * 60 * 1000);

    // Удаляем старые токены и создаем новый
    await prisma.$transaction(async (tx) => {
      await tx.passwordResetToken.deleteMany({ where: { identifier: email } });
      await tx.passwordResetToken.create({
        data: { identifier: email, token: tokenHash, expires }
      });
    });

    // Формируем ссылку для сброса пароля
    const link = `${process.env.NEXTAUTH_URL}/reset-password?email=${encodeURIComponent(email)}&token=${raw}`;

    // Отправка email
    try {
      await sendMail({
        to: email,
        subject: 'Сброс пароля',
        html: `
          <p>Здравствуйте${user.name ? ', ' + user.name : ''}!</p>
          <p>Вы запросили сброс пароля. Для продолжения перейдите по ссылке:</p>
          <p><a href="${link}">${link}</a></p>
          <p>Ссылка активна ${TTL_MIN} минут.</p>
          <p>Если вы не запрашивали сброс пароля — проигнорируйте это письмо.</p>
        `
      });

      logger.debug('[MOBILE_PASSWORD_RESET] Reset email sent');
    } catch (e) {
      logger.error('[MOBILE_PASSWORD_RESET] Mail send error', e);
      // Не выбрасываем ошибку для безопасности
    }

    return NextResponse.json({
      success: true,
      message: "Если email существует, на него отправлена ссылка для сброса пароля"
    });

  } catch (error) {
    logger.error('[MOBILE_PASSWORD_RESET] Error', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
