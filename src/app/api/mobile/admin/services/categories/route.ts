import { NextRequest, NextResponse } from "next/server";
import { requireAuth, createCorsResponse } from "../../../../../../lib/jwt";
import { prisma } from "../../../../../../lib/prizma";
import { z } from "zod";
import { serverError } from "../../../../../../lib/api-error";

const createCategorySchema = z.object({
  name: z.string().min(1, "Название обязательно"),
  description: z.string().optional(),
  icon: z.string().optional(),
  sortOrder: z.number().int().min(0).optional().default(0),
  isActive: z.boolean().optional().default(true),
});

// Обработка OPTIONS для CORS preflight
export async function OPTIONS(request: NextRequest) {
  return createCorsResponse(request);
}

/**
 * GET /api/mobile/admin/services/categories
 * Получить список всех категорий для администратора
 */
export async function GET(req: NextRequest) {
  try {
    const auth = requireAuth(req, ['ADMIN']);

    if ('error' in auth) {
      return auth.error;
    }

    if (auth.payload.role !== "ADMIN") {
      return NextResponse.json({ error: "Доступ запрещен" }, { status: 401 });
    }

    console.log("[MOBILE_ADMIN_CATEGORIES] GET request by user:", auth.payload.userId);

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
    return serverError('[MOBILE_ADMIN_CATEGORIES] GET_CATEGORIES_ERROR', error);
  }
}

/**
 * POST /api/mobile/admin/services/categories
 * Создать новую категорию услуг
 */
export async function POST(req: NextRequest) {
  try {
    const auth = requireAuth(req, ['ADMIN']);

    if ('error' in auth) {
      return auth.error;
    }

    if (auth.payload.role !== "ADMIN") {
      return NextResponse.json({ error: "Доступ запрещен" }, { status: 401 });
    }

    console.log("[MOBILE_ADMIN_CATEGORIES] POST request by user:", auth.payload.userId);

    const json = await req.json();
    const parsed = createCategorySchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Ошибка валидации", details: parsed.error.flatten() },
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

    console.log("[MOBILE_ADMIN_CATEGORIES] Created category:", category.id);
    return NextResponse.json({ ok: true, category }, { status: 201 });
  } catch (error: unknown) {
    return serverError('[MOBILE_ADMIN_CATEGORIES] CREATE_CATEGORY_ERROR', error);
  }
}
