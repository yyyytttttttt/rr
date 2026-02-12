import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../../lib/prizma';
import { createCorsResponse } from '../../../../../lib/jwt';
import { sendMail } from '../../../../../lib/mailer';
import { z } from 'zod';
import crypto from 'crypto';
import { logger } from '../../../../../lib/logger';
import { rateLimit, sanitizeIp } from '../../../../../lib/rate-limit';
import { serverErrorMsg } from '../../../../../lib/api-error';

const guestRateLimit = rateLimit({ windowMs: 60_000, max: 5, keyPrefix: 'mobile-guest-booking' });

// Обработка OPTIONS для CORS preflight
export async function OPTIONS(request: NextRequest) {
  return createCorsResponse(request);
}

// Схема валидации для гостевого бронирования
const guestBookingSchema = z.object({
  doctorId: z.string().min(1, 'Выберите врача'),
  serviceId: z.string().min(1, 'Выберите услугу'),
  start: z.string().datetime('Неверный формат даты'),
  clientName: z.string().min(2, 'Введите имя (минимум 2 символа)').max(100),
  clientEmail: z.string().email('Неверный формат email'),
  clientPhone: z.string()
    .regex(/^\+7 \(\d{3}\) \d{3}-\d{2}-\d{2}$/, 'Формат: +7 (999) 123-45-67')
    .optional()
    .or(z.literal('')),
  note: z.string().max(500, 'Примечание не должно превышать 500 символов').optional(),
});

/**
 * POST /api/mobile/bookings/guest
 * Создать гостевое бронирование БЕЗ регистрации (для мобильного приложения)
 * Публичный endpoint (не требует авторизации)
 */
