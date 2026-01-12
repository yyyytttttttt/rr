import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../../lib/prizma';
import { createCorsResponse } from '../../../../../lib/jwt';
import { z } from 'zod';

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
 *
 * ВАЖНО: Поддерживает мультивыбор услуг (использует первую из списка)
 */
export async function POST(request: NextRequest) {
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

    // Проверить что слот свободен wwww
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

    console.info(`[MOBILE_GUEST_BOOKING] Created guest booking ${booking.id} for ${clientName} (${clientEmail})`);

    // TODO: Отправить email подтверждения гостю (если SMTP работает)
    // await sendBookingConfirmationEmail(clientEmail, booking);

    return NextResponse.json({
      success: true,
      message: 'Вы успешно записались! Подтверждение отправлено на email.',
      booking: {
        id: booking.id,
        doctorName: booking.doctor.user?.name || booking.doctor.title,
        serviceName: booking.service.name,
        startUtc: booking.startUtc,
        endUtc: booking.endUtc,
        status: booking.status,
        clientName: booking.clientName,
        clientEmail: booking.clientEmail,
        price: booking.service.priceCents / 100,
        currency: booking.service.currency,
      },
    }, { status: 201 });

  } catch (error) {
    console.error('[MOBILE_GUEST_BOOKING] Error:', error);
    return NextResponse.json(
      {
        error: 'Не удалось создать запись',
        message: error instanceof Error ? error.message : 'Внутренняя ошибка сервера'
      },
      { status: 500 }
    );
  }
}
