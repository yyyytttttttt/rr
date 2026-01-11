import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../../../lib/prizma";
import { requireAuth, createCorsResponse } from "../../../../../lib/jwt";
import { generateOccurrences } from "../../../../../lib/rrule";
import { z } from "zod";

// Обработка OPTIONS для CORS preflight
export async function OPTIONS(request: NextRequest) {
  return createCorsResponse(request);
}

const querySchema = z.object({
  from: z.string().datetime('Неверный формат даты from'),
  to: z.string().datetime('Неверный формат даты to'),
});

/**
 * GET /api/mobile/doctor/calendar
 * Получение календаря врача (расписание, записи, исключения, блокировки)
 * Требует JWT авторизацию и роль DOCTOR
 */
export async function GET(req: NextRequest) {
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
    const url = new URL(req.url);
    const parsed = querySchema.safeParse({
      from: url.searchParams.get("from"),
      to: url.searchParams.get("to"),
    });

    if (!parsed.success) {
      return NextResponse.json({
        error: "Ошибка валидации параметров",
        details: parsed.error.flatten().fieldErrors
      }, { status: 400 });
    }

    const { from, to } = parsed.data;
    const fromDate = new Date(from);
    const toDate = new Date(to);

    // Получаем ID врача текущего пользователя
    const doctor = await prisma.doctor.findFirst({
      where: { userId },
      select: { id: true, tzid: true },
    });

    if (!doctor) {
      return NextResponse.json(
        { error: 'Профиль врача не найден' },
        { status: 404 }
      );
    }

    // Загружаем все данные календаря параллельно
    const [schedules, openings, exceptions, bookings, unavailabilities] = await Promise.all([
      // Расписания (recurring)
      prisma.schedule.findMany({
        where: { doctorId: doctor.id },
        select: {
          id: true,
          byWeekday: true,
          startTime: true,
          endTime: true,
        },
      }),
      // Доступные слоты (openings)
      prisma.opening.findMany({
        where: {
          doctorId: doctor.id,
          startUtc: { lt: toDate },
          endUtc: { gt: fromDate }
        },
        orderBy: { startUtc: "asc" },
        select: { id: true, startUtc: true, endUtc: true },
      }),
      // Исключения (exceptions) - DEPRECATED, используйте unavailability
      prisma.exception.findMany({
        where: {
          doctorId: doctor.id,
          startUtc: { lt: toDate },
          endUtc: { gt: fromDate }
        },
        orderBy: { startUtc: "asc" },
        select: { id: true, startUtc: true, endUtc: true, reason: true },
      }),
      // Записи (bookings)
      prisma.booking.findMany({
        where: {
          doctorId: doctor.id,
          startUtc: { lt: toDate },
          endUtc: { gt: fromDate }
        },
        orderBy: { startUtc: "asc" },
        select: {
          id: true,
          startUtc: true,
          endUtc: true,
          status: true,
          clientName: true,
          clientEmail: true,
          clientPhone: true,
          note: true,
          service: {
            select: {
              name: true,
              durationMin: true,
              priceCents: true,
              currency: true,
            }
          },
          user: {
            select: {
              name: true,
              email: true,
              phone: true,
            }
          },
        },
      }),
      // Блокировки (unavailabilities)
      prisma.unavailability.findMany({
        where: {
          doctorId: doctor.id,
          OR: [
            // Обычные блокировки в диапазоне
            { start: { lt: toDate }, end: { gt: fromDate } },
            // Повторяющиеся блокировки
            { rrule: { not: null } },
          ],
        },
        orderBy: { start: "asc" },
        select: {
          id: true,
          type: true,
          start: true,
          end: true,
          rrule: true,
          rruleUntil: true,
          tzid: true,
          reason: true,
        },
      }),
    ]);

    // Разворачиваем unavailability с учётом RRULE
    const unavailBlocks = [];
    for (const unavail of unavailabilities) {
      if (unavail.rrule) {
        // Генерируем вхождения повторяющейся блокировки
        const occurrences = generateOccurrences(
          unavail.rrule,
          unavail.start,
          unavail.end,
          fromDate,
          toDate,
          unavail.tzid || doctor.tzid,
          unavail.rruleUntil
        );
        for (const occ of occurrences) {
          unavailBlocks.push({
            id: `${unavail.id}_${occ.start.toISOString()}`,
            parentId: unavail.id,
            type: unavail.type,
            start: occ.start,
            end: occ.end,
            reason: unavail.reason,
            isRecurring: true,
          });
        }
      } else {
        // Обычная блокировка
        unavailBlocks.push({
          id: unavail.id,
          parentId: unavail.id,
          type: unavail.type,
          start: unavail.start,
          end: unavail.end,
          reason: unavail.reason,
          isRecurring: false,
        });
      }
    }

    // Форматируем ответ
    return NextResponse.json({
      schedules: schedules.map(s => ({
        id: s.id,
        byWeekday: s.byWeekday,
        startTime: s.startTime,
        endTime: s.endTime,
      })),
      openings: openings.map(o => ({
        id: o.id,
        start: o.startUtc,
        end: o.endUtc
      })),
      exceptions: exceptions.map(e => ({
        id: e.id,
        start: e.startUtc,
        end: e.endUtc,
        reason: e.reason || null
      })),
      bookings: bookings.map(b => ({
        id: b.id,
        start: b.startUtc,
        end: b.endUtc,
        status: b.status,
        title: b.service?.name || "Запись",
        clientName: b.clientName || b.user?.name || null,
        clientEmail: b.clientEmail || b.user?.email || null,
        clientPhone: b.clientPhone || b.user?.phone || null,
        note: b.note || null,
        durationMin: b.service?.durationMin || null,
        price: b.service?.priceCents ? b.service.priceCents / 100 : null,
        currency: b.service?.currency || 'RUB',
      })),
      unavailabilities: unavailBlocks,
      meta: {
        from: fromDate,
        to: toDate,
        timezone: doctor.tzid || 'UTC',
      }
    });

  } catch (error) {
    console.error('[MOBILE_DOCTOR_CALENDAR] Error:', error);
    return NextResponse.json(
      {
        error: 'Ошибка при загрузке календаря',
        message: error instanceof Error ? error.message : 'Внутренняя ошибка сервера'
      },
      { status: 500 }
    );
  }
}
