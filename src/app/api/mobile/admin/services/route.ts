import { NextRequest, NextResponse } from "next/server";
import { requireAuth, createCorsResponse } from "../../../../../lib/jwt";
import { prisma } from "../../../../../lib/prizma";
import { z } from "zod";

const serviceSchema = z.object({
  name: z.string().min(1),
  description: z.string().nullable().optional(),
  priceCents: z.number().int().min(0),
  currency: z.string().min(1),
  durationMin: z.number().int().min(1),
  isActive: z.boolean().optional(),
  bufferMinOverride: z.number().int().min(0).nullable().optional(),
  categoryId: z.string().nullable().optional()
    .transform(v => v === "" || !v ? null : v),
});

// Обработка OPTIONS для CORS preflight
export async function OPTIONS(request: NextRequest) {
  return createCorsResponse(request);
}

// NOTE: Create service without initial doctor link (admin creates, then links doctors)
export async function POST(req: NextRequest) {
  const auth = requireAuth(req, ['ADMIN']);

  if ('error' in auth) {
    return auth.error;
  }

  if (auth.payload.role !== 'ADMIN') {
    return NextResponse.json({ error: "Доступ запрещен" }, { status: 403 });
  }

  console.log("[MOBILE_ADMIN_SERVICES] POST request by user:", auth.payload.userId);

  try {
    const body = await req.json();
    console.log("[MOBILE_ADMIN_SERVICES] Received body:", body);
    const parsed = serviceSchema.safeParse(body);

    if (!parsed.success) {
      console.error("[MOBILE_ADMIN_SERVICES] Validation failed:", parsed.error.flatten());
      return NextResponse.json(
        { error: "Ошибка валидации", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const data = parsed.data;

    const service = await prisma.service.create({
      data: {
        name: data.name,
        description: data.description ?? null,
        priceCents: data.priceCents,
        currency: data.currency,
        durationMin: data.durationMin,
        isActive: data.isActive ?? true,
        bufferMinOverride: data.bufferMinOverride ?? null,
        categoryId: data.categoryId ?? null,
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

    console.log("[MOBILE_ADMIN_SERVICES] Created service:", service.id);
    return NextResponse.json({ ok: true, service }, { status: 201 });
  } catch (e: any) {
    console.error("[MOBILE_ADMIN_SERVICES] CREATE_SERVICE_ERR", e);
    return NextResponse.json(
      { error: "INTERNAL", message: e?.message ?? "Неизвестная ошибка" },
      { status: 500 }
    );
  }
}
