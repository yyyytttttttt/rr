import { NextRequest, NextResponse } from "next/server";
import { requireAuth, createCorsResponse } from "../../../../../../lib/jwt";
import { prisma } from "../../../../../../lib/prizma";
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

// GET - Admin gets service details
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = requireAuth(req, ['ADMIN']);

  if ('error' in auth) {
    return auth.error;
  }

  if (auth.payload.role !== 'ADMIN') {
    return NextResponse.json({ error: "Доступ запрещен" }, { status: 403 });
  }

  const { id } = await params;
  console.log("[MOBILE_ADMIN_SERVICE_GET] GET request for service:", id);

  try {
    const service = await prisma.service.findUnique({
      where: { id },
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
    });

    if (!service) {
      return NextResponse.json({ error: "Услуга не найдена" }, { status: 404 });
    }

    console.log("[MOBILE_ADMIN_SERVICE_GET] Found service:", service.id);
    return NextResponse.json({ service });
  } catch (error) {
    console.error("[MOBILE_ADMIN_SERVICE_GET] Error:", error);
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = requireAuth(req, ['ADMIN']);

  if ('error' in auth) {
    return auth.error;
  }

  if (auth.payload.role !== 'ADMIN') {
    return NextResponse.json({ error: "Доступ запрещен" }, { status: 403 });
  }

  const { id } = await params;
  console.log("[MOBILE_ADMIN_SERVICE_UPDATE] PUT request for service:", id);

  const body = await req.json();
  const parsed = serviceSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Ошибка валидации", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const data = parsed.data;

  const service = await prisma.service.update({
    where: { id },
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
    },
  });

  console.log("[MOBILE_ADMIN_SERVICE_UPDATE] Updated service:", service.id);
  return NextResponse.json({ ok: true, service });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = requireAuth(req, ['ADMIN']);

  if ('error' in auth) {
    return auth.error;
  }

  if (auth.payload.role !== 'ADMIN') {
    return NextResponse.json({ error: "Доступ запрещен" }, { status: 403 });
  }

  const { id } = await params;
  console.log("[MOBILE_ADMIN_SERVICE_DELETE] DELETE request for service:", id);

  // Check for active bookings
  const activeBookings = await prisma.booking.count({
    where: {
      serviceId: id,
      status: { in: ["PENDING", "CONFIRMED"] },
      startUtc: { gte: new Date() },
    },
  });

  if (activeBookings > 0) {
    return NextResponse.json(
      { error: "Невозможно удалить услугу с активными записями" },
      { status: 409 }
    );
  }

  await prisma.service.delete({ where: { id } });

  console.log("[MOBILE_ADMIN_SERVICE_DELETE] Deleted service:", id);
  return NextResponse.json({ ok: true });
}
