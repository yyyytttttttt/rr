// app/api/services/categories/route.ts
import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prizma";

/**
 * GET /api/services/categories
 * Получить список всех категорий услуг с количеством услуг
 */
export async function GET() {
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
}
