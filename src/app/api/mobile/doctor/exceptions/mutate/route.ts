import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../../../../lib/prizma";
import { requireAuth, createCorsResponse } from "../../../../../../lib/jwt";
import { z } from "zod";
import { serverError } from "../../../../../../lib/api-error";

// Обработка OPTIONS для CORS preflight
export async function OPTIONS(request: NextRequest) {
  return createCorsResponse(request);
}

const Create = z.object({
  action: z.literal("create"),
  start: z.string().datetime('Неверный формат даты начала'),
  end: z.string().datetime('Неверный формат даты окончания'),
  reason: z.string().trim().max(200, 'Причина не должна превышать 200 символов').optional(),
});

const Update = z.object({
  action: z.literal("update"),
  id: z.string().min(1, 'Укажите ID исключения'),
  start: z.string().datetime('Неверный формат даты начала'),
  end: z.string().datetime('Неверный формат даты окончания'),
  reason: z.string().trim().max(200, 'Причина не должна превышать 200 символов').optional(),
});

const Delete = z.object({
  action: z.literal("delete"),
  id: z.string().min(1, 'Укажите ID исключения'),
});

const Body = z.discriminatedUnion("action", [Create, Update, Delete]);

/**
 * POST /api/mobile/doctor/exceptions/mutate
 * Создание, обновление или удаление исключений (блокировок времени) для врача
 * Требует JWT авторизацию и роль DOCTOR
 *
 * Actions:
 * - create: создать новое исключение (отпуск, перерыв и т.д.)
 * - update: обновить существующее исключение
 * - delete: удалить исключение
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

    const body = parsed.data;

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

    // CREATE ACTION
    if (body.action === "create") {
      const start = new Date(body.start);
      const end = new Date(body.end);

      // Проверка: начало раньше конца
      if (start >= end) {
        return NextResponse.json({
          error: "Время начала должно быть раньше времени окончания"
        }, { status: 400 });
      }

      // Проверка: нет ли активных записей в этом диапазоне
      const conflict = await prisma.booking.findFirst({
        where: {
          doctorId: doctor.id,
          status: { in: ["PENDING", "CONFIRMED"] },
          startUtc: { lt: end },
          endUtc: { gt: start },
        },
        select: { id: true, startUtc: true, clientName: true },
      });

      if (conflict) {
        return NextResponse.json({
          error: "В указанное время уже есть активные записи",
          conflictBooking: {
            id: conflict.id,
            start: conflict.startUtc,
            clientName: conflict.clientName,
          }
        }, { status: 409 });
      }

      // Создаем исключение
      const created = await prisma.exception.create({
        data: {
          doctorId: doctor.id,
          startUtc: start,
          endUtc: end,
          reason: body.reason || null,
        },
        select: {
          id: true,
          startUtc: true,
          endUtc: true,
          reason: true,
        },
      });

      console.log(`[MOBILE_DOCTOR_EXCEPTIONS] Created exception ${created.id} for doctor ${doctor.id}`);

      return NextResponse.json({
        success: true,
        message: 'Исключение успешно создано',
        exception: created
      }, { status: 201 });
    }

    // UPDATE ACTION
    if (body.action === "update") {
      const start = new Date(body.start);
      const end = new Date(body.end);

      // Проверка: начало раньше конца
      if (start >= end) {
        return NextResponse.json({
          error: "Время начала должно быть раньше времени окончания"
        }, { status: 400 });
      }

      // Проверка: существует ли исключение
      const existing = await prisma.exception.findFirst({
        where: { id: body.id, doctorId: doctor.id },
        select: { id: true },
      });

      if (!existing) {
        return NextResponse.json({
          error: "Исключение не найдено или не принадлежит этому врачу"
        }, { status: 404 });
      }

      // Проверка: нет ли активных записей в новом диапазоне
      const conflict = await prisma.booking.findFirst({
        where: {
          doctorId: doctor.id,
          status: { in: ["PENDING", "CONFIRMED"] },
          startUtc: { lt: end },
          endUtc: { gt: start },
        },
        select: { id: true },
      });

      if (conflict) {
        return NextResponse.json({
          error: "В новом диапазоне времени есть активные записи"
        }, { status: 409 });
      }

      // Обновляем исключение
      const updated = await prisma.exception.update({
        where: { id: body.id },
        data: {
          startUtc: start,
          endUtc: end,
          reason: body.reason || null,
        },
        select: {
          id: true,
          startUtc: true,
          endUtc: true,
          reason: true,
        },
      });

      console.log(`[MOBILE_DOCTOR_EXCEPTIONS] Updated exception ${updated.id}`);

      return NextResponse.json({
        success: true,
        message: 'Исключение успешно обновлено',
        exception: updated
      });
    }

    // DELETE ACTION
    if (body.action === "delete") {
      // Проверка: существует ли исключение
      const existing = await prisma.exception.findFirst({
        where: { id: body.id, doctorId: doctor.id },
        select: { id: true, startUtc: true, endUtc: true },
      });

      if (!existing) {
        return NextResponse.json({
          error: "Исключение не найдено или не принадлежит этому врачу"
        }, { status: 404 });
      }

      // Проверка: нет ли активных записей в этом диапазоне
      const conflict = await prisma.booking.findFirst({
        where: {
          doctorId: doctor.id,
          status: { in: ["PENDING", "CONFIRMED"] },
          startUtc: { lt: existing.endUtc },
          endUtc: { gt: existing.startUtc },
        },
        select: { id: true },
      });

      if (conflict) {
        return NextResponse.json({
          error: "Нельзя удалить исключение - в это время есть активные записи"
        }, { status: 409 });
      }

      // Удаляем исключение
      await prisma.exception.delete({
        where: { id: body.id },
      });

      console.log(`[MOBILE_DOCTOR_EXCEPTIONS] Deleted exception ${body.id}`);

      return NextResponse.json({
        success: true,
        message: 'Исключение успешно удалено'
      });
    }

    // Не должно сюда дойти (discriminated union гарантирует)
    return NextResponse.json({
      error: "Неизвестное действие"
    }, { status: 400 });

  } catch (error) {
    return serverError('[MOBILE_DOCTOR_EXCEPTIONS] Error', error);
  }
}
