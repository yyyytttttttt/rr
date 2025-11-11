import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prizma";

/**
 * TEST endpoint to debug catalog API
 */
export async function GET() {
  try {
    // Test 1: All active services
    const allActiveServices = await prisma.service.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        isActive: true,
      },
    });

    // Test 2: Services with doctor links
    const servicesWithDoctors = await prisma.service.findMany({
      where: {
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
      },
    });

    // Test 3: Categories
    const categories = await prisma.serviceCategory.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
      },
    });

    return NextResponse.json({
      debug: {
        allActiveServicesCount: allActiveServices.length,
        servicesWithDoctorsCount: servicesWithDoctors.length,
        categoriesCount: categories.length,
      },
      allActiveServices,
      servicesWithDoctors,
      categories,
    });
  } catch (error) {
    console.error("Test catalog error:", error);
    return NextResponse.json(
      { error: String(error) },
      { status: 500 }
    );
  }
}
