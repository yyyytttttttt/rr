export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../../lib/prizma";
import { createCorsResponse } from "../../../../lib/jwt";
import { z } from "zod";
import bcrypt from "bcrypt";
import crypto from "crypto";

// Обработка OPTIONS для CORS preflight
export async function OPTIONS(request: NextRequest) {
  return createCorsResponse(request);
}

const schema = z.object({
  email: z.string().email('Неверный формат email'),
  token: z.string().min(10, 'Неверный токен'),
  password: z.string().min(6, 'Пароль должен содержать минимум 6 символов'),
});

/**
 * POST /api/mobile/reset-password
 * Сброс пароля по токену из email для мобильного приложения
 * NOTE: Не требует старый пароль, так как пользователь его забыл
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    const parsed = schema.safeParse(body);

    if (!parsed.success) {
      console.error("[MOBILE_RESET_PASSWORD] Validation failed:", parsed.error.issues);
      return NextResponse.json({
        error: "Ошибка валидации",
        details: parsed.error.flatten().fieldErrors
      }, { status: 400 });
    }

    const email = parsed.data.email.toLowerCase();
    const raw = parsed.data.token;
    const newPassword = parsed.data.password;

    // Хэшируем токен для поиска в базе
    const tokenHash = crypto.createHash("sha256").update(raw).digest("hex");

    // Ищем токен сброса
    const rec = await prisma.passwordResetToken.findFirst({
      where: { identifier: email, token: tokenHash },
    });

    if (!rec) {
      console.log(`[MOBILE_RESET_PASSWORD] Invalid token for ${email}`);
      return NextResponse.json({
        error: "Неверный токен сброса пароля"
      }, { status: 400 });
    }

    // Проверяем срок действия токена
    if (rec.expires < new Date()) {
      await prisma.passwordResetToken.deleteMany({
        where: { identifier: email },
      });
      console.log(`[MOBILE_RESET_PASSWORD] Expired token for ${email}`);
      return NextResponse.json({
        error: "Токен сброса пароля истек. Запросите новый."
      }, { status: 400 });
    }

    // Проверяем существование пользователя
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, email: true, password: true, tokenVersion: true }
    });

    if (!user) {
      console.log(`[MOBILE_RESET_PASSWORD] User not found: ${email}`);
      return NextResponse.json({
        error: "Пользователь не найден"
      }, { status: 404 });
    }

    // Проверяем, что новый пароль отличается от старого (если есть старый)
    if (user.password && await bcrypt.compare(newPassword, user.password)) {
      return NextResponse.json({
        error: "Новый пароль не может совпадать со старым"
      }, { status: 400 });
    }

    // Хэшируем новый пароль
    const hash = await bcrypt.hash(newPassword, 12);

    // Обновляем пароль и инвалидируем все сессии (tokenVersion)
    await prisma.$transaction([
      prisma.user.update({
        where: { email },
        data: {
          password: hash,
          passwordUpdatedAt: new Date(),
          tokenVersion: (user.tokenVersion || 0) + 1, // Инвалидируем все JWT токены
        },
      }),
      prisma.passwordResetToken.deleteMany({
        where: { identifier: email },
      }),
    ]);

    console.log(`[MOBILE_RESET_PASSWORD] Password reset successful for ${email}`);

    return NextResponse.json({
      success: true,
      message: "Пароль успешно изменен. Войдите с новым паролем."
    });

  } catch (error) {
    console.error('[MOBILE_RESET_PASSWORD] Error:', error);
    return NextResponse.json(
      {
        error: 'Ошибка при сбросе пароля',
        message: error instanceof Error ? error.message : 'Внутренняя ошибка сервера'
      },
      { status: 500 }
    );
  }
}
