import { NextRequest, NextResponse } from "next/server";
import { requireAuth, createCorsResponse } from "../../../../lib/jwt";
import { prisma } from "../../../../lib/prizma";
import { z } from "zod";
import { serverError } from "../../../../lib/api-error";

const bodySchema = z.object({
  doctorId: z.string().min(1),
  name: z.string().min(1),
  description: z.string().optional(),
  priceCents: z.number().int().min(0),
  currency: z.string().min(1),
  durationMin: z.number().int().min(1),
  isActive: z.boolean().optional().default(true),
  bufferMinOverride: z.number().int().min(0).optional(),
});

// Обработка OPTIONS для CORS preflight
export async function OPTIONS(request: NextRequest) {
  return createCorsResponse(request);
}

export async function POST(req: NextRequest) {
  const auth = requireAuth(req, ['ADMIN', 'DOCTOR']);

  if ('error' in auth) {
    return auth.error;
  }

  console.log("[MOBILE_SERVICES] POST request - creating new service");

  try {
    const json = await req.json();
    const parsed = bodySchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Ошибка валидации", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const {
      doctorId, name, description, priceCents, currency,
      durationMin, isActive, bufferMinOverride,
    } = parsed.data;

    // Проверяем существование врача
    const doc = await prisma.doctor.findUnique({
      where: { id: doctorId },
      select: { id: true, userId: true }
    });

    if (!doc) {
      return NextResponse.json({ error: "Врач не найден" }, { status: 404 });
    }

    // DOCTOR can only create services for themselves
    if (auth.payload.role === "DOCTOR" && doc.userId !== auth.payload.userId) {
      return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
    }

    // Создаем услугу и связываем с врачом
    const service = await prisma.service.create({
      data: {
        name,
        description: description ?? null,
        priceCents,
        currency,
        durationMin,
        isActive: isActive ?? true,
        bufferMinOverride: bufferMinOverride ?? null,
        doctorServices: {
          create: [{ doctorId }]
        }
      },
      select: {
        id: true,
        name: true,
        description: true,
        priceCents: true,
        currency: true,
        durationMin: true,
        isActive: true,
        bufferMinOverride: true,
        createdAt: true,
      },
    });

    console.log("[MOBILE_SERVICES] Created service:", service.id);

    return NextResponse.json({ ok: true, service }, { status: 201 });
  } catch (e: unknown) {
    return serverError('[MOBILE_SERVICES] Error creating service', e);
  }
}
