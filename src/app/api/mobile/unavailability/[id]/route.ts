import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../../../lib/prizma";
import { z } from "zod";
import { requireAuth, createCorsResponse } from "../../../../../lib/jwt";
import { validateRRule } from "../../../../../lib/rrule";
import { UnavailabilityType } from "@prisma/client";

// Обработка OPTIONS для CORS preflight
export async function OPTIONS(request: NextRequest) {
  return createCorsResponse(request);
}

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
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = requireAuth(req, ['DOCTOR', 'ADMIN']);

  if ('error' in auth) {
    return auth.error;
  }

  const { id } = await params;
  const { userId, role } = auth.payload;

  const body = await req.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Тело запроса отсутствует" }, { status: 400 });
  }

  const p = UpdateUnavailabilitySchema.safeParse(body);
  if (!p.success) {
    console.warn("[MOBILE_UNAVAILABILITY_UPDATE] Ошибка валидации:", p.error);
    return NextResponse.json({ error: "Ошибка валидации данных", details: p.error }, { status: 400 });
  }

  try {
    // Получаем существующую блокировку
    const existing = await prisma.unavailability.findUnique({
      where: { id },
      include: { doctor: true },
    });

    if (!existing) {
      console.warn(`[MOBILE_UNAVAILABILITY_UPDATE] Блокировка не найдена: id=${id}`);
      return NextResponse.json({ error: "Блокировка не найдена" }, { status: 404 });
    }

    const isOwner = existing.doctor.userId === userId;
    const isAdmin = role === "ADMIN";

    // Проверка прав на редактирование
    const updatedType = p.data.type || existing.type;
    if (updatedType === "NO_BOOKINGS" && !isAdmin) {
      console.warn(`[MOBILE_UNAVAILABILITY_UPDATE] Попытка изменить NO_BOOKINGS без прав админа: userId=${userId}`);
      return NextResponse.json({ error: "Только администратор может управлять блокировками типа NO_BOOKINGS" }, { status: 403 });
    }

    if (!isOwner && !isAdmin) {
      console.warn(`[MOBILE_UNAVAILABILITY_UPDATE] Попытка изменить чужую блокировку: userId=${userId}, blockId=${id}`);
      return NextResponse.json({ error: "Доступ запрещен" }, { status: 403 });
    }

    // Парсинг дат
    const updateData: any = {};

    if (p.data.start) {
      const startDate = new Date(p.data.start);
      if (isNaN(startDate.getTime())) {
        return NextResponse.json({ error: "Неверный формат даты начала" }, { status: 400 });
      }
      updateData.start = startDate;
    }

    if (p.data.end) {
      const endDate = new Date(p.data.end);
      if (isNaN(endDate.getTime())) {
        return NextResponse.json({ error: "Неверный формат даты окончания" }, { status: 400 });
      }
      updateData.end = endDate;
    }

    // Валидация: end > start
    const finalStart = updateData.start || existing.start;
    const finalEnd = updateData.end || existing.end;

    if (finalEnd <= finalStart) {
      return NextResponse.json({ error: "Дата окончания должна быть позже даты начала" }, { status: 400 });
    }

    // Валидация RRULE
    if (p.data.rrule !== undefined) {
      if (p.data.rrule) {
        const validation = validateRRule(p.data.rrule);
        if (!validation.valid) {
          console.warn(`[MOBILE_UNAVAILABILITY_UPDATE] Неверный RRULE: ${validation.error}`);
          return NextResponse.json({ error: "Неверный формат правила повторения", message: validation.error }, { status: 400 });
        }
      }
      updateData.rrule = p.data.rrule;
    }

    // Парсинг rruleUntil
    if (p.data.rruleUntil !== undefined) {
      if (p.data.rruleUntil) {
        const rruleUntilDate = new Date(p.data.rruleUntil);
        if (isNaN(rruleUntilDate.getTime())) {
          return NextResponse.json({ error: "Неверный формат даты окончания повторения" }, { status: 400 });
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

    console.info(`[MOBILE_UNAVAILABILITY_UPDATE] Блокировка обновлена: id=${id}`);

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
  } catch (error) {
    console.error("[MOBILE_UNAVAILABILITY_UPDATE] Ошибка:", error);
    return NextResponse.json(
      { error: "Ошибка сервера при обновлении блокировки" },
      { status: 500 }
    );
  }
}

// ================= DELETE: Удалить блокировку =================

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = requireAuth(req, ['DOCTOR', 'ADMIN']);

  if ('error' in auth) {
    return auth.error;
  }

  const { id } = await params;
  const { userId, role } = auth.payload;

  try {
    // Получаем существующую блокировку
    const existing = await prisma.unavailability.findUnique({
      where: { id },
      include: { doctor: true },
    });

    if (!existing) {
      console.warn(`[MOBILE_UNAVAILABILITY_DELETE] Блокировка не найдена: id=${id}`);
      return NextResponse.json({ error: "Блокировка не найдена" }, { status: 404 });
    }

    const isOwner = existing.doctor.userId === userId;
    const isAdmin = role === "ADMIN";

    if (!isOwner && !isAdmin) {
      console.warn(`[MOBILE_UNAVAILABILITY_DELETE] Попытка удалить чужую блокировку: userId=${userId}, blockId=${id}`);
      return NextResponse.json({ error: "Доступ запрещен" }, { status: 403 });
    }

    // Удаление
    await prisma.unavailability.delete({
      where: { id },
    });

    console.info(`[MOBILE_UNAVAILABILITY_DELETE] Блокировка удалена: id=${id}`);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[MOBILE_UNAVAILABILITY_DELETE] Ошибка:", error);
    return NextResponse.json(
      { error: "Ошибка сервера при удалении блокировки" },
      { status: 500 }
    );
  }
}
