// app/api/availability/route.ts
import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prizma";
import { z } from "zod";
import { addMinutes, startOfDay, endOfDay } from "date-fns";
import { fromZonedTime, toZonedTime } from "date-fns-tz";
import { generateOccurrences } from "../../../lib/rrule";

const querySchema = z.object({
  serviceId: z.string().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), // YYYY-MM-DD format
  doctorId: z.string().min(1).optional(), // NOTE: Optional filter by specific doctor (not strict UUID for flexibility)
});

/**
 * GET /api/availability
 * Получить список врачей с доступными слотами для указанной услуги и даты
 * Query params:
 *   - serviceId: string - ID услуги
 *   - date: string - Дата в формате YYYY-MM-DD
 *   - doctorId: string (optional) - Filter by specific doctor
 *
 * Response:
 *   {
 *     doctors: [
 *       {
 *         id: string,
 *         name: string,
 *         title: string,
 *         image: string,
 *         slots: [
 *           { start: ISO string, end: ISO string }
 *         ]
 *       }
 *     ]
 *   }
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const parsed = querySchema.safeParse({
    serviceId: url.searchParams.get("serviceId"),
    date: url.searchParams.get("date"),
    doctorId: url.searchParams.get("doctorId"),
  });

  if (!parsed.success) {
    return NextResponse.json(
      { error: "VALIDATION", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { serviceId, date, doctorId } = parsed.data;

  // 1) Найти услугу и получить её параметры
  const service = await prisma.service.findUnique({
    where: { id: serviceId },
    select: {
      id: true,
      durationMin: true,
      bufferMinOverride: true,
      doctorServices: {
        where: {
          isActive: true,
          // NOTE: Filter by specific doctor if provided
          ...(doctorId ? { doctorId } : {}),
        },
        select: {
          doctorId: true,
          doctor: {
            select: {
              id: true,
              bufferMin: true,
              tzid: true,
              minLeadMin: true,
              gridStepMin: true,
              rating: true,
              reviewCount: true,
              user: {
                select: {
                  name: true,
                  image: true,
                },
              },
              title: true,
            },
          },
        },
      },
    },
  });

  if (!service) {
    return NextResponse.json({ error: "SERVICE_NOT_FOUND" }, { status: 404 });
  }

  if (service.doctorServices.length === 0) {
    return NextResponse.json({ doctors: [] });
  }

  // 2) Для каждого врача получить доступные слоты
  const doctors = await Promise.all(
    service.doctorServices.map(async ({ doctor }) => {
      const slots = await getAvailableSlots(
        doctor.id,
        doctor.tzid,
        date,
        service.durationMin,
        service.bufferMinOverride ?? doctor.bufferMin,
        doctor.minLeadMin,
        doctor.gridStepMin
      );

      return {
        id: doctor.id,
        name: doctor.user.name || "Врач",
        title: doctor.title,
        image: doctor.user.image,
        rating: doctor.rating || 5.0,
        reviewCount: doctor.reviewCount || 0,
        slots,
      };
    })
  );

  // Возвращаем только врачей с доступными слотами
  const doctorsWithSlots = doctors.filter((d) => d.slots.length > 0);

  return NextResponse.json({ doctors: doctorsWithSlots });
}

/**
 * Получить доступные слоты для врача на указанную дату
 * Логика повторяет /api/doctor/slots, но упрощена для одного дня
 */
