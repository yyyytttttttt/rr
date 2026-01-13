import { NextRequest, NextResponse } from "next/server";
import { requireAuth, createCorsResponse } from "../../../../../../lib/jwt";
import { prisma } from "../../../../../../lib/prizma";

export async function OPTIONS(request: NextRequest) {
  return createCorsResponse(request);
}

// Public endpoint - get services linked to a doctor
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: doctorId } = await params;

  console.log("[MOBILE_DOCTOR_SERVICES] GET request for doctor:", doctorId);

  try {
    const doctor = await prisma.doctor.findUnique({
      where: { id: doctorId },
      select: { id: true },
    });

    if (!doctor) {
      return NextResponse.json({ error: "Врач не найден" }, { status: 404 });
    }

    const doctorServices = await prisma.doctorService.findMany({
      where: { doctorId, isActive: true },
      include: {
        service: {
          include: {
            category: { select: { id: true, name: true } }
          }
        }
      },
      orderBy: { service: { name: "asc" } },
    });

    console.log(`[MOBILE_DOCTOR_SERVICES] Found ${doctorServices.length} services`);

    return NextResponse.json({ services: doctorServices });
  } catch (error) {
    console.error("[MOBILE_DOCTOR_SERVICES] Error:", error);
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 });
  }
}

// Admin endpoint - add services to a doctor
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = requireAuth(req, ['ADMIN', 'DOCTOR']);

  if ('error' in auth) {
    return auth.error;
  }

  const { id: doctorId } = await params;

  console.log("[MOBILE_DOCTOR_SERVICES] POST request for doctor:", doctorId);

  try {
    const body = await req.json();
    const { serviceIds } = body;

    if (!Array.isArray(serviceIds) || serviceIds.length === 0) {
      return NextResponse.json({ error: "Необходимо указать serviceIds" }, { status: 400 });
    }

    const doctor = await prisma.doctor.findUnique({
      where: { id: doctorId },
      select: { id: true },
    });

    if (!doctor) {
      return NextResponse.json({ error: "Врач не найден" }, { status: 404 });
    }

    const result = await prisma.doctorService.createMany({
      data: serviceIds.map((serviceId: string) => ({
        doctorId,
        serviceId,
        isActive: true,
      })),
      skipDuplicates: true,
    });

    console.log(`[MOBILE_DOCTOR_SERVICES] Added ${result.count} services to doctor`);

    return NextResponse.json({ success: true, count: result.count });
  } catch (error) {
    console.error("[MOBILE_DOCTOR_SERVICES] Error adding services:", error);
    return NextResponse.json({ error: "Ошибка при добавлении услуг" }, { status: 500 });
  }
}
