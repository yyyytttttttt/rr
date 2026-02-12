import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prizma";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../../lib/auth";

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

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  const url = new URL(req.url);
  const doctorId = url.searchParams.get("doctorId");

  if (!doctorId) {
    return NextResponse.json({ error: "MISSING_DOCTOR_ID" }, { status: 400 });
  }

  // Check if user is admin
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });

  const isAdmin = user?.role === "ADMIN";

  // If not admin, check if user is the doctor
  if (!isAdmin) {
    const me = await prisma.doctor.findFirst({
      where: { userId: session.user.id },
      select: { id: true },
    });

    if (!me || doctorId !== me.id) {
      return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
    }
  }

  const templates = await prisma.weeklyTemplate.findMany({
    where: { doctorId },
    include: {
      slots: {
        orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ templates });
}

// ================= POST: Создать/обновить/удалить шаблон =================

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as Body | null;
  if (!body?.action) {
    return NextResponse.json({ error: "NO_ACTION" }, { status: 400 });
  }

  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  const targetDoctorId = (body as any).doctorId;

  if (!targetDoctorId) {
    return NextResponse.json({ error: "MISSING_DOCTOR_ID" }, { status: 400 });
  }

  // Check if user is admin
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });

  const isAdmin = user?.role === "ADMIN";

  // If not admin, check if user is the doctor
  if (!isAdmin) {
    const me = await prisma.doctor.findFirst({
      where: { userId: session.user.id },
      select: { id: true },
    });

    if (!me || me.id !== targetDoctorId) {
      return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
    }
  }

  // ================= CREATE =================
  if (body.action === "create") {
    const p = CreateTemplateSchema.safeParse(body);
    if (!p.success) {
      return NextResponse.json({ error: "VALIDATION", details: p.error }, { status: 400 });
    }

    const { doctorId, name, description, slots } = p.data;

    // Валидация времени
    for (const slot of slots) {
      if (slot.startTime >= slot.endTime) {
        return NextResponse.json({ error: "INVALID_TIME_RANGE", slot }, { status: 400 });
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

    return NextResponse.json({ ok: true, template });
  }

  // ================= UPDATE =================
  if (body.action === "update") {
    const p = UpdateTemplateSchema.safeParse(body);
    if (!p.success) {
      return NextResponse.json({ error: "VALIDATION", details: p.error }, { status: 400 });
    }

    const { id, doctorId, name, description, isActive, slots } = p.data;

    // Проверка принадлежности
    const existing = await prisma.weeklyTemplate.findFirst({
      where: { id, doctorId: targetDoctorId },
    });

    if (!existing) {
      return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
    }

    // Валидация времени если есть slots
    if (slots) {
      for (const slot of slots) {
        if (slot.startTime >= slot.endTime) {
          return NextResponse.json({ error: "INVALID_TIME_RANGE", slot }, { status: 400 });
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

      return NextResponse.json({ ok: true, template: updated });
    }

    return NextResponse.json({ ok: true, template });
  }

  // ================= DELETE =================
  if (body.action === "delete") {
    const p = DeleteTemplateSchema.safeParse(body);
    if (!p.success) {
      return NextResponse.json({ error: "VALIDATION" }, { status: 400 });
    }

    const { id, doctorId } = p.data;

    // Проверка принадлежности
    const existing = await prisma.weeklyTemplate.findFirst({
      where: { id, doctorId: targetDoctorId },
    });

    if (!existing) {
      return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
    }

    await prisma.weeklyTemplate.delete({ where: { id } });

    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "UNKNOWN_ACTION" }, { status: 400 });
}
