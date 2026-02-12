export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../../lib/prizma";
import { createCorsResponse } from "../../../../lib/jwt";
import crypto from "crypto";
import { sendMail } from "../../../../lib/mailer";
import { z } from "zod";
import { logger } from "../../../../lib/logger";
import { rateLimit, sanitizeIp } from "../../../../lib/rate-limit";

const rl = rateLimit({ windowMs: 60_000, max: 3, keyPrefix: 'mobile-resend' });

// Обработка OPTIONS для CORS preflight
export async function OPTIONS(request: NextRequest) {
  return createCorsResponse(request);
}

const schema = z.object({
  email: z.string().email('Неверный формат email'),
});

/**
 * POST /api/mobile/resend
 * Повторная отправка письма с подтверждением email
 */
export async function POST(req: NextRequest) {
  const check = await rl(sanitizeIp(req.headers.get('x-forwarded-for')));
  if (!check.ok) return NextResponse.json({ error: 'Too many requests' }, { status: 429, headers: { 'Retry-After': String(check.retryAfterSec) } });

  try {
    const body = await req.json().catch(() => null);
    const parsed = schema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({
        error: "Ошибка валидации",
        details: parsed.error.flatten().fieldErrors
      }, { status: 400 });
    }

    const normalEmail = parsed.data.email.trim().toLowerCase();

    // Проверяем существование пользователя
    const user = await prisma.user.findUnique({
      where: { email: normalEmail },
      select: { emailVerified: true, name: true },
    });

    // Для безопасности всегда возвращаем успех
    if (!user) {
      logger.debug('[MOBILE_RESEND] User not found');
      return NextResponse.json({
        success: true,
        message: "Если email существует и не подтвержден, письмо отправлено"
      });
    }

    // Если email уже подтвержден
    if (user.emailVerified) {
      return NextResponse.json({
        error: 'Электронная почта уже подтверждена',
        message: 'Ваш email уже подтвержден. Вы можете войти в приложение.'
      }, { status: 409 });
    }

    // Удаляем старые токены верификации
    await prisma.verificationToken.deleteMany({
      where: { identifier: normalEmail },
    });

    // Создаем новый токен
    const raw = crypto.randomBytes(32).toString("hex");
    const tokenHash = crypto.createHash("sha256").update(raw).digest("hex");
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 часа

    await prisma.verificationToken.create({
      data: { identifier: normalEmail, token: tokenHash, expires },
    });

    // Формируем ссылку для подтверждения
    const link = `${process.env.NEXTAUTH_URL}/verify?token=${raw}&email=${encodeURIComponent(normalEmail)}`;

    // Отправляем email
    try {
      await sendMail({
        to: normalEmail,
        subject: "Подтвердите e-mail",
        html: `
          <p>Здравствуйте${user.name ? ', ' + user.name : ''}!</p>
          <p>Подтвердите вашу электронную почту, перейдя по ссылке:</p>
          <p><a href="${link}">${link}</a></p>
          <p>Ссылка активна 24 часа.</p>
          <p>Если вы не запрашивали подтверждение — проигнорируйте это письмо.</p>
        `,
      });

      logger.debug('[MOBILE_RESEND] Verification email resent');
    } catch (e) {
      logger.error('[MOBILE_RESEND] Mail send error', e);
      return NextResponse.json({
        error: 'Ошибка отправки email',
        message: 'Не удалось отправить письмо. Попробуйте позже.'
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: "Письмо с подтверждением отправлено. Проверьте почту."
    });

  } catch (error) {
    logger.error('[MOBILE_RESEND] Error', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
