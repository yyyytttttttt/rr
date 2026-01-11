import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../../../lib/prizma";
import { z } from "zod";
import { requireAuth, createCorsResponse } from "../../../../../lib/jwt";

// Обработка OPTIONS для CORS preflight
export async function OPTIONS(request: NextRequest) {
  return createCorsResponse(request);
}

// ================= Схемы валидации =================

const SlotSchema = z.object({
  dayOfWeek: z.number().int().min(0).max(6),
  startTime: z.string().regex(/^\d{2}:\d{2}$/), // HH:MM
  endTime: z.string().regex(/^\d{2}:\d{2}$/),
  slotDurationMin: z.number().int().min(5).max(480).default(30),
  bufferMinOverride: z.number().int().min(0).optional().nullable(),
});

const CreateTemplateSchema = z.object({
  action: z.literal("create"),
  doctorId: z.string(),
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional().nullable(),
  slots: z.array(SlotSchema),
});

const UpdateTemplateSchema = z.object({
  action: z.literal("update"),
  id: z.string(),
  doctorId: z.string(),
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional().nullable(),
  isActive: z.boolean().optional(),
  slots: z.array(SlotSchema).optional(),
});

const DeleteTemplateSchema = z.object({
  action: z.literal("delete"),
  id: z.string(),
  doctorId: z.string(),
});

type Body = z.infer<typeof CreateTemplateSchema> | z.infer<typeof UpdateTemplateSchema> | z.infer<typeof DeleteTemplateSchema>;

// ================= GET: Получить все шаблоны врача =================

export async function GET(req: NextRequest) {
  const auth = requireAuth(req, ['DOCTOR', 'ADMIN']);

  if ('error' in auth) {
    return auth.error;
  }

  const { userId, role } = auth.payload;
  const url = new URL(req.url);
  const doctorId = url.searchParams.get("doctorId");

  if (!doctorId) {
    return NextResponse.json({ error: "ID врача не указан" }, { status: 400 });
  }

  const isAdmin = role === "ADMIN";

  // Если не админ, проверяем что это свой профиль
  if (!isAdmin) {
    const me = await prisma.doctor.findFirst({
      where: { userId },
      select: { id: true },
    });

    if (!me || doctorId !== me.id) {
      console.warn(`[MOBILE_TEMPLATES] Попытка доступа к чужим шаблонам: userId=${userId}, doctorId=${doctorId}`);
      return NextResponse.json({ error: "Доступ запрещен" }, { status: 403 });
    }
  }

  try {
    const templates = await prisma.weeklyTemplate.findMany({
      where: { doctorId },
      include: {
        slots: {
          orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
        },
      },
      orderBy: { createdAt: "desc" },
    });

    console.info(`[MOBILE_TEMPLATES] Получено шаблонов: ${templates.length} для doctorId=${doctorId}`);
    return NextResponse.json({ templates });
  } catch (error) {
    console.error("[MOBILE_TEMPLATES] Ошибка при получении шаблонов:", error);
    return NextResponse.json(
      { error: "Ошибка при получении шаблонов" },
      { status: 500 }
    );
  }
}

