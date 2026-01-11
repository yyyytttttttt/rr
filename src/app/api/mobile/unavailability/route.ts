import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../../lib/prizma";
import { z } from "zod";
import { requireAuth, createCorsResponse } from "../../../../lib/jwt";
import { generateOccurrences, validateRRule } from "../../../../lib/rrule";
import { UnavailabilityType } from "@prisma/client";

// Обработка OPTIONS для CORS preflight
export async function OPTIONS(request: NextRequest) {
  return createCorsResponse(request);
}

// ================= Схемы валидации =================

const CreateUnavailabilitySchema = z.object({
  doctorId: z.string(),
  type: z.enum(["VACATION", "DAY_OFF", "NO_BOOKINGS"]),
  tzid: z.string(), // IANA timezone
  start: z.string(), // ISO date string
  end: z.string(), // ISO date string
  rrule: z.string().optional().nullable(),
  rruleUntil: z.string().optional().nullable(), // ISO date string
  reason: z.string().max(500).optional().nullable(),
  cancelPending: z.boolean().optional(), // автоматически отменить PENDING брони
});

// ================= GET: Получить блокировки с учётом RRULE =================

export async function GET(req: NextRequest) {
  const auth = requireAuth(req, ['DOCTOR', 'ADMIN']);

  if ('error' in auth) {
    return auth.error;
  }

  const { userId, role } = auth.payload;
  const url = new URL(req.url);
  const doctorId = url.searchParams.get("doctorId");
  const from = url.searchParams.get("from"); // ISO date
  const to = url.searchParams.get("to"); // ISO date

  if (!doctorId) {
    return NextResponse.json({ error: "ID врача не указан" }, { status: 400 });
  }

  if (!from || !to) {
    return NextResponse.json({ error: "Диапазон дат не указан" }, { status: 400 });
  }

  const rangeStart = new Date(from);
  const rangeEnd = new Date(to);

  if (isNaN(rangeStart.getTime()) || isNaN(rangeEnd.getTime())) {
    return NextResponse.json({ error: "Неверный формат даты" }, { status: 400 });
  }

  try {
    // Проверка прав доступа
    const doctor = await prisma.doctor.findUnique({
      where: { id: doctorId },
      select: { userId: true },
    });

    if (!doctor) {
      return NextResponse.json({ error: "Врач не найден" }, { status: 404 });
    }

    const isOwner = doctor.userId === userId;
    const isAdmin = role === "ADMIN";

    if (!isOwner && !isAdmin) {
      console.warn(`[MOBILE_UNAVAILABILITY] Попытка доступа к чужим блокировкам: userId=${userId}, doctorId=${doctorId}`);
      return NextResponse.json({ error: "Доступ запрещен" }, { status: 403 });
    }

    // Получаем все блокировки для врача
    const unavailabilities = await prisma.unavailability.findMany({
      where: {
        doctorId,
        OR: [
          {
            start: { lt: rangeEnd },
            end: { gt: rangeStart },
          },
          {
            rrule: { not: null },
          },
        ],
      },
      orderBy: { start: "asc" },
    });

    // Расширяем повторяющиеся блокировки
    const expandedBlocks: any[] = [];

    for (const block of unavailabilities) {
      if (block.rrule) {
        const occurrences = generateOccurrences(
          block.rrule,
          block.start,
          block.end,
          rangeStart,
          rangeEnd,
          block.tzid,
          block.rruleUntil
        );

        for (const occ of occurrences) {
          expandedBlocks.push({
            id: `${block.id}_${occ.start.toISOString()}`,
            parentId: block.id,
            type: block.type,
            tzid: block.tzid,
            start: occ.start.toISOString(),
            end: occ.end.toISOString(),
            reason: block.reason,
            isRecurring: true,
            rrule: block.rrule,
          });
        }
      } else {
        expandedBlocks.push({
          id: block.id,
          parentId: block.id,
          type: block.type,
          tzid: block.tzid,
          start: block.start.toISOString(),
          end: block.end.toISOString(),
          reason: block.reason,
          isRecurring: false,
          createdBy: block.createdBy,
          createdAt: block.createdAt.toISOString(),
        });
      }
    }

    console.info(`[MOBILE_UNAVAILABILITY] Получено блокировок: ${expandedBlocks.length} для doctorId=${doctorId}`);
    return NextResponse.json({ unavailabilities: expandedBlocks });
  } catch (error) {
    console.error("[MOBILE_UNAVAILABILITY] Ошибка при получении блокировок:", error);
    return NextResponse.json(
      { error: "Ошибка при получении блокировок" },
      { status: 500 }
    );
  }
}

// ================= POST: Создать блокировку =================

