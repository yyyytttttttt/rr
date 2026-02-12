import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../../../../lib/auth";
import { prisma } from "../../../../../../lib/prizma";
import { z } from "zod";
import { serverError } from "../../../../../../lib/api-error";

const updateCategorySchema = z.object({
  name: z.string().min(1, "Название обязательно"),
  description: z.string().optional(),
  icon: z.string().optional(),
  sortOrder: z.number().int().min(0).optional(),
  isActive: z.boolean().optional(),
});

/**
 * PUT /api/admin/services/categories/[id]
 * Обновить категорию услуг
 */
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
    }

    const { id } = await params;

    const json = await req.json();
    const parsed = updateCategorySchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "VALIDATION", details: parsed.error.flatten() },
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
      return NextResponse.json({ error: "CATEGORY_NOT_FOUND" }, { status: 404 });
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

    return NextResponse.json({ ok: true, category });
  } catch (error: unknown) {
    return serverError('UPDATE_CATEGORY_ERROR', error);
  }
}

/**
 * DELETE /api/admin/services/categories/[id]
 * Удалить категорию услуг
 */
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
    }

    const { id } = await params;

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
      return NextResponse.json({ error: "CATEGORY_NOT_FOUND" }, { status: 404 });
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

    return NextResponse.json({ ok: true });
  } catch (error: unknown) {
    return serverError('DELETE_CATEGORY_ERROR', error);
  }
}
