import { NextRequest, NextResponse } from "next/server";
import { requireAuth, createCorsResponse } from "../../../../../../lib/jwt";
import { prisma } from "../../../../../../lib/prizma";

// Обработка OPTIONS для CORS preflight
export async function OPTIONS(request: NextRequest) {
  return createCorsResponse(request);
}

// NOTE: Admin endpoint - shows ALL services (even without doctor links)
export async function GET(req: NextRequest) {
  const auth = requireAuth(req, ['ADMIN']);

  if ('error' in auth) {
    return auth.error;
  }

  if (auth.payload.role !== 'ADMIN') {
    return NextResponse.json({ error: "Доступ запрещен" }, { status: 403 });
  }

  console.log("[MOBILE_ADMIN_SERVICES_LIST] GET request by user:", auth.payload.userId);

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
