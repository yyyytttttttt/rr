import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../../../lib/prizma";
import { createCorsResponse } from "../../../../../lib/jwt";
import { z } from "zod";

export async function OPTIONS(request: NextRequest) {
  return createCorsResponse(request);
}

export async function GET(req: NextRequest) {
  console.log("[MOBILE_SERVICES_LIST] GET request");

  const url = new URL(req.url);
  const doctorId = z.string().min(1).safeParse(url.searchParams.get("doctorId"));

  if (!doctorId.success) {
    console.log("[MOBILE_SERVICES_LIST] No valid doctorId provided");
    return NextResponse.json({ items: [] });
  }

  console.log("[MOBILE_SERVICES_LIST] Fetching services for doctor:", doctorId.data);

  try {
    const items = await prisma.service.findMany({
      where: { doctorServices: { some: { doctorId: doctorId.data } } },
      select: {
        id: true,
        name: true,
        description: true,
        priceCents: true,
        currency: true,
        durationMin: true,
        bufferMinOverride: true,
        isActive: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    });

    console.log(`[MOBILE_SERVICES_LIST] Found ${items.length} services`);

    return NextResponse.json({ items });
  } catch (e) {
    console.error("[MOBILE_SERVICES_LIST] Error:", e);
    return NextResponse.json({ items: [], error: "Ошибка сервера" }, { status: 500 });
  }
}
