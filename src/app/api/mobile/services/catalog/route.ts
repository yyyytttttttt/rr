import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../../../lib/prizma";
import { createCorsResponse } from "../../../../../lib/jwt";
import { serverError } from "../../../../../lib/api-error";

export async function OPTIONS(request: NextRequest) {
  return createCorsResponse(request);
}

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const categoryId = url.searchParams.get("categoryId") || undefined;

    console.log("[MOBILE_SERVICES_CATALOG] GET request - categoryId:", categoryId);

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

    console.log(`[MOBILE_SERVICES_CATALOG] Found ${services.length} services`);
    return NextResponse.json({ services });
  } catch (error) {
    return serverError('[MOBILE_SERVICES_CATALOG] Error', error);
  }
}
