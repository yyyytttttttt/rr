import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../../lib/auth";
import { prisma } from "../../../../lib/prizma";
import { serverError } from "../../../../lib/api-error";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const doctorId = searchParams.get("doctorId");
    const filter = searchParams.get("filter") || "upcoming"; // today | upcoming | all

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

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);

    let whereClause: any = { doctorId };

    if (filter === "today") {
      whereClause = {
        ...whereClause,
        status: { in: ["PENDING", "CONFIRMED"] },
        startUtc: {
          gte: startOfToday,
          lt: endOfToday,
        },
      };
    } else if (filter === "upcoming") {
      whereClause = {
        ...whereClause,
        status: { in: ["PENDING", "CONFIRMED"] },
        startUtc: { gte: now },
      };
    }
    // filter === "all" - no additional filters

    const bookings = await prisma.booking.findMany({
      where: whereClause,
      orderBy: { startUtc: "asc" },
      select: {
        id: true,
        startUtc: true,
        endUtc: true,
        status: true,
        note: true,
        createdAt: true,
        clientName: true,
        clientEmail: true,
        clientPhone: true,
        service: {
          select: {
            id: true,
            name: true,
            durationMin: true,
            priceCents: true,
            currency: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            image: true,
          },
        },
      },
    });

    return NextResponse.json({
      ok: true,
      bookings: bookings.map((b) => ({
        id: b.id,
        startUtc: b.startUtc,
        endUtc: b.endUtc,
        status: b.status,
        note: b.note,
        createdAt: b.createdAt,
        service: b.service
          ? {
              id: b.service.id,
              name: b.service.name,
              durationMin: b.service.durationMin,
              priceCents: b.service.priceCents,
              currency: b.service.currency,
            }
          : null,
        client: {
          id: b.user?.id || null,
          name: b.user?.name || b.clientName || null,
          email: b.user?.email || b.clientEmail || null,
          phone: b.user?.phone || b.clientPhone || null,
          image: b.user?.image || null,
        },
      })),
    });
  } catch (error: unknown) {
    return serverError('Error fetching doctor bookings', error);
  }
}
