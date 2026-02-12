import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../../../lib/prizma";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../../../lib/auth";

/**
 * GET /api/debug/doctor/[doctorId]
 * Debug endpoint для проверки конфигурации врача
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ doctorId: string }> }
) {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
  // [SEC] debug endpoint — admin/doctor only
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || (session.user.role !== "ADMIN" && session.user.role !== "DOCTOR")) {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  }

  const { doctorId } = await params;

  try {
    // 1. Информация о враче
    const doctor = await prisma.doctor.findUnique({
      where: { id: doctorId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            emailVerified: true,
            role: true,
          },
        },
      },
    });

    if (!doctor) {
      return NextResponse.json({ error: "Врач не найден" }, { status: 404 });
    }

    // 2. Связи с услугами
    const doctorServices = await prisma.doctorService.findMany({
      where: { doctorId },
      include: {
        service: {
          select: {
            id: true,
            name: true,
            isActive: true,
            durationMin: true,
          },
        },
      },
    });

    // 3. Расписание (Schedule)
    const schedules = await prisma.schedule.findMany({
      where: { doctorId },
      select: {
        id: true,
        byWeekday: true,
        startTime: true,
        endTime: true,
      },
    });

    // 4. Openings (ближайшие 7 дней)
    const now = new Date();
    const sevenDaysLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const openings = await prisma.opening.findMany({
      where: {
        doctorId,
        startUtc: { gte: now },
        endUtc: { lte: sevenDaysLater },
      },
      select: {
        id: true,
        startUtc: true,
        endUtc: true,
      },
      orderBy: { startUtc: "asc" },
      take: 20,
    });

    // 5. Exceptions (ближайшие 7 дней)
    const exceptions = await prisma.exception.findMany({
      where: {
        doctorId,
        startUtc: { gte: now },
        endUtc: { lte: sevenDaysLater },
      },
      select: {
        id: true,
        startUtc: true,
        endUtc: true,
        reason: true,
      },
      orderBy: { startUtc: "asc" },
    });

    // 6. Unavailabilities (ближайшие 7 дней)
    const unavailabilities = await prisma.unavailability.findMany({
      where: {
        doctorId,
        OR: [
          {
            start: { gte: now },
            end: { lte: sevenDaysLater },
          },
          {
            rrule: { not: null },
          },
        ],
      },
      select: {
        id: true,
        type: true,
        start: true,
        end: true,
        rrule: true,
        reason: true,
      },
      orderBy: { start: "asc" },
    });

    // 7. Bookings (ближайшие 7 дней)
    const bookings = await prisma.booking.findMany({
      where: {
        doctorId,
        startUtc: { gte: now },
        endUtc: { lte: sevenDaysLater },
        status: { in: ["PENDING", "CONFIRMED"] },
      },
      select: {
        id: true,
        status: true,
        startUtc: true,
        endUtc: true,
        clientName: true,
      },
      orderBy: { startUtc: "asc" },
    });

    return NextResponse.json({
      doctor: {
        id: doctor.id,
        title: doctor.title,
        tzid: doctor.tzid,
        slotDurationMin: doctor.slotDurationMin,
        bufferMin: doctor.bufferMin,
        minLeadMin: doctor.minLeadMin,
        gridStepMin: doctor.gridStepMin,
        user: doctor.user,
      },
      services: {
        total: doctorServices.length,
        active: doctorServices.filter((ds) => ds.isActive).length,
        list: doctorServices.map((ds) => ({
          id: ds.service.id,
          name: ds.service.name,
          isActive: ds.isActive,
          serviceActive: ds.service.isActive,
          durationMin: ds.service.durationMin,
        })),
      },
      schedules: {
        total: schedules.length,
        list: schedules,
      },
      openings: {
        total: openings.length,
        next7Days: openings,
      },
      exceptions: {
        total: exceptions.length,
        next7Days: exceptions,
      },
      unavailabilities: {
        total: unavailabilities.length,
        next7Days: unavailabilities,
      },
      bookings: {
        total: bookings.length,
        next7Days: bookings,
      },
      diagnosis: {
        hasUser: !!doctor.user,
        emailVerified: doctor.user?.emailVerified || null,
        hasActiveServices: doctorServices.some((ds) => ds.isActive && ds.service.isActive),
        hasScheduleOrOpenings: schedules.length > 0 || openings.length > 0,
        canAcceptBookings:
          doctorServices.some((ds) => ds.isActive && ds.service.isActive) &&
          (schedules.length > 0 || openings.length > 0),
      },
    });
  } catch (error) {
    console.error("[DEBUG_DOCTOR] Error:", error);
    return NextResponse.json(
      { error: "Ошибка при получении данных врача" },
      { status: 500 }
    );
  }
}
