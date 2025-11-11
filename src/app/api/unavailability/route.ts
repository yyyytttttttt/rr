import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prizma";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../lib/auth";
import { generateOccurrences, validateRRule } from "../../../lib/rrule";
import { UnavailabilityType } from "@prisma/client";

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

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  const url = new URL(req.url);
  const doctorId = url.searchParams.get("doctorId");
  const from = url.searchParams.get("from"); // ISO date
  const to = url.searchParams.get("to"); // ISO date

  if (!doctorId) {
    return NextResponse.json({ error: "MISSING_DOCTOR_ID" }, { status: 400 });
  }

  if (!from || !to) {
    return NextResponse.json({ error: "MISSING_RANGE" }, { status: 400 });
  }

  const rangeStart = new Date(from);
  const rangeEnd = new Date(to);

  if (isNaN(rangeStart.getTime()) || isNaN(rangeEnd.getTime())) {
    return NextResponse.json({ error: "INVALID_DATES" }, { status: 400 });
  }

  // Проверка прав доступа
  const doctor = await prisma.doctor.findUnique({
    where: { id: doctorId },
    select: { userId: true },
  });

  if (!doctor) {
    return NextResponse.json({ error: "DOCTOR_NOT_FOUND" }, { status: 404 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });

  // Доступ: врач может видеть свои, админ - все
  const isOwner = doctor.userId === session.user.id;
  const isAdmin = user?.role === "ADMIN";

  if (!isOwner && !isAdmin) {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  }

  // Получаем все блокировки для врача
  const unavailabilities = await prisma.unavailability.findMany({
    where: {
      doctorId,
      OR: [
        // Блокировки, которые пересекаются с диапазоном
        {
          start: { lt: rangeEnd },
          end: { gt: rangeStart },
        },
        // Повторяющиеся блокировки
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
      // Генерируем вхождения
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
          id: `${block.id}_${occ.start.toISOString()}`, // уникальный ID для вхождения
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
      // Обычная блокировка
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

  return NextResponse.json({ unavailabilities: expandedBlocks });
}

// ================= POST: Создать блокировку =================

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "INVALID_BODY" }, { status: 400 });
  }

  const p = CreateUnavailabilitySchema.safeParse(body);
  if (!p.success) {
    return NextResponse.json({ error: "VALIDATION", details: p.error }, { status: 400 });
  }

  const { doctorId, type, tzid, start, end, rrule, rruleUntil, reason, cancelPending } = p.data;

  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  // Получаем информацию о докторе и пользователе
  const doctor = await prisma.doctor.findUnique({
    where: { id: doctorId },
    select: { userId: true },
  });

  if (!doctor) {
    return NextResponse.json({ error: "DOCTOR_NOT_FOUND" }, { status: 404 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });

  // Проверка прав доступа
  const isOwner = doctor.userId === session.user.id;
  const isAdmin = user?.role === "ADMIN";
  const isDoctor = user?.role === "DOCTOR";

  // VACATION/DAY_OFF - врач и админ (врач только себе)
  if (type === "VACATION" || type === "DAY_OFF") {
    if (!isOwner && !isAdmin) {
      return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
    }
  }

  // NO_BOOKINGS - только админ
  if (type === "NO_BOOKINGS" && !isAdmin) {
    return NextResponse.json({ error: "ADMIN_ONLY" }, { status: 403 });
  }

  // Парсинг дат
  const startDate = new Date(start);
  const endDate = new Date(end);

  if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
    return NextResponse.json({ error: "INVALID_DATES" }, { status: 400 });
  }

  // Валидация: end > start
  if (endDate <= startDate) {
    return NextResponse.json({ error: "END_BEFORE_START" }, { status: 400 });
  }

  // Валидация: нельзя создавать блокировку в прошлом (кроме админа)
  if (!isAdmin && startDate < new Date()) {
    return NextResponse.json({ error: "CANNOT_CREATE_IN_PAST" }, { status: 400 });
  }

  // Валидация RRULE
  if (rrule) {
    const validation = validateRRule(rrule);
    if (!validation.valid) {
      return NextResponse.json({ error: "INVALID_RRULE", message: validation.error }, { status: 400 });
    }
  }

  // Парсинг rruleUntil
  let rruleUntilDate: Date | null = null;
  if (rruleUntil) {
    rruleUntilDate = new Date(rruleUntil);
    if (isNaN(rruleUntilDate.getTime())) {
      return NextResponse.json({ error: "INVALID_RRULE_UNTIL" }, { status: 400 });
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
      createdBy: session.user.id,
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
  }

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
}
