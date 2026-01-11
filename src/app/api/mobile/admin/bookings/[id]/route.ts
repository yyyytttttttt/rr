import { NextRequest, NextResponse } from "next/server";
import { requireAuth, createCorsResponse } from "../../../../../../lib/jwt";
import { prisma } from "../../../../../../lib/prizma";
import { z } from "zod";

const updateSchema = z.object({
  status: z.enum(["PENDING", "CONFIRMED", "CANCELED", "COMPLETED", "NO_SHOW"]),
});

// Обработка OPTIONS для CORS preflight
export async function OPTIONS(request: NextRequest) {
  return createCorsResponse(request);
}

// PATCH - Admin updates booking status
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = requireAuth(req, ['ADMIN']);

  if ('error' in auth) {
    return auth.error;
  }

  if (auth.payload.role !== "ADMIN") {
    return NextResponse.json({ error: "Доступ запрещен" }, { status: 403 });
  }

  const { id } = await params;

  console.log("[MOBILE_ADMIN_BOOKING_UPDATE] PATCH request for booking:", id);

  try {
    const body = await req.json();
    const parsed = updateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Некорректный статус" }, { status: 400 });
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

    console.log("[MOBILE_ADMIN_BOOKING_UPDATE] Updated booking:", booking.id, "to status:", status);
    return NextResponse.json({ ok: true, booking });
  } catch (error) {
    console.error("[MOBILE_ADMIN_BOOKING_UPDATE] Failed to update booking:", error);
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 });
  }
}

// DELETE - Admin cancels booking
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = requireAuth(req, ['ADMIN']);

  if ('error' in auth) {
    return auth.error;
  }

  if (auth.payload.role !== "ADMIN") {
    return NextResponse.json({ error: "Доступ запрещен" }, { status: 403 });
  }

  const { id } = await params;

  console.log("[MOBILE_ADMIN_BOOKING_DELETE] DELETE request for booking:", id);

  try {
    const booking = await prisma.booking.update({
      where: { id },
      data: { status: "CANCELED" },
      select: {
        id: true,
        status: true,
      },
    });

    console.log("[MOBILE_ADMIN_BOOKING_DELETE] Canceled booking:", booking.id);
    return NextResponse.json({ ok: true, booking });
  } catch (error) {
    console.error("[MOBILE_ADMIN_BOOKING_DELETE] Failed to cancel booking:", error);
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 });
  }
}
