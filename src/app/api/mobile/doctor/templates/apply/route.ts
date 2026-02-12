import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../../../../lib/prizma";
import { z } from "zod";
import { requireAuth, createCorsResponse } from "../../../../../../lib/jwt";
import { generateOccurrences } from "../../../../../../lib/rrule";

// Обработка OPTIONS для CORS preflight
export async function OPTIONS(request: NextRequest) {
  return createCorsResponse(request);
}

// ================= Схема валидации =================

const ApplyTemplateSchema = z.object({
  templateId: z.string(),
  doctorId: z.string(),
  weekStartDate: z.string(), // ISO date string начала недели (понедельник)
});

// ================= POST: Применить шаблон к неделе =================

export async function POST(req: NextRequest) {
  const auth = requireAuth(req, ['DOCTOR', 'ADMIN']);

  if ('error' in auth) {
    return auth.error;
  }

  const body = await req.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Тело запроса отсутствует" }, { status: 400 });
  }

  const p = ApplyTemplateSchema.safeParse(body);
  if (!p.success) {
    console.warn("[MOBILE_TEMPLATE_APPLY] Ошибка валидации:", p.error);
    return NextResponse.json({ error: "Ошибка валидации данных", details: p.error }, { status: 400 });
  }

  const { templateId, doctorId, weekStartDate } = p.data;
  const { userId, role } = auth.payload;

  const isAdmin = role === "ADMIN";

  // Если не админ, проверяем что это свой профиль
  if (!isAdmin) {
    const me = await prisma.doctor.findFirst({
      where: { userId },
      select: { id: true },
    });

    if (!me || me.id !== doctorId) {
      console.warn(`[MOBILE_TEMPLATE_APPLY] Попытка применить шаблон к чужому профилю: userId=${userId}, doctorId=${doctorId}`);
      return NextResponse.json({ error: "Доступ запрещен" }, { status: 403 });
    }
  }

  try {
    // Загрузка шаблона
    const template = await prisma.weeklyTemplate.findFirst({
      where: { id: templateId, doctorId },
      include: { slots: true },
    });

    if (!template) {
      console.warn(`[MOBILE_TEMPLATE_APPLY] Шаблон не найден: templateId=${templateId}, doctorId=${doctorId}`);
      return NextResponse.json({ error: "Шаблон не найден" }, { status: 404 });
    }

    if (template.slots.length === 0) {
      return NextResponse.json({ error: "Шаблон не содержит слотов" }, { status: 400 });
    }

    // Парсинг даты начала недели
    const weekStart = new Date(weekStartDate);
    if (isNaN(weekStart.getTime())) {
      return NextResponse.json({ error: "Неверная дата" }, { status: 400 });
    }

    // Проверка что это понедельник (dayOfWeek = 1)
    const dayOfWeek = weekStart.getUTCDay();
    if (dayOfWeek !== 1) {
      return NextResponse.json({ error: "Дата должна быть понедельником", dayOfWeek }, { status: 400 });
    }

    // Получаем настройки доктора для буфера по умолчанию
    const doctor = await prisma.doctor.findUnique({
      where: { id: doctorId },
      select: { bufferMin: true },
    });

    const defaultBufferMin = doctor?.bufferMin ?? 15;

    // Загружаем все блокировки для этой недели один раз
    const weekEnd = new Date(weekStart);
    weekEnd.setUTCDate(weekStart.getUTCDate() + 7);

    const [existingOpenings, existingBookings, exceptions, unavailabilities] = await Promise.all([
      prisma.opening.findMany({
        where: {
          doctorId,
          startUtc: { lt: weekEnd },
          endUtc: { gt: weekStart },
        },
        select: { id: true, startUtc: true, endUtc: true },
      }),
      prisma.booking.findMany({
        where: {
          doctorId,
          status: { in: ["PENDING", "CONFIRMED"] },
          startUtc: { lt: weekEnd },
          endUtc: { gt: weekStart },
        },
        select: { id: true, startUtc: true, endUtc: true },
      }),
      prisma.exception.findMany({
        where: {
          doctorId,
          startUtc: { lt: weekEnd },
          endUtc: { gt: weekStart },
        },
        select: { id: true, startUtc: true, endUtc: true, reason: true, kind: true },
      }),
      prisma.unavailability.findMany({
        where: {
          doctorId,
          OR: [
            {
              start: { lt: weekEnd },
              end: { gt: weekStart },
            },
            {
              rrule: { not: null },
            },
          ],
        },
        select: { id: true, start: true, end: true, reason: true, type: true, rrule: true, rruleUntil: true, tzid: true },
      }),
    ]);

    // Расширяем повторяющиеся блокировки
    const expandedUnavailabilities: Array<{ start: Date; end: Date; id: string; type: string; reason: string | null }> = [];

    for (const unav of unavailabilities) {
      if (unav.rrule) {
        const occurrences = generateOccurrences(
          unav.rrule,
          unav.start,
          unav.end,
          weekStart,
          weekEnd,
          unav.tzid || "UTC",
          unav.rruleUntil
        );
        for (const occ of occurrences) {
          expandedUnavailabilities.push({
            start: occ.start,
            end: occ.end,
            id: unav.id,
            type: unav.type,
            reason: unav.reason,
          });
        }
      } else {
        expandedUnavailabilities.push({
          start: unav.start,
          end: unav.end,
          id: unav.id,
          type: unav.type,
          reason: unav.reason,
        });
      }
    }

    // Создание окон приёма на основе шаблона
    const createdOpenings: any[] = [];
    const errors: any[] = [];

    for (const slot of template.slots) {
      // Вычисление даты для конкретного дня недели
      // dayOfWeek: 0 = Понедельник, 6 = Воскресенье
      const slotDate = new Date(weekStart);
      slotDate.setUTCDate(weekStart.getUTCDate() + slot.dayOfWeek);

      // Парсинг времени HH:MM
      const [startHour, startMin] = slot.startTime.split(":").map(Number);
      const [endHour, endMin] = slot.endTime.split(":").map(Number);

      // Время начала и конца рабочего дня в минутах с полуночи
      const dayStartMinutes = startHour * 60 + startMin;
      const dayEndMinutes = endHour * 60 + endMin;

      // Длительность одного приёма и буфер
      const appointmentDuration = slot.slotDurationMin;
      const bufferMinutes = slot.bufferMinOverride ?? defaultBufferMin;
      const totalSlotDuration = appointmentDuration + bufferMinutes;

      // Генерация множества слотов в течение рабочего дня
      let currentMinutes = dayStartMinutes;

      while (currentMinutes + appointmentDuration <= dayEndMinutes) {
        // Создание UTC даты для начала и конца слота
        const slotStartUtc = new Date(slotDate);
        slotStartUtc.setUTCHours(
          Math.floor(currentMinutes / 60),
          currentMinutes % 60,
          0,
          0
        );

        const slotEndUtc = new Date(slotDate);
        const endMinutes = currentMinutes + appointmentDuration;
        slotEndUtc.setUTCHours(
          Math.floor(endMinutes / 60),
          endMinutes % 60,
          0,
          0
        );

        // Проверка на прошлое
        if (slotStartUtc < new Date()) {
          errors.push({
            slot,
            error: "PAST_TIME",
            startUtc: slotStartUtc.toISOString(),
          });
          currentMinutes += totalSlotDuration;
          continue;
        }

        // Проверка на пересечение с существующими окнами
        const openingOverlap = existingOpenings.find(
          (o) =>
            o.startUtc.getTime() < slotEndUtc.getTime() &&
            o.endUtc.getTime() > slotStartUtc.getTime()
        );

        if (openingOverlap) {
          errors.push({
            slot,
            error: "HAS_OPENING_OVERLAP",
            startUtc: slotStartUtc.toISOString(),
            endUtc: slotEndUtc.toISOString(),
            conflictWith: {
              id: openingOverlap.id,
              startUtc: openingOverlap.startUtc.toISOString(),
              endUtc: openingOverlap.endUtc.toISOString(),
            },
          });
          currentMinutes += totalSlotDuration;
          continue;
        }

        // Проверка на конфликт с бронями
        const bookingConflict = existingBookings.find(
          (b) =>
            b.startUtc.getTime() < slotEndUtc.getTime() &&
            b.endUtc.getTime() > slotStartUtc.getTime()
        );

        if (bookingConflict) {
          errors.push({
            slot,
            error: "HAS_BOOKINGS",
            startUtc: slotStartUtc.toISOString(),
            endUtc: slotEndUtc.toISOString(),
          });
          currentMinutes += totalSlotDuration;
          continue;
        }

        // Проверка на конфликт с блокировками (exceptions)
        const exceptionConflict = exceptions.find(
          (e) =>
            e.startUtc.getTime() < slotEndUtc.getTime() &&
            e.endUtc.getTime() > slotStartUtc.getTime()
        );

        if (exceptionConflict) {
          errors.push({
            slot,
            error: "HAS_EXCEPTION",
            startUtc: slotStartUtc.toISOString(),
            endUtc: slotEndUtc.toISOString(),
            conflictWith: {
              id: exceptionConflict.id,
              kind: exceptionConflict.kind,
              reason: exceptionConflict.reason,
            },
          });
          currentMinutes += totalSlotDuration;
          continue;
        }

        // Проверка на конфликт с блокировками (unavailability)
        const unavailabilityConflict = expandedUnavailabilities.find(
          (u) =>
            u.start.getTime() < slotEndUtc.getTime() &&
            u.end.getTime() > slotStartUtc.getTime()
        );

        if (unavailabilityConflict) {
          errors.push({
            slot,
            error: "HAS_UNAVAILABILITY",
            startUtc: slotStartUtc.toISOString(),
            endUtc: slotEndUtc.toISOString(),
            conflictWith: {
              id: unavailabilityConflict.id,
              type: unavailabilityConflict.type,
              reason: unavailabilityConflict.reason,
            },
          });
          currentMinutes += totalSlotDuration;
          continue;
        }

        // Создание окна приёма
        try {
          const created = await prisma.opening.create({
            data: {
              doctorId,
              startUtc: slotStartUtc,
              endUtc: slotEndUtc,
            },
          });
          createdOpenings.push({
            id: created.id,
            startUtc: created.startUtc.toISOString(),
            endUtc: created.endUtc.toISOString(),
            dayOfWeek: slot.dayOfWeek,
          });
        } catch (e) {
          errors.push({
            slot,
            error: "CREATE_FAILED",
            message: "Failed to create opening",
            startUtc: slotStartUtc.toISOString(),
          });
        }

        // Переход к следующему слоту
        currentMinutes += totalSlotDuration;
      }
    }

    console.info(`[MOBILE_TEMPLATE_APPLY] Шаблон применен: templateId=${templateId}, created=${createdOpenings.length}, errors=${errors.length}`);

    return NextResponse.json({
      ok: true,
      created: createdOpenings.length,
      errors: errors.length,
      openings: createdOpenings,
      errorDetails: errors,
    });
  } catch (error) {
    console.error("[MOBILE_TEMPLATE_APPLY] Ошибка:", error);
    return NextResponse.json(
      { error: "Ошибка сервера при применении шаблона" },
      { status: 500 }
    );
  }
}
