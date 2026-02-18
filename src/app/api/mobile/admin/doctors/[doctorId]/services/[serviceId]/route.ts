import { NextRequest, NextResponse } from "next/server";
import { requireAuth, createCorsResponse } from "../../../../../../../../lib/jwt";
import { prisma } from "../../../../../../../../lib/prizma";

// Обработка OPTIONS для CORS preflight
export async function OPTIONS(request: NextRequest) {
  return createCorsResponse(request);
}

// NOTE: DELETE to unlink a service from a doctor
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ doctorId: string; serviceId: string }> }
) {
  const auth = requireAuth(req, ['ADMIN', 'DOCTOR']);

  if ('error' in auth) {
    return auth.error;
  }

  const { doctorId, serviceId } = await params;

  console.log("[MOBILE_ADMIN_DOCTOR_SERVICE_DELETE] DELETE request for doctor:", doctorId, "service:", serviceId);

  // DOCTOR can only unlink their own services
  if (auth.payload.role === 'DOCTOR') {
    const ownDoctor = await prisma.doctor.findUnique({
      where: { userId: auth.payload.userId },
      select: { id: true },
    });
    if (!ownDoctor || ownDoctor.id !== doctorId) {
      return NextResponse.json({ error: "Доступ запрещен" }, { status: 403 });
    }
  } else if (auth.payload.role !== 'ADMIN') {
    return NextResponse.json({ error: "Доступ запрещен" }, { status: 403 });
  }

  // Verify link exists
  const link = await prisma.doctorService.findUnique({
    where: { doctorId_serviceId: { doctorId, serviceId } },
    select: { doctorId: true, serviceId: true },
  });

  if (!link) {
    return NextResponse.json({ error: "Связь не найдена" }, { status: 404 });
  }

  // Check for active bookings with this service and doctor
  const activeBookings = await prisma.booking.count({
    where: {
      doctorId,
      serviceId,
      status: { in: ["PENDING", "CONFIRMED"] },
      startUtc: { gte: new Date() },
    },
  });

  if (activeBookings > 0) {
    return NextResponse.json(
      { error: "Невозможно отвязать услугу с активными записями" },
      { status: 409 }
    );
  }

  // NOTE: Soft delete by setting isActive to false
  await prisma.doctorService.update({
    where: { doctorId_serviceId: { doctorId, serviceId } },
    data: { isActive: false },
  });

  console.log("[MOBILE_ADMIN_DOCTOR_SERVICE_DELETE] Unlinked service:", serviceId, "from doctor:", doctorId);
  return NextResponse.json({ ok: true });
}
