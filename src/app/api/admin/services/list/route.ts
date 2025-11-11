import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../../../lib/auth";
import { prisma } from "../../../../../lib/prizma";

// NOTE: Admin endpoint - shows ALL services (even without doctor links)
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { role: true },
  });

  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const services = await prisma.service.findMany({
    select: {
      id: true,
      name: true,
      description: true,
      priceCents: true,
      currency: true,
      durationMin: true,
      isActive: true,
      bufferMinOverride: true,
      category: {
        select: {
          id: true,
          name: true,
        },
      },
      _count: {
        select: {
          doctorServices: true,
        },
      },
    },
    orderBy: [
      { name: "asc" },
    ],
  });

  return NextResponse.json({ services });
}
