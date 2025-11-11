import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../../../lib/auth";
import { prisma } from "../../../../../lib/prizma";
import { z } from "zod";

const updateSchema = z.object({
  status: z.enum(["PENDING", "CONFIRMED", "CANCELED", "COMPLETED", "NO_SHOW"]),
});

// PATCH - Admin updates booking status
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  }

  const { id } = await params;

  try {
    const body = await req.json();
    const parsed = updateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    const { status } = parsed.data;

    const booking = await prisma.booking.update({
      where: { id },
      data: { status },
      select: {
        id: true,
        status: true,
        startUtc: true,
        endUtc: true,
      },
    });

    return NextResponse.json({ ok: true, booking });
  } catch (error) {
    console.error("Failed to update booking:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE - Admin cancels booking
export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  }

  const { id } = await params;

  try {
    const booking = await prisma.booking.update({
      where: { id },
      data: { status: "CANCELED" },
      select: {
        id: true,
        status: true,
      },
    });

    return NextResponse.json({ ok: true, booking });
  } catch (error) {
    console.error("Failed to cancel booking:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
