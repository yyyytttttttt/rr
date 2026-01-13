import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../../../lib/prizma";
import { createCorsResponse } from "../../../../../lib/jwt";

export async function OPTIONS(request: NextRequest) {
  return createCorsResponse(request);
}

export async function GET() {
  console.log("[MOBILE_DOCTORS_LIST] GET request - fetching public doctors list");

  try {
    const items = await prisma.doctor.findMany({
      select: {
        id: true,
        title: true,
        rating: true,
        reviewCount: true,
        user: {
          select: {
            name: true,
            image: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const doctors = items.map((doc) => ({
      id: doc.id,
      name: doc.user?.name || doc.title || "Врач",
      title: doc.title,
      image: doc.user?.image,
      rating: doc.rating || 5.0,
      reviewCount: doc.reviewCount || 0,
    }));

    console.log(`[MOBILE_DOCTORS_LIST] Found ${doctors.length} doctors`);

    return NextResponse.json({ doctors });
  } catch (e) {
    console.error("[MOBILE_DOCTORS_LIST] Error:", e);
    return NextResponse.json({ doctors: [], error: "Ошибка сервера" }, { status: 500 });
  }
}
