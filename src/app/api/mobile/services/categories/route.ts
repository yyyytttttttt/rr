import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../../../lib/prizma";
import { createCorsResponse } from "../../../../../lib/jwt";
import { serverError } from "../../../../../lib/api-error";

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
    return serverError('[MOBILE_SERVICES_CATEGORIES] Error', error);
  }
}
