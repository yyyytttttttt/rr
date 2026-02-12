import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../../../lib/auth";
import { prisma } from "../../../../../lib/prizma";
import { z } from "zod";
import { serverError } from "../../../../../lib/api-error";

/**
 * GET /api/admin/services/categories
 * Получить список всех категорий для администратора
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
    }

    const categories = await prisma.serviceCategory.findMany({
      select: {
        id: true,
        name: true,
        description: true,
        icon: true,
        sortOrder: true,
        isActive: true,
        createdAt: true,
        _count: {
          select: {
            services: true,
          },
        },
      },
      orderBy: {
        sortOrder: "asc",
      },
    });

    return NextResponse.json({ categories });
  } catch (error: unknown) {
    return serverError('GET_CATEGORIES_ERROR', error);
  }
}

const createCategorySchema = z.object({
  name: z.string().min(1, "Название обязательно"),
  description: z.string().optional(),
  icon: z.string().optional(),
  sortOrder: z.number().int().min(0).optional().default(0),
  isActive: z.boolean().optional().default(true),
});

/**
 * POST /api/admin/services/categories
 * Создать новую категорию услуг
 */
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
    }

    const json = await req.json();
    const parsed = createCategorySchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "VALIDATION", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { name, description, icon, sortOrder, isActive } = parsed.data;

    const category = await prisma.serviceCategory.create({
      data: {
        name,
        description: description ?? null,
        icon: icon ?? null,
        sortOrder: sortOrder ?? 0,
        isActive: isActive ?? true,
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

    return NextResponse.json({ ok: true, category }, { status: 201 });
  } catch (error: unknown) {
    return serverError('CREATE_CATEGORY_ERROR', error);
  }
}
