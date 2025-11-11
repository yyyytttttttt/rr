// app/api/services/list/route.ts
import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prizma";
import { z } from "zod";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const doctorId = z.string().min(1).safeParse(url.searchParams.get("doctorId"));
  if (!doctorId.success) return NextResponse.json({ items: [] });
  // NOTE: Using M:N relation through doctorServices
  const items = await prisma.service.findMany({
    where: { doctorServices: { some: { doctorId: doctorId.data } } },
    select: {
      id: true, name: true, description: true,
      priceCents: true, currency: true, durationMin: true,
      bufferMinOverride: true, isActive: true, createdAt: true,
    },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ items });
}
