import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prizma";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../../lib/auth";
import { validateRRule } from "../../../../lib/rrule";
import { UnavailabilityType } from "@prisma/client";

// ================= Схемы валидации =================

const UpdateUnavailabilitySchema = z.object({
  type: z.enum(["VACATION", "DAY_OFF", "NO_BOOKINGS"]).optional(),
  tzid: z.string().optional(),
  start: z.string().optional(), // ISO date string
  end: z.string().optional(), // ISO date string
  rrule: z.string().optional().nullable(),
  rruleUntil: z.string().optional().nullable(),
  reason: z.string().max(500).optional().nullable(),
});

// ================= PATCH: Обновить блокировку =================

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const body = await req.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "INVALID_BODY" }, { status: 400 });
  }

  const p = UpdateUnavailabilitySchema.safeParse(body);
  if (!p.success) {
    return NextResponse.json({ error: "VALIDATION", details: p.error }, { status: 400 });
  }

  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  // Получаем существующую блокировку
  const existing = await prisma.unavailability.findUnique({
    where: { id },
    include: { doctor: true },
  });

  if (!existing) {
    return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  }

  // Проверка прав доступа
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });

  const isOwner = existing.doctor.userId === session.user.id;
  const isAdmin = user?.role === "ADMIN";

  // Проверка прав на редактирование
  const updatedType = p.data.type || existing.type;
  if (updatedType === "NO_BOOKINGS" && !isAdmin) {
    return NextResponse.json({ error: "ADMIN_ONLY" }, { status: 403 });
  }

  if (!isOwner && !isAdmin) {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  }

  // Парсинг дат
  const updateData: any = {};

  if (p.data.start) {
    const startDate = new Date(p.data.start);
    if (isNaN(startDate.getTime())) {
      return NextResponse.json({ error: "INVALID_START_DATE" }, { status: 400 });
    }
    updateData.start = startDate;
  }

  if (p.data.end) {
    const endDate = new Date(p.data.end);
    if (isNaN(endDate.getTime())) {
      return NextResponse.json({ error: "INVALID_END_DATE" }, { status: 400 });
    }
    updateData.end = endDate;
  }

  // Валидация: end > start
  const finalStart = updateData.start || existing.start;
  const finalEnd = updateData.end || existing.end;

  if (finalEnd <= finalStart) {
    return NextResponse.json({ error: "END_BEFORE_START" }, { status: 400 });
  }

  // Валидация RRULE
  if (p.data.rrule !== undefined) {
    if (p.data.rrule) {
      const validation = validateRRule(p.data.rrule);
      if (!validation.valid) {
        return NextResponse.json({ error: "INVALID_RRULE", message: validation.error }, { status: 400 });
      }
    }
    updateData.rrule = p.data.rrule;
  }

  // Парсинг rruleUntil
  if (p.data.rruleUntil !== undefined) {
    if (p.data.rruleUntil) {
      const rruleUntilDate = new Date(p.data.rruleUntil);
      if (isNaN(rruleUntilDate.getTime())) {
        return NextResponse.json({ error: "INVALID_RRULE_UNTIL" }, { status: 400 });
      }
      updateData.rruleUntil = rruleUntilDate;
    } else {
      updateData.rruleUntil = null;
    }
  }

  // Обновление остальных полей
  if (p.data.type !== undefined) updateData.type = p.data.type as UnavailabilityType;
  if (p.data.tzid !== undefined) updateData.tzid = p.data.tzid;
  if (p.data.reason !== undefined) updateData.reason = p.data.reason;

  // Обновление
  const updated = await prisma.unavailability.update({
    where: { id },
    data: updateData,
  });

  return NextResponse.json({
    ok: true,
    unavailability: {
      id: updated.id,
      type: updated.type,
      tzid: updated.tzid,
      start: updated.start.toISOString(),
      end: updated.end.toISOString(),
      rrule: updated.rrule,
      rruleUntil: updated.rruleUntil?.toISOString(),
      reason: updated.reason,
    },
  });
}

// ================= DELETE: Удалить блокировку =================

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  // Получаем существующую блокировку
  const existing = await prisma.unavailability.findUnique({
    where: { id },
    include: { doctor: true },
  });

  if (!existing) {
    return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  }

  // Проверка прав доступа
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });

  const isOwner = existing.doctor.userId === session.user.id;
  const isAdmin = user?.role === "ADMIN";

  if (!isOwner && !isAdmin) {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  }

  // Удаление
  await prisma.unavailability.delete({
    where: { id },
  });

  return NextResponse.json({ ok: true });
}
