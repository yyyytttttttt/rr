import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prizma";
import { createCorsResponse } from "../../../../lib/jwt";

export async function OPTIONS(request) {
  return createCorsResponse(request);
}

export async function GET() {
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

    // NOTE: Transform to match expected format
    const doctors = items.map((doc) => ({
      id: doc.id,
      name: doc.user?.name || doc.title || "Врач",
      title: doc.title,
      image: doc.user?.image,
      rating: doc.rating || 5.0,
      reviewCount: doc.reviewCount || 0,
    }));

    return NextResponse.json({ doctors });
  } catch (e) {
    console.error("DOCTORS_LIST_ERR", e);
    return NextResponse.json({ doctors: [], error: "INTERNAL" }, { status: 500 });
  }
}
