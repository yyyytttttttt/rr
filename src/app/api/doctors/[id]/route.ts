import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../../lib/auth";
import { prisma } from "../../../../lib/prizma";
import { serverError } from "../../../../lib/api-error";

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  }

  const { id: doctorId } = await params;
  const url = new URL(req.url);
  const mode = url.searchParams.get("mode"); // "doctor" | "user"

  if (mode !== "doctor" && mode !== "user") {
    return NextResponse.json(
      { error: "Укажите ?mode=doctor или ?mode=user" },
      { status: 400 }
    );
  }

  try {
    const doctor = await prisma.doctor.findUnique({
      where: { id: doctorId },
      select: { id: true, userId: true },
    });

    if (!doctor) {
      return NextResponse.json({ error: "Врач не найден" }, { status: 404 });
    }

    // Count future active bookings for warning
    const futureBookings = await prisma.booking.count({
      where: {
        doctorId,
        startUtc: { gte: new Date() },
        status: { in: ["PENDING", "CONFIRMED"] },
      },
    });

    if (mode === "doctor") {
      // Delete Doctor record, reset user role to USER
      await prisma.$transaction([
        prisma.doctor.delete({ where: { id: doctorId } }),
        prisma.user.update({
          where: { id: doctor.userId },
          data: { role: "USER" },
        }),
      ]);

      return NextResponse.json({
        ok: true,
        mode: "doctor",
        warning:
          futureBookings > 0
            ? `У врача было ${futureBookings} активных будущих записей (удалены каскадно)`
            : undefined,
      });
    }

    // mode === "user" — delete the entire user (cascades to Doctor and everything)
    await prisma.user.delete({ where: { id: doctor.userId } });

    return NextResponse.json({
      ok: true,
      mode: "user",
      warning:
        futureBookings > 0
          ? `У пользователя было ${futureBookings} активных будущих записей (удалены каскадно)`
          : undefined,
    });
  } catch (e: unknown) {
    return serverError("DELETE_DOCTOR", e);
  }
}
