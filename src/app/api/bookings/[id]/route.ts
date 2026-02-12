import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../../lib/auth";
import { prisma } from "../../../../lib/prizma";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const booking = await prisma.booking.findUnique({
      where: { id },
      select: {
        id: true,
        startUtc: true,
        endUtc: true,
        status: true,
        note: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
        service: {
          select: {
            id: true,
            name: true,
            priceCents: true,
            currency: true,
          },
        },
        doctor: {
          select: {
            id: true,
            title: true,
            user: {
              select: {
                name: true,
                image: true,
              },
            },
          },
        },
        payment: {
          select: {
            status: true,
          },
        },
      },
    });

    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    // Check access: user can see own bookings, admin can see all
    const isAdmin = session.user.role === "ADMIN";
    const isOwner = booking.user?.id === session.user.id;

    if (!isAdmin && !isOwner) {
      return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
    }

    // Transform to flat structure
    const result = {
      id: booking.id,
      startUtc: booking.startUtc.toISOString(),
      endUtc: booking.endUtc.toISOString(),
      status: booking.status,
      note: booking.note,
      clientName: booking.user?.name || "Клиент",
      clientEmail: booking.user?.email || "",
      clientPhone: booking.user?.phone || "",
      serviceName: booking.service.name,
      serviceId: booking.service.id,
      priceCents: booking.service.priceCents,
      currency: booking.service.currency,
      doctorName: booking.doctor.user.name || booking.doctor.title || "Врач",
      doctorId: booking.doctor.id,
      doctorImage: booking.doctor.user.image,
      paymentStatus: booking.payment?.status || null,
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error("Failed to fetch booking:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const body = await req.json();
    const { status } = body;

    // Validate status
    if (!status || !["CANCELED", "CONFIRMED", "COMPLETED", "NO_SHOW"].includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    // Find booking
    const booking = await prisma.booking.findUnique({
      where: { id },
      select: {
        id: true,
        userId: true,
        status: true,
        doctor: { select: { userId: true } },
      },
    });

    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    // Check access: user can cancel own bookings, admin can update any, doctor can update own bookings
    const isAdmin = session.user.role === "ADMIN";
    const isDoctor = session.user.role === "DOCTOR" && booking.doctor.userId === session.user.id;
    const isOwner = booking.userId === session.user.id;

    // Users can only cancel their own bookings
    if (!isAdmin && !isDoctor && !isOwner) {
      return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
    }

    // Regular users can only cancel (not set other statuses); doctors and admins can set any status
    if (!isAdmin && !isDoctor && status !== "CANCELED") {
      return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
    }

    // Update booking
    const updated = await prisma.booking.update({
      where: { id },
      data: { status },
      select: {
        id: true,
        status: true,
      },
    });

    return NextResponse.json({ ok: true, booking: updated });
  } catch (error) {
    console.error("Failed to update booking:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
