import { NextRequest, NextResponse } from "next/server";
import { requireAuth, createCorsResponse } from "../../../../../../../lib/jwt";
import { prisma } from "../../../../../../../lib/prizma";
import { z } from "zod";

const updateCategorySchema = z.object({
  name: z.string().min(1, "Название обязательно"),
  description: z.string().optional(),
  icon: z.string().optional(),
  sortOrder: z.number().int().min(0).optional(),
  isActive: z.boolean().optional(),
});

// Обработка OPTIONS для CORS preflight
export async function OPTIONS(request: NextRequest) {
  return createCorsResponse(request);
}

/**
 * PUT /api/mobile/admin/services/categories/[id]
 * Обновить категорию услуг
 */
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = requireAuth(req, ['ADMIN']);

    if ('error' in auth) {
      return auth.error;
    }

    if (auth.payload.role !== "ADMIN") {
      return NextResponse.json({ error: "Доступ запрещен" }, { status: 401 });
    }

    const { id } = await params;
    console.log("[MOBILE_ADMIN_CATEGORY_UPDATE] PUT request for category:", id);

    const json = await req.json();
    const parsed = updateCategorySchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Ошибка валидации", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { name, description, icon, sortOrder, isActive } = parsed.data;

    // Проверяем, существует ли категория
    const existing = await prisma.serviceCategory.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!existing) {
      return NextResponse.json({ error: "Категория не найдена" }, { status: 404 });
    }

    const category = await prisma.serviceCategory.update({
      where: { id },
      data: {
        name,
        description: description ?? null,
        icon: icon ?? null,
        ...(sortOrder !== undefined && { sortOrder }),
        ...(isActive !== undefined && { isActive }),
      },
      select: {
        id: true,
        name: true,
        description: true,
        icon: true,
        sortOrder: true,
        isActive: true,
        createdAt: true,
      },
    });

    console.log("[MOBILE_ADMIN_CATEGORY_UPDATE] Updated category:", category.id);
    return NextResponse.json({ ok: true, category });
  } catch (error: any) {
    console.error("[MOBILE_ADMIN_CATEGORY_UPDATE] UPDATE_CATEGORY_ERROR", error);
    return NextResponse.json(
      { error: "INTERNAL", message: error?.message ?? "Неизвестная ошибка" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/mobile/admin/services/categories/[id]
 * Удалить категорию услуг
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = requireAuth(req, ['ADMIN']);

    if ('error' in auth) {
      return auth.error;
    }

    if (auth.payload.role !== "ADMIN") {
      return NextResponse.json({ error: "Доступ запрещен" }, { status: 401 });
    }

    const { id } = await params;
    console.log("[MOBILE_ADMIN_CATEGORY_DELETE] DELETE request for category:", id);

    // Проверяем, существует ли категория
    const existing = await prisma.serviceCategory.findUnique({
      where: { id },
      select: {
        id: true,
        _count: {
          select: {
            services: true,
          },
        },
      },
    });

    if (!existing) {
      return NextResponse.json({ error: "Категория не найдена" }, { status: 404 });
    }

    // Предупреждаем, если у категории есть связанные услуги
    if (existing._count.services > 0) {
      return NextResponse.json(
        {
          error: "CATEGORY_HAS_SERVICES",
          message: `У категории есть ${existing._count.services} услуг(и). При удалении они будут отвязаны от категории.`,
        },
        { status: 400 }
      );
    }

    await prisma.serviceCategory.delete({
      where: { id },
    });

    console.log("[MOBILE_ADMIN_CATEGORY_DELETE] Deleted category:", id);
    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error("[MOBILE_ADMIN_CATEGORY_DELETE] DELETE_CATEGORY_ERROR", error);
    return NextResponse.json(
      { error: "INTERNAL", message: error?.message ?? "Неизвестная ошибка" },
      { status: 500 }
    );
  }
}