export async function POST(req: NextRequest) {
  const auth = requireAuth(req, ['DOCTOR', 'ADMIN']);

  if ('error' in auth) {
    return auth.error;
  }

  const body = await req.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Тело запроса отсутствует" }, { status: 400 });
  }

  const p = CreateUnavailabilitySchema.safeParse(body);
  if (!p.success) {
    console.warn("[MOBILE_UNAVAILABILITY] Ошибка валидации:", p.error);
    return NextResponse.json({ error: "Ошибка валидации данных", details: p.error }, { status: 400 });
  }

  const { doctorId, type, tzid, start, end, rrule, rruleUntil, reason, cancelPending } = p.data;
  const { userId, role } = auth.payload;

  try {
    // Получаем информацию о докторе
    const doctor = await prisma.doctor.findUnique({
      where: { id: doctorId },
      select: { userId: true },
    });

    if (!doctor) {
      return NextResponse.json({ error: "Врач не найден" }, { status: 404 });
    }

    const isOwner = doctor.userId === userId;
    const isAdmin = role === "ADMIN";

    // Проверка прав доступа
    if (type === "VACATION" || type === "DAY_OFF") {
      if (!isOwner && !isAdmin) {
        console.warn(`[MOBILE_UNAVAILABILITY] Попытка создания блокировки без прав: userId=${userId}, doctorId=${doctorId}, type=${type}`);
        return NextResponse.json({ error: "Доступ запрещен" }, { status: 403 });
      }
    }

    if (type === "NO_BOOKINGS" && !isAdmin) {
      console.warn(`[MOBILE_UNAVAILABILITY] Попытка создания NO_BOOKINGS без прав админа: userId=${userId}, role=${role}`);
      return NextResponse.json({ error: "Только администратор может создавать блокировки типа NO_BOOKINGS" }, { status: 403 });
    }

    // Парсинг дат
    const startDate = new Date(start);
    const endDate = new Date(end);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return NextResponse.json({ error: "Неверный формат даты" }, { status: 400 });
    }

    // Валидация: end > start
    if (endDate <= startDate) {
      return NextResponse.json({ error: "Дата окончания должна быть позже даты начала" }, { status: 400 });
    }

    // Валидация: нельзя создавать блокировку в прошлом (кроме админа)
    if (!isAdmin && startDate < new Date()) {
      return NextResponse.json({ error: "Нельзя создавать блокировки в прошлом" }, { status: 400 });
    }

    // Валидация RRULE
    if (rrule) {
      const validation = validateRRule(rrule);
      if (!validation.valid) {
        console.warn(`[MOBILE_UNAVAILABILITY] Неверный RRULE: ${validation.error}`);
        return NextResponse.json({ error: "Неверный формат правила повторения", message: validation.error }, { status: 400 });
      }
    }

    // Парсинг rruleUntil
    let rruleUntilDate: Date | null = null;
    if (rruleUntil) {
      rruleUntilDate = new Date(rruleUntil);
      if (isNaN(rruleUntilDate.getTime())) {
        return NextResponse.json({ error: "Неверный формат даты окончания повторения" }, { status: 400 });
      }
    }

    // Проверка пересечений с существующими бронями
    const affectedBookings = await prisma.booking.findMany({
      where: {
        doctorId,
        status: { in: ["PENDING", "CONFIRMED"] },
        startUtc: { lt: endDate },
        endUtc: { gt: startDate },
      },
      select: { id: true, status: true, startUtc: true, endUtc: true },
    });

    const affectedPending = affectedBookings.filter((b) => b.status === "PENDING");
    const affectedConfirmed = affectedBookings.filter((b) => b.status === "CONFIRMED");

    // Создание блокировки
    const unavailability = await prisma.unavailability.create({
      data: {
        doctorId,
        type: type as UnavailabilityType,
        tzid,
        start: startDate,
        end: endDate,
        rrule: rrule || null,
        rruleUntil: rruleUntilDate,
        reason: reason || null,
        createdBy: userId,
      },
    });

    // Автоматическая отмена PENDING броней
    if (cancelPending && affectedPending.length > 0) {
      await prisma.booking.updateMany({
        where: {
          id: { in: affectedPending.map((b) => b.id) },
        },
        data: {
          status: "CANCELED",
        },
      });
      console.info(`[MOBILE_UNAVAILABILITY] Автоматически отменено ${affectedPending.length} PENDING броней`);
    }

    console.info(`[MOBILE_UNAVAILABILITY] Блокировка создана: id=${unavailability.id}, type=${type}, doctorId=${doctorId}`);

    return NextResponse.json({
      ok: true,
      unavailability: {
        id: unavailability.id,
        type: unavailability.type,
        start: unavailability.start.toISOString(),
        end: unavailability.end.toISOString(),
        rrule: unavailability.rrule,
        reason: unavailability.reason,
      },
      affected: {
        pending: affectedPending.length,
        confirmed: affectedConfirmed.length,
        canceledPending: cancelPending ? affectedPending.length : 0,
      },
    });
  } catch (error) {
    console.error("[MOBILE_UNAVAILABILITY] Ошибка при создании блокировки:", error);
    return NextResponse.json(
      { error: "Ошибка сервера при создании блокировки" },
      { status: 500 }
    );
  }
}
