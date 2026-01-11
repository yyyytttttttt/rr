export const runtime = 'nodejs';
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../../lib/prizma";
import { createCorsResponse } from "../../../../lib/jwt";
import bcrypt from "bcrypt";
import { z } from "zod";
import crypto from "crypto";
import { sendMail } from '../../../../lib/mailer';

// Обработка OPTIONS для CORS preflight
export async function OPTIONS(request: NextRequest) {
  return createCorsResponse(request);
}

const schema = z.object({
  email: z.string().trim().email('Неверный формат email'),
  password: z.string().min(6, 'Пароль должен содержать минимум 6 символов'),
  name: z.string().trim().min(1, 'Введите имя').max(50, 'Имя слишком длинное').optional(),
  phone: z.string().regex(/^\+7 \(\d{3}\) \d{3}-\d{2}-\d{2}$/, 'Формат: +7 (999) 123-45-67').optional(),
  birthDate: z.string().regex(/^\d{2}\.\d{2}\.\d{4}$/, 'Формат: ДД.ММ.ГГГГ').optional(),
});

/**
 * POST /api/mobile/register
 * Регистрация нового пользователя для мобильного приложения
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);

    const parse = schema.safeParse(body);
    if (!parse.success) {
      return NextResponse.json(
        {
          error: "Ошибка валидации данных",
          details: parse.error.flatten().fieldErrors
        },
        { status: 400 }
      );
    }

    const { email, password, name, phone, birthDate } = parse.data;
    const normEmail = email.toLowerCase();

    // Проверка: уже есть такой email?
    const existing = await prisma.user.findUnique({ where: { email: normEmail } });
    if (existing) {
      return NextResponse.json(
        { error: "Этот email уже используется" },
        { status: 409 }
      );
    }

    // Преобразование даты из ДД.ММ.ГГГГ в ISO
    let birthDateISO: Date | null = null;
    if (birthDate) {
      const [day, month, year] = birthDate.split('.');
      birthDateISO = new Date(`${year}-${month}-${day}`);
    }

    // Хэш пароля и создание пользователя
    const hash = await bcrypt.hash(password, 11);
    const user = await prisma.user.create({
      data: {
        email: normEmail,
        password: hash,
        name: name ?? null,
        phone: phone ?? null,
        birthDate: birthDateISO,
        role: "USER",
        emailVerified: null,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
      }
    });

    // Создание токена верификации
    const raw = crypto.randomBytes(32).toString("hex");
    const tokenHash = crypto.createHash('sha256').update(raw).digest('hex');
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 часа

    await prisma.verificationToken.create({
      data: {
        identifier: normEmail,
        token: tokenHash,
        expires
      }
    });

    // Отправка письма с подтверждением
    const link = `${process.env.NEXTAUTH_URL}/verify?token=${raw}&email=${encodeURIComponent(email)}`;

    try {
      await sendMail({
        to: email,
        subject: 'Подтвердите e-mail',
        html: `
          <p>Здравствуйте${name ? ', ' + name : ''}!</p>
          <p>Спасибо за регистрацию. Пожалуйста, подтвердите почту, перейдя по ссылке:</p>
          <p><a href="${link}">${link}</a></p>
          <p>Ссылка активна 24 часа. Если вы не регистрировались — игнорируйте это письмо.</p>
        `,
      });

      console.log(`[MOBILE_REGISTER] Verification email sent to ${email}`);
    } catch (e) {
      console.error("[MOBILE_REGISTER] Mail send error:", e);
      // НЕ возвращаем ошибку, т.к. пользователь уже создан
      // Можно добавить возможность повторной отправки через /api/mobile/resend
    }

    return NextResponse.json({
      success: true,
      message: "Регистрация успешна! Проверьте email для подтверждения.",
      needVerify: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      }
    }, { status: 201 });

  } catch (error) {
    console.error('[MOBILE_REGISTER] Error:', error);
    return NextResponse.json(
      {
        error: 'Ошибка при регистрации',
        message: error instanceof Error ? error.message : 'Внутренняя ошибка сервера'
      },
      { status: 500 }
    );
  }
}