export async function POST(request: NextRequest) {
  const ip = sanitizeIp(request.headers.get('x-forwarded-for'));
  const rl = await guestRateLimit(ip);
  if (!rl.ok) {
    return NextResponse.json(
      { error: 'Слишком много запросов. Повторите позже.' },
      { status: 429, headers: { 'Retry-After': String(rl.retryAfterSec) } }
    );
  }

  try {
    const body = await request.json();
    const parsed = guestBookingSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: 'Ошибка валидации данных',
          details: parsed.error.flatten().fieldErrors
        },
        { status: 400 }
      );
    }

    const { doctorId, serviceId, start, clientName, clientEmail, clientPhone, note } = parsed.data;
    const startUtc = new Date(start);

    // Получить информацию о докторе и услуге
    const [doctor, service] = await Promise.all([
      prisma.doctor.findUnique({
        where: { id: doctorId },
        select: {
          id: true,
          title: true,
          user: {
            select: { name: true }
          }
        }
      }),
      prisma.service.findUnique({
        where: { id: serviceId },
        select: {
          id: true,
          name: true,
          durationMin: true,
          priceCents: true,
          currency: true,
        }
      }),
    ]);

    if (!doctor) {
      return NextResponse.json(
        { error: 'Врач не найден' },
        { status: 404 }
      );
    }

    if (!service) {
      return NextResponse.json(
        { error: 'Услуга не найдена' },
        { status: 404 }
      );
    }

    // Рассчитать endUtc
    const durationMs = service.durationMin * 60 * 1000;
    const endUtc = new Date(startUtc.getTime() + durationMs);

    // Проверить что слот свободен
    const existingBooking = await prisma.booking.findFirst({
      where: {
        doctorId,
        startUtc: { lt: endUtc },
        endUtc: { gt: startUtc },
        status: { notIn: ['CANCELED'] },
      },
    });

    if (existingBooking) {
      return NextResponse.json(
        { error: 'Это время уже занято. Пожалуйста, выберите другое время.' },
        { status: 409 }
      );
    }

    // Создать гостевое бронирование (userId = null)
    const booking = await prisma.booking.create({
      data: {
        doctorId,
        serviceId,
        startUtc,
        endUtc,
        status: 'PENDING',
        userId: null, // Гостевое бронирование
        clientName,
        clientEmail,
        clientPhone: clientPhone || null,
        note: note || null,
      },
      include: {
        doctor: {
          include: {
            user: {
              select: { name: true, image: true },
            },
          },
        },
        service: {
          select: {
            name: true,
            priceCents: true,
            currency: true,
            durationMin: true,
          },
        },
      },
    });

    logger.debug('[MOBILE_GUEST_BOOKING] Guest booking created', { bookingId: booking.id });

    // Создать токен для подтверждения записи
    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 часа

    await prisma.verificationToken.create({
      data: {
        identifier: `booking:${booking.id}`,
        token: tokenHash,
        expires,
      },
    });

    // Сформировать ссылку для подтверждения
    const confirmLink = `${process.env.NEXTAUTH_URL}/confirm-booking?token=${rawToken}&bookingId=${booking.id}`;

    // Форматирование даты и времени
    const dateStr = new Date(booking.startUtc).toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
    const timeStr = new Date(booking.startUtc).toLocaleTimeString('ru-RU', {
      hour: '2-digit',
      minute: '2-digit',
    });

    // Отправить email подтверждения
    try {
      await sendMail({
        to: clientEmail,
        subject: 'Подтвердите запись на приём — Новая Я',
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <style>
              body { font-family: 'Manrope', Arial, sans-serif; line-height: 1.6; color: #2F2D28; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: #5C6744; color: white; padding: 30px; text-align: center; border-radius: 12px 12px 0 0; }
              .content { background: #FFFCF3; padding: 30px; border-radius: 0 0 12px 12px; }
              .booking-details { background: #F5F0E4; padding: 20px; border-radius: 10px; margin: 20px 0; }
              .booking-details p { margin: 8px 0; }
              .label { color: #636846; font-size: 14px; }
              .value { font-weight: 600; color: #4F5338; }
              .confirm-btn { display: inline-block; background: #5C6744; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; margin: 20px 0; font-weight: 600; }
              .confirm-btn:hover { background: #4F5338; }
              .footer { text-align: center; color: #636846; font-size: 12px; margin-top: 20px; }
              .warning { background: #FFF3CD; border: 1px solid #FFECB5; padding: 15px; border-radius: 8px; margin: 15px 0; color: #856404; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1 style="margin: 0; font-size: 24px;">Новая Я</h1>
                <p style="margin: 10px 0 0; opacity: 0.9;">Подтверждение записи</p>
              </div>
              <div class="content">
                <h2 style="color: #4F5338; margin-top: 0;">Здравствуйте, ${clientName}!</h2>
                <p>Вы записались на приём в клинику «Новая Я». Пожалуйста, подтвердите запись, нажав на кнопку ниже.</p>

                <div class="booking-details">
                  <p><span class="label">Услуга:</span> <span class="value">${booking.service.name}</span></p>
                  <p><span class="label">Специалист:</span> <span class="value">${booking.doctor.user?.name || booking.doctor.title}</span></p>
                  <p><span class="label">Дата:</span> <span class="value">${dateStr}</span></p>
                  <p><span class="label">Время:</span> <span class="value">${timeStr}</span></p>
                  <p><span class="label">Стоимость:</span> <span class="value">${(booking.service.priceCents / 100).toFixed(0)} ₽</span></p>
                </div>

                <div class="warning">
                  ⚠️ Для подтверждения записи нажмите на кнопку ниже. Ссылка действительна 24 часа.
                </div>

                <div style="text-align: center;">
                  <a href="${confirmLink}" class="confirm-btn">Подтвердить запись</a>
                </div>

                <p style="font-size: 13px; color: #636846;">
                  Если кнопка не работает, скопируйте ссылку:<br>
                  <a href="${confirmLink}" style="color: #5C6744; word-break: break-all;">${confirmLink}</a>
                </p>

                <div class="footer">
                  <p>Если вы не записывались на приём — просто проигнорируйте это письмо.</p>
                  <p>С уважением, команда «Новая Я»</p>
                </div>
              </div>
            </div>
          </body>
          </html>
        `,
      });
      logger.debug('[MOBILE_GUEST_BOOKING] Confirmation email sent');
    } catch (emailError: any) {
      logger.error('[MOBILE_GUEST_BOOKING] Failed to send confirmation email', emailError);
      // Не прерываем процесс - бронирование создано, но email не отправлен
    }

    return NextResponse.json({
      success: true,
      message: 'Запись создана! Проверьте email для подтверждения.',
      booking: {
        id: booking.id,
        doctorName: booking.doctor.user?.name || booking.doctor.title,
        serviceName: booking.service.name,
        startUtc: booking.startUtc,
        endUtc: booking.endUtc,
        status: booking.status,
        clientName: booking.clientName,
      },
    }, { status: 201 });

  } catch (error) {
    return serverErrorMsg('[MOBILE_GUEST_BOOKING]', error, 'Не удалось создать запись');
  }
}