// ================= POST: Создать/обновить/удалить шаблон =================

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

  if (!targetDoctorId) {
    return NextResponse.json({ error: "ID врача не указан" }, { status: 400 });
  }

  const isAdmin = role === "ADMIN";

  // Если не админ, проверяем что это свой профиль
  if (!isAdmin) {
    const me = await prisma.doctor.findFirst({
      where: { userId },
      select: { id: true },
    });

    if (!me || me.id !== targetDoctorId) {
      console.warn(`[MOBILE_TEMPLATES] Попытка изменения чужих шаблонов: userId=${userId}, targetDoctorId=${targetDoctorId}`);
      return NextResponse.json({ error: "Доступ запрещен" }, { status: 403 });
    }
  }

  try {
    // ================= CREATE =================
    if (body.action === "create") {
      const p = CreateTemplateSchema.safeParse(body);
      if (!p.success) {
        console.warn("[MOBILE_TEMPLATES] Ошибка валидации при создании:", p.error);
        return NextResponse.json({ error: "Ошибка валидации данных", details: p.error }, { status: 400 });
      }

      const { doctorId, name, description, slots } = p.data;

      // Валидация времени
      for (const slot of slots) {
        if (slot.startTime >= slot.endTime) {
          console.warn(`[MOBILE_TEMPLATES] Неверный временной диапазон: ${slot.startTime} >= ${slot.endTime}`);
          return NextResponse.json({ error: "Время начала должно быть раньше времени окончания", slot }, { status: 400 });
        }
      }

      const template = await prisma.weeklyTemplate.create({
        data: {
          doctorId,
          name,
          description,
          slots: {
            create: slots.map((slot) => ({
              dayOfWeek: slot.dayOfWeek,
              startTime: slot.startTime,
              endTime: slot.endTime,
              slotDurationMin: slot.slotDurationMin,
              bufferMinOverride: slot.bufferMinOverride,
            })),
          },
        },
        include: { slots: true },
      });

      console.info(`[MOBILE_TEMPLATES] Шаблон создан: id=${template.id}, name=${name}, doctorId=${doctorId}`);
      return NextResponse.json({ ok: true, template });
    }

    // ================= UPDATE =================
    if (body.action === "update") {
      const p = UpdateTemplateSchema.safeParse(body);
      if (!p.success) {
        console.warn("[MOBILE_TEMPLATES] Ошибка валидации при обновлении:", p.error);
        return NextResponse.json({ error: "Ошибка валидации данных", details: p.error }, { status: 400 });
      }

      const { id, doctorId, name, description, isActive, slots } = p.data;

      // Проверка принадлежности
      const existing = await prisma.weeklyTemplate.findFirst({
        where: { id, doctorId: targetDoctorId },
      });

      if (!existing) {
        console.warn(`[MOBILE_TEMPLATES] Шаблон не найден при обновлении: id=${id}, doctorId=${targetDoctorId}`);
        return NextResponse.json({ error: "Шаблон не найден" }, { status: 404 });
      }

      // Валидация времени если есть slots
      if (slots) {
        for (const slot of slots) {
          if (slot.startTime >= slot.endTime) {
            console.warn(`[MOBILE_TEMPLATES] Неверный временной диапазон при обновлении: ${slot.startTime} >= ${slot.endTime}`);
            return NextResponse.json({ error: "Время начала должно быть раньше времени окончания", slot }, { status: 400 });
          }
        }
      }

      // Обновление
      const updateData: any = {};
      if (name !== undefined) updateData.name = name;
      if (description !== undefined) updateData.description = description;
      if (isActive !== undefined) updateData.isActive = isActive;

      const template = await prisma.weeklyTemplate.update({
        where: { id },
        data: updateData,
        include: { slots: true },
      });

      // Если переданы slots, заменяем все слоты
      if (slots) {
        await prisma.templateSlot.deleteMany({ where: { templateId: id } });
        await prisma.templateSlot.createMany({
          data: slots.map((slot) => ({
            templateId: id,
            dayOfWeek: slot.dayOfWeek,
            startTime: slot.startTime,
            endTime: slot.endTime,
            slotDurationMin: slot.slotDurationMin,
            bufferMinOverride: slot.bufferMinOverride,
          })),
        });

        // Перезагружаем с новыми слотами
        const updated = await prisma.weeklyTemplate.findUnique({
          where: { id },
          include: { slots: true },
        });

        console.info(`[MOBILE_TEMPLATES] Шаблон обновлен со слотами: id=${id}, doctorId=${doctorId}`);
        return NextResponse.json({ ok: true, template: updated });
      }

      console.info(`[MOBILE_TEMPLATES] Шаблон обновлен: id=${id}, doctorId=${doctorId}`);
      return NextResponse.json({ ok: true, template });
    }

    // ================= DELETE =================
    if (body.action === "delete") {
      const p = DeleteTemplateSchema.safeParse(body);
      if (!p.success) {
        console.warn("[MOBILE_TEMPLATES] Ошибка валидации при удалении:", p.error);
        return NextResponse.json({ error: "Ошибка валидации данных" }, { status: 400 });
      }

      const { id, doctorId } = p.data;

      // Проверка принадлежности
      const existing = await prisma.weeklyTemplate.findFirst({
        where: { id, doctorId: targetDoctorId },
      });

      if (!existing) {
        console.warn(`[MOBILE_TEMPLATES] Шаблон не найден при удалении: id=${id}, doctorId=${targetDoctorId}`);
        return NextResponse.json({ error: "Шаблон не найден" }, { status: 404 });
      }

      await prisma.weeklyTemplate.delete({ where: { id } });

      console.info(`[MOBILE_TEMPLATES] Шаблон удален: id=${id}, doctorId=${doctorId}`);
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: "Неизвестное действие" }, { status: 400 });
  } catch (error) {
    console.error("[MOBILE_TEMPLATES] Ошибка:", error);
    return NextResponse.json(
      { error: "Ошибка сервера при обработке запроса" },
      { status: 500 }
    );
  }
}
