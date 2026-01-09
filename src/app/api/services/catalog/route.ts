// app/api/services/catalog/route.ts
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
 * GET /api/services/catalog
 * Публичный каталог услуг с фильтрацией по категории
 * Query params:
 *   - categoryId?: string - фильтр по категории
 */
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const categoryId = url.searchParams.get("categoryId") || undefined;

    console.log("GET /api/services/catalog - categoryId:", categoryId);

    const services = await prisma.service.findMany({
      where: {
        ...(categoryId && { categoryId }),
        isActive: true,
        doctorServices: {
          some: {
            isActive: true,
          },
        },
      },
      select: {
        id: true,
        name: true,
        description: true,
        priceCents: true,
        currency: true,
        durationMin: true,
        categoryId: true,
        category: {
          select: {
            id: true,
            name: true,
            icon: true,
          },
        },
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
      orderBy: [
        { category: { sortOrder: "asc" } },
        { name: "asc" },
      ],
    });

    console.log(`Found ${services.length} services`);
    return NextResponse.json({ services });
  } catch (error) {
    console.error('[SERVICES_CATALOG] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch services catalog', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
