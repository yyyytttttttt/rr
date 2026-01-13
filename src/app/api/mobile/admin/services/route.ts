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

export async function GET(req: NextRequest) {
  const auth = requireAuth(req, ['ADMIN']);

  if ('error' in auth) {
    return auth.error;
  }

  if (auth.payload.role !== 'ADMIN') {
    return NextResponse.json({ error: "Доступ запрещен" }, { status: 403 });
  }

  const url = new URL(req.url);
  const q = (url.searchParams.get("query") ?? "").trim();
  const categoryId = url.searchParams.get("categoryId") || undefined;
  const page = Math.max(1, Number(url.searchParams.get("page") ?? 1));
  const pageSize = Math.min(100, Math.max(1, Number(url.searchParams.get("pageSize") ?? 20)));

  console.log("[MOBILE_ADMIN_SERVICES] GET - query:", q, "categoryId:", categoryId, "page:", page);

  try {
    const where: any = {};

    if (q) {
      where.OR = [
        { name: { contains: q, mode: "insensitive" as const } },
        { description: { contains: q, mode: "insensitive" as const } },
      ];
    }

    if (categoryId) {
      where.categoryId = categoryId;
    }

    const total = await prisma.service.count({ where });

    const services = await prisma.service.findMany({
      where,
      select: {
        id: true,
        name: true,
        description: true,
        priceCents: true,
        currency: true,
        durationMin: true,
        isActive: true,
        bufferMinOverride: true,
        categoryId: true,
        category: {
          select: {
            id: true,
            name: true,
            icon: true,
          },
        },
        createdAt: true,
        _count: {
          select: {
            doctorServices: {
              where: {
                isActive: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    console.log(`[MOBILE_ADMIN_SERVICES] Found ${services.length} services (total: ${total})`);

    return NextResponse.json({ items: services, total, page, pageSize });
  } catch (error) {
    console.error("[MOBILE_ADMIN_SERVICES] Error:", error);
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 });
  }
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
