import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../../../../lib/prizma";
import { requireAuth, createCorsResponse } from "../../../../../../lib/jwt";
import { z } from "zod";

// Обработка OPTIONS для CORS preflight
export async function OPTIONS(request: NextRequest) {
  return createCorsResponse(request);
}

const statusEnum = z.enum(["PENDING", "CONFIRMED", "CANCELED", "COMPLETED", "NO_SHOW"]);
const Body = z.object({
  bookingId: z.string().min(1, 'ID записи обязателен'),
  nextStatus: statusEnum,
  note: z.string().max(500, 'Примечание не должно превышать 500 символов').optional(),
});

// Тип статуса бронирования
type BookingStatus = "PENDING" | "CONFIRMED" | "CANCELED" | "COMPLETED" | "NO_SHOW";

// Допустимые переходы статусов
const ALLOWED_TRANSITIONS: Record<BookingStatus, Set<BookingStatus>> = {
  PENDING: new Set(["CONFIRMED", "CANCELED"]),
  CONFIRMED: new Set(["COMPLETED", "CANCELED", "NO_SHOW"]),
  COMPLETED: new Set([]), // Завершенную запись нельзя изменить
  CANCELED: new Set([]),  // Отмененную запись нельзя изменить
  NO_SHOW: new Set([]),   // NO_SHOW нельзя изменить
};

/**
 * POST /api/mobile/doctor/bookings/status
 * Изменение статуса записи врачом
 * Требует JWT авторизацию и роль DOCTOR
 */
export async function POST(req: NextRequest) {
  const auth = requireAuth(req);

  if ('error' in auth) {
    return auth.error;
  }

  const { userId, role } = auth.payload;

  // Проверка роли
  if (role !== 'DOCTOR' && role !== 'ADMIN') {
    return NextResponse.json(
      { error: 'Доступ запрещен. Требуется роль врача.' },
      { status: 403 }
    );
  }

  try {
    const raw = await req.json().catch(() => null);
    const parsed = Body.safeParse(raw);

    if (!parsed.success) {
      return NextResponse.json({
        error: "Ошибка валидации",
        details: parsed.error.flatten().fieldErrors
      }, { status: 400 });
    }

    const { bookingId, nextStatus, note } = parsed.data;

    // Получаем ID врача текущего пользователя
    const doctor = await prisma.doctor.findFirst({
      where: { userId },
      select: { id: true },
    });

    if (!doctor) {
      return NextResponse.json(
        { error: 'Профиль врача не найден' },
        { status: 404 }
      );
    }

    // Получаем запись
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      select: {
        id: true,
        doctorId: true,
        status: true,
        startUtc: true,
        endUtc: true,
        clientName: true,
        note: true,
        service: {
          select: { name: true }
        }
      },
    });

    if (!booking) {
      return NextResponse.json(
        { error: 'Запись не найдена' },
        { status: 404 }
      );
    }

    // Проверяем что это запись этого врача
    if (booking.doctorId !== doctor.id) {
      return NextResponse.json(
        { error: 'Доступ запрещен. Это запись другого врача.' },
        { status: 403 }
      );
    }

    // Проверяем допустимость перехода статуса
    if (!ALLOWED_TRANSITIONS[booking.status].has(nextStatus)) {
      return NextResponse.json({
        error: "Недопустимый переход статуса",
        currentStatus: booking.status,
        requestedStatus: nextStatus,
        allowedStatuses: Array.from(ALLOWED_TRANSITIONS[booking.status])
      }, { status: 400 });
    }

    // Обновляем статус
    const updated = await prisma.booking.update({
      where: { id: bookingId },
      data: {
        status: nextStatus,
        note: note || booking.note, // Сохраняем старое примечание если новое не указано
      },
      select: {
        id: true,
        status: true,
        startUtc: true,
        endUtc: true,
        clientName: true,
        clientEmail: true,
        clientPhone: true,
        note: true,
        service: {
          select: {
            name: true,
            priceCents: true,
            currency: true,
            durationMin: true,
          }
        }
      },
    });

    console.log(`[MOBILE_DOCTOR_STATUS] Booking ${bookingId} status changed: ${booking.status} -> ${nextStatus} by doctor ${doctor.id}`);

    return NextResponse.json({
      success: true,
      message: 'Статус записи успешно обновлен',
      booking: updated
    });

  } catch (error) {
    console.error('[MOBILE_DOCTOR_STATUS] Error:', error);
    return NextResponse.json(
      {
        error: 'Ошибка при изменении статуса записи',
        message: error instanceof Error ? error.message : 'Внутренняя ошибка сервера'
      },
      { status: 500 }
    );
  }
}
