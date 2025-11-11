import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../../../../../lib/auth";
import { prisma } from "../../../../../../../lib/prizma";

// NOTE: DELETE to unlink a service from a doctor
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ doctorId: string; serviceId: string }> }
) {
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

  const { doctorId, serviceId } = await params;

  // Verify link exists
  const link = await prisma.doctorService.findUnique({
    where: { doctorId_serviceId: { doctorId, serviceId } },
    select: { doctorId: true, serviceId: true },
  });

  if (!link) {
    return NextResponse.json({ error: "Link not found" }, { status: 404 });
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
      { error: "Cannot unlink service with active bookings" },
      { status: 409 }
    );
  }

  // NOTE: Soft delete by setting isActive to false
  await prisma.doctorService.update({
    where: { doctorId_serviceId: { doctorId, serviceId } },
    data: { isActive: false },
  });

  return NextResponse.json({ ok: true });
}
