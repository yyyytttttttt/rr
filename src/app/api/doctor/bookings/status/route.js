import { NextResponse } from "next/server";
import { prisma } from "../../../../../lib/prizma";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../../../lib/auth";

const statusEnum = z.enum(["PENDING","CONFIRMED","CANCELED","COMPLETED","NO_SHOW"]);
const Body = z.object({
  bookingId: z.string().min(1),
  nextStatus: statusEnum,
  note: z.string().max(500).optional(),
});

// допустимые переходы
const ALLOWED = {
  PENDING:   new Set(["CONFIRMED","CANCELED"]),
  CONFIRMED: new Set(["COMPLETED","CANCELED","NO_SHOW"]),
  COMPLETED: new Set([]),
  CANCELED:  new Set([]),
  NO_SHOW:   new Set([]),
};

export async function POST(req) {
  const raw = await req.json().catch(() => null);
  const p = Body.safeParse(raw);
  if (!p.success) {
    return NextResponse.json({ error: "VALIDATION", details: p.error.flatten() }, { status: 400 });
  }
  const { bookingId, nextStatus, note } = p.data;

  const session = await getServerSession(authOptions);
  const me = await prisma.doctor.findFirst({
    where: { userId: session?.user?.id ?? "" },
    select: { id: true },
  });

  const b = await prisma.booking.findUnique({
    where: { id: bookingId },
    select: { id: true, doctorId: true, status: true },
  });
  if (!b) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  if (!me || me.id !== b.doctorId) return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });

  if (!ALLOWED[b.status].has(nextStatus)) {
    return NextResponse.json({ error: "BAD_TRANSITION", from: b.status, to: nextStatus }, { status: 400 });
  }

  const updated = await prisma.booking.update({
    where: { id: bookingId },
    data: { status: nextStatus, note: note ?? undefined },
    select: { id: true, status: true, startUtc: true, endUtc: true },
  });

  return NextResponse.json({ ok: true, booking: updated });
}
