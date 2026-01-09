// app/api/services/categories/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../../lib/prizma";
import { createCorsResponse } from "../../../../lib/jwt";

/**
 * OPTIONS - CORS preflight
 */
export async function OPTIONS(request: NextRequest) {
  return createCorsResponse(request);
}

/**
 * GET /api/services/categories
 * Получить список всех категорий услуг с количеством услуг
 */
export async function GET() {
  try {
    const categories = await prisma.serviceCategory.findMany({
      where: {
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        description: true,
        icon: true,
        sortOrder: true,
        _count: {
          select: {
            services: {
              where: {
                isActive: true,
                doctorServices: {
                  some: {
                    isActive: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: {
        sortOrder: "asc",
      },
    });

    return NextResponse.json({ categories });
  } catch (error) {
    console.error('[SERVICES_CATEGORIES] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch categories', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
