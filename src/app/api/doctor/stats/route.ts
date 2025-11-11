import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../../lib/auth";
import { prisma } from "../../../../lib/prizma";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const doctorId = searchParams.get("doctorId");

    if (!doctorId) {
      return NextResponse.json({ error: "doctorId is required" }, { status: 400 });
    }

    // Verify user has access to this doctor
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        role: true,
        doctor: { select: { id: true } },
      },
    });

    const isAuthorized =
      user?.role === "ADMIN" ||
      (user?.role === "DOCTOR" && user.doctor?.id === doctorId);

    if (!isAuthorized) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Get statistics
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);

    const [todayCount, upcomingCount, totalBookings] = await Promise.all([
      // Today's bookings
      prisma.booking.count({
        where: {
          doctorId,
          status: { in: ["PENDING", "CONFIRMED"] },
          startUtc: {
            gte: startOfToday,
            lt: endOfToday,
          },
        },
      }),
      // Upcoming bookings
      prisma.booking.count({
        where: {
          doctorId,
          status: { in: ["PENDING", "CONFIRMED"] },
          startUtc: { gte: now },
        },
      }),
      // Total bookings
      prisma.booking.count({
        where: { doctorId },
      }),
    ]);

    return NextResponse.json({
      ok: true,
      todayCount,
      upcomingCount,
      totalBookings,
    });
  } catch (error: any) {
    console.error("Error fetching doctor stats:", error);
    return NextResponse.json(
      { error: "Internal server error", message: error.message },
      { status: 500 }
    );
  }
}
