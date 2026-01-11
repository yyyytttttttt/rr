import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../../../../lib/prizma";
import { z } from "zod";
import { requireAuth, createCorsResponse } from "../../../../../../lib/jwt";

// Обработка OPTIONS для CORS preflight
export async function OPTIONS(request: NextRequest) {
  return createCorsResponse(request);
}

const Create = z.object({
  action: z.literal("create"),
  doctorId: z.string(),
  start: z.coerce.date(),
  end: z.coerce.date(),
});

const Update = z.object({
  action: z.literal("update"),
  id: z.string(),
  doctorId: z.string(),
  start: z.coerce.date(),
  end: z.coerce.date(),
});

const Delete = z.object({
  action: z.literal("delete"),
  id: z.string(),
  doctorId: z.string(),
});

type Body = z.infer<typeof Create> | z.infer<typeof Update> | z.infer<typeof Delete>;

export async function POST(req: NextRequest) {
  const auth = requireAuth(req, ['DOCTOR', 'ADMIN']);

  if ('error' in auth) {
    return auth.error;
  }

  const body = (await req.json().catch(() => null)) as Body | null;
  if (!body?.action) {
    return NextResponse.json({ error: "Действие не указано" }, { status: 400 });
  }

  const { userId, role } = auth.payload;
  const targetDoctorId = (body as any).doctorId;

  // Проверка прав доступа
  const isAdmin = role === "ADMIN";

  if (!isAdmin) {
    const me = await prisma.doctor.findFirst({
      where: { userId },
      select: { id: true },
    });

    if (!me || me.id !== targetDoctorId) {
      console.warn(`[MOBILE_OPENINGS_EDIT] Попытка доступа к чужим данным: userId=${userId}, targetDoctorId=${targetDoctorId}`);
      return NextResponse.json({ error: "Доступ запрещен" }, { status: 403 });
    }
  }

  try {
    if (body.action === "create") {
      const p = Create.safeParse(body);
      if (!p.success) {
        console.warn("[MOBILE_OPENINGS_EDIT] Ошибка валидации при создании:", p.error);
        return NextResponse.json({ error: "Ошибка валидации данных" }, { status: 400 });
      }

      const { doctorId, start, end } = p.data;

      // Проверки дат
      const startDate = new Date(start);
      const endDate = new Date(end);
      if (Number.isNaN(startDate.getTime())) {
        return NextResponse.json({ error: "Неверная дата начала" }, { status: 400 });
      }
      if (Number.isNaN(endDate.getTime())) {
        return NextResponse.json({ error: "Неверная дата окончания" }, { status: 400 });
      }
      if (startDate >= endDate) {
        return NextResponse.json({ error: "Дата начала должна быть раньше даты окончания" }, { status: 400 });
      }
      if (startDate < new Date()) {
        return NextResponse.json({ error: "Нельзя создавать окна приёма в прошлом" }, { status: 400 });
      }

      // Конфликт с бронями
      const conflict = await prisma.booking.findFirst({
        where: {
          doctorId,
          status: { in: ["PENDING", "CONFIRMED"] },
          startUtc: { lt: endDate },
          endUtc: { gt: startDate },
        },
        select: { id: true },
      });

      if (conflict) {
        console.warn(`[MOBILE_OPENINGS_EDIT] Конфликт с бронированием: doctorId=${doctorId}, booking=${conflict.id}`);
        return NextResponse.json({ error: "В это время уже есть бронирования" }, { status: 409 });
      }

      // Пересечение с другими окнами
      const openingOverlap = await prisma.opening.findFirst({
        where: {
          doctorId,
          startUtc: { lt: endDate },
          endUtc: { gt: startDate },
        },
        select: { id: true },
      });

      if (openingOverlap) {
        console.warn(`[MOBILE_OPENINGS_EDIT] Пересечение с окном приёма: doctorId=${doctorId}, opening=${openingOverlap.id}`);
        return NextResponse.json({ error: "Время пересекается с другим окном приёма" }, { status: 409 });
      }

      const created = await prisma.opening.create({
        data: { doctorId, startUtc: startDate, endUtc: endDate },
      });

      console.info(`[MOBILE_OPENINGS_EDIT] Окно приёма создано: id=${created.id}, doctorId=${doctorId}`);
      return NextResponse.json({ ok: true, id: created.id });
    }

    if (body.action === "update") {
      const p = Update.safeParse(body);
      if (!p.success) {
        console.warn("[MOBILE_OPENINGS_EDIT] Ошибка валидации при обновлении:", p.error);
        return NextResponse.json({ error: "Ошибка валидации данных" }, { status: 400 });
      }

      const { id, doctorId, start, end } = p.data;

      // Проверки дат
      const startDate = new Date(start);
      const endDate = new Date(end);
      if (Number.isNaN(startDate.getTime())) {
        return NextResponse.json({ error: "Неверная дата начала" }, { status: 400 });
      }
      if (Number.isNaN(endDate.getTime())) {
        return NextResponse.json({ error: "Неверная дата окончания" }, { status: 400 });
      }
      if (startDate >= endDate) {
        return NextResponse.json({ error: "Дата начала должна быть раньше даты окончания" }, { status: 400 });
      }
      if (startDate < new Date()) {
        return NextResponse.json({ error: "Нельзя обновлять окна приёма в прошлом" }, { status: 400 });
      }

      // Конфликт с бронями
      const conflict = await prisma.booking.findFirst({
        where: {
          doctorId,
          status: { in: ["PENDING", "CONFIRMED"] },
          startUtc: { lt: endDate },
          endUtc: { gt: startDate },
        },
        select: { id: true },
      });

      if (conflict) {
        console.warn(`[MOBILE_OPENINGS_EDIT] Конфликт с бронированием при обновлении: doctorId=${doctorId}, booking=${conflict.id}`);
        return NextResponse.json({ error: "В это время уже есть бронирования" }, { status: 409 });
      }

      // Пересечение с другими окнами (кроме самого себя)
      const openingOverlap = await prisma.opening.findFirst({
        where: {
          doctorId,
          startUtc: { lt: endDate },
          endUtc: { gt: startDate },
          NOT: { id },
        },
        select: { id: true },
      });

      if (openingOverlap) {
        console.warn(`[MOBILE_OPENINGS_EDIT] Пересечение с окном приёма при обновлении: doctorId=${doctorId}, opening=${openingOverlap.id}`);
        return NextResponse.json({ error: "Время пересекается с другим окном приёма" }, { status: 409 });
      }

      const updated = await prisma.opening.updateMany({
        where: { id, doctorId: targetDoctorId },
        data: { startUtc: startDate, endUtc: endDate },
      });

      if (updated.count === 0) {
        console.warn(`[MOBILE_OPENINGS_EDIT] Окно приёма не найдено: id=${id}, doctorId=${targetDoctorId}`);
        return NextResponse.json({ error: "Окно приёма не найдено" }, { status: 404 });
      }

      console.info(`[MOBILE_OPENINGS_EDIT] Окно приёма обновлено: id=${id}, doctorId=${doctorId}`);
      return NextResponse.json({ ok: true });
    }

    if (body.action === "delete") {
      const p = Delete.safeParse(body);
      if (!p.success) {
        console.warn("[MOBILE_OPENINGS_EDIT] Ошибка валидации при удалении:", p.error);
        return NextResponse.json({ error: "Ошибка валидации данных" }, { status: 400 });
      }

      // Проверка существования окна
      const win = await prisma.opening.findFirst({
        where: { id: p.data.id, doctorId: targetDoctorId },
        select: { startUtc: true, endUtc: true },
      });

      if (!win) {
        console.warn(`[MOBILE_OPENINGS_EDIT] Окно приёма не найдено при удалении: id=${p.data.id}, doctorId=${targetDoctorId}`);
        return NextResponse.json({ error: "Окно приёма не найдено" }, { status: 404 });
      }

      // Запрет удаления, если есть активные брони
      const has = await prisma.booking.findFirst({
        where: {
          doctorId: p.data.doctorId,
          status: { in: ["PENDING", "CONFIRMED"] },
          startUtc: { lt: win.endUtc },
          endUtc: { gt: win.startUtc },
        },
        select: { id: true },
      });

      if (has) {
        console.warn(`[MOBILE_OPENINGS_EDIT] Попытка удалить окно с активными бронями: id=${p.data.id}, booking=${has.id}`);
        return NextResponse.json({ error: "Нельзя удалить окно приёма с активными бронированиями" }, { status: 409 });
      }

      const del = await prisma.opening.deleteMany({
        where: { id: p.data.id, doctorId: targetDoctorId },
      });

      if (del.count === 0) {
        return NextResponse.json({ error: "Окно приёма не найдено" }, { status: 404 });
      }

      console.info(`[MOBILE_OPENINGS_EDIT] Окно приёма удалено: id=${p.data.id}, doctorId=${targetDoctorId}`);
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: "Неизвестное действие" }, { status: 400 });
  } catch (error) {
    console.error("[MOBILE_OPENINGS_EDIT] Ошибка:", error);
    return NextResponse.json(
      { error: "Ошибка сервера при обработке запроса" },
      { status: 500 }
    );
  }
}
