import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../../../lib/prizma";
import { createCorsResponse } from "../../../../../lib/jwt";

export async function OPTIONS(request: NextRequest) {
  return createCorsResponse(request);
}

export async function GET() {
  console.log("[MOBILE_SERVICES_CATEGORIES] GET request");

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

    console.log(`[MOBILE_SERVICES_CATEGORIES] Found ${categories.length} categories`);
    return NextResponse.json({ categories });
  } catch (error) {
    console.error('[MOBILE_SERVICES_CATEGORIES] Error:', error);
    return NextResponse.json(
      { error: 'Ошибка при загрузке категорий', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
