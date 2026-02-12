// app/api/services/catalog/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../../lib/prizma";
import { createCorsResponse } from "../../../../lib/jwt";
import { serverError } from "../../../../lib/api-error";

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
    const page = Math.max(1, Number(url.searchParams.get("page") ?? 1));
    const pageSize = Math.min(100, Math.max(1, Number(url.searchParams.get("pageSize") ?? 50)));

    console.log("GET /api/services/catalog - categoryId:", categoryId, "page:", page);

    const where = {
      ...(categoryId && { categoryId }),
      isActive: true,
      doctorServices: {
        some: {
          isActive: true,
        },
      },
    };

    const [services, total] = await Promise.all([
      prisma.service.findMany({
        where,
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
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.service.count({ where }),
    ]);

    console.log(`Found ${services.length} services (total: ${total})`);
    return NextResponse.json({ services, total, page, pageSize });
  } catch (error) {
    return serverError('[SERVICES_CATALOG] Error', error);
  }
}