async function getAvailableSlots(
  doctorId: string,
  tzid: string,
  dateStr: string, // YYYY-MM-DD
  durationMin: number,
  bufferMin: number,
  minLeadMin: number,
  gridStepMin: number
): Promise<Array<{ start: string; end: string }>> {
  // Парсим дату в UTC
  const [year, month, day] = dateStr.split("-").map(Number);
  const localStart = new Date(year, month - 1, day, 0, 0, 0);
  const localEnd = new Date(year, month - 1, day, 23, 59, 59);

  // Конвертируем в UTC с учетом timezone врача
  const startUtc = fromZonedTime(localStart, tzid);
  const endUtc = fromZonedTime(localEnd, tzid);

  // Получаем openings, bookings, exceptions, unavailabilities
  const [openings, bookings, exceptions, unavailabilities] = await Promise.all([
    prisma.opening.findMany({
      where: {
        doctorId,
        startUtc: { lt: endUtc },
        endUtc: { gt: startUtc },
      },
      select: { id: true, startUtc: true, endUtc: true },
      orderBy: { startUtc: "asc" },
    }),
    prisma.booking.findMany({
      where: {
        doctorId,
        status: { in: ["PENDING", "CONFIRMED"] },
        startUtc: { lt: endUtc },
        endUtc: { gt: startUtc },
      },
      select: { startUtc: true, endUtc: true },
      orderBy: { startUtc: "asc" },
    }),
    prisma.exception.findMany({
      where: {
        doctorId,
        startUtc: { lt: endUtc },
        endUtc: { gt: startUtc },
      },
      select: { startUtc: true, endUtc: true },
      orderBy: { startUtc: "asc" },
    }),
    prisma.unavailability.findMany({
      where: {
        doctorId,
        OR: [
          { start: { lt: endUtc }, end: { gt: startUtc } },
          { rrule: { not: null } },
        ],
      },
      select: {
        type: true,
        start: true,
        end: true,
        rrule: true,
        rruleUntil: true,
        tzid: true,
      },
    }),
  ]);

  // Развернуть unavailabilities с RRULE
  const unavailBlocks = [];
  for (const unavail of unavailabilities) {
    if (unavail.rrule) {
      const occurrences = generateOccurrences(
        unavail.rrule,
        unavail.start,
        unavail.end,
        startUtc,
        endUtc,
        unavail.tzid,
        unavail.rruleUntil
      );
      unavailBlocks.push(...occurrences.map((occ) => ({ start: occ.start, end: occ.end })));
    } else {
      unavailBlocks.push({ start: unavail.start, end: unavail.end });
    }
  }

  // Объединяем все исключения
  const allExclusions = [
    ...bookings.map((b) => ({ start: b.startUtc, end: b.endUtc })),
    ...exceptions.map((e) => ({ start: e.startUtc, end: e.endUtc })),
    ...unavailBlocks,
  ];

  // Вычитаем исключения из openings
  const availableWindows = subtractExclusions(openings, allExclusions);

  // Генерируем слоты с учетом gridStepMin
  const slots = generateSlots(
    availableWindows,
    durationMin,
    bufferMin,
    gridStepMin,
    minLeadMin,
    tzid
  );

  return slots;
}

function subtractExclusions(
  openings: Array<{ startUtc: Date; endUtc: Date }>,
  exclusions: Array<{ start: Date; end: Date }>
): Array<{ start: Date; end: Date }> {
  let windows = openings.map((o) => ({ start: o.startUtc, end: o.endUtc }));

  for (const ex of exclusions) {
    const newWindows = [];
    for (const win of windows) {
      if (ex.end <= win.start || ex.start >= win.end) {
        // Нет пересечения
        newWindows.push(win);
      } else {
        // Пересечение - разбиваем
        if (ex.start > win.start) {
          newWindows.push({ start: win.start, end: ex.start });
        }
        if (ex.end < win.end) {
          newWindows.push({ start: ex.end, end: win.end });
        }
      }
    }
    windows = newWindows;
  }

  return windows;
}

function generateSlots(
  windows: Array<{ start: Date; end: Date }>,
  durationMin: number,
  bufferMin: number,
  gridStepMin: number,
  minLeadMin: number,
  tzid: string
): Array<{ start: string; end: string }> {
  const slots: Array<{ start: string; end: string }> = [];
  const now = new Date();
  const minStartTime = addMinutes(now, minLeadMin);

  for (const window of windows) {
    let current = window.start;

    // Округляем начало до gridStepMin
    const minutes = current.getMinutes();
    const remainder = minutes % gridStepMin;
    if (remainder !== 0) {
      current = addMinutes(current, gridStepMin - remainder);
    }

    while (current < window.end) {
      const slotEnd = addMinutes(current, durationMin);
      const nextSlotStart = addMinutes(slotEnd, bufferMin);

      // Проверяем что слот влезает в окно и не в прошлом
      if (slotEnd <= window.end && current >= minStartTime) {
        slots.push({
          start: current.toISOString(),
          end: slotEnd.toISOString(),
        });
      }

      current = nextSlotStart;

      // Округляем до gridStepMin
      const currentMinutes = current.getMinutes();
      const currentRemainder = currentMinutes % gridStepMin;
      if (currentRemainder !== 0) {
        current = addMinutes(current, gridStepMin - currentRemainder);
      }
    }
  }

  return slots;
}
