import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prizma";
import { createCorsResponse } from "../../../../lib/jwt";

export async function OPTIONS(request) {
  return createCorsResponse(request);
}

export async function GET(req) {
  try {
    const url = new URL(req.url);
    const page = Math.max(1, Number(url.searchParams.get("page") ?? 1));
    const pageSize = Math.min(100, Math.max(1, Number(url.searchParams.get("pageSize") ?? 50)));

    const [items, total] = await Promise.all([
      prisma.doctor.findMany({
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
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.doctor.count(),
    ]);

    // NOTE: Transform to match expected format
    const doctors = items.map((doc) => ({
      id: doc.id,
      name: doc.user?.name || doc.title || "Врач",
      title: doc.title,
      image: doc.user?.image,
      rating: doc.rating || 5.0,
      reviewCount: doc.reviewCount || 0,
    }));

    return NextResponse.json({ doctors, total, page, pageSize });
  } catch (e) {
    console.error("DOCTORS_LIST_ERR", e);
    return NextResponse.json({ doctors: [], error: "INTERNAL" }, { status: 500 });
  }
}
