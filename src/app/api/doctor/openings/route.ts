import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prizma";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { AuthOptions } from "next-auth";
import { authOptions } from "../../../../lib/auth";

const q = z.object({
  doctorId: z.string().min(1),
  from: z.string().datetime(), // ISO-строка
  to: z.string().datetime(),   // ISO-строка
});

export async function GET(req: Request) {
  const url = new URL(req.url);

  const parsed = q.safeParse({
    doctorId: url.searchParams.get("doctorId"),
    from: url.searchParams.get("from"),
    to: url.searchParams.get("to"),
  });

  if (!parsed.success) {
    return NextResponse.json({ error: "VALIDATION" }, { status: 400 });
  }

  // проверяем доступ: врач запрашивает СВОЙ календарь, админ - любой
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  // Check if user is admin
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });

  const isAdmin = user?.role === "ADMIN" || user?.role === "DOCTOR";

  // If not admin, check if user is the doctor
  if (!isAdmin) {
    const me = await prisma.doctor.findFirst({
      where: { userId: session.user.id },
      select: { id: true },
    });

    if (!me || me.id !== parsed.data.doctorId) {
      return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
    }
  }

  const { doctorId, from, to } = parsed.data;
  const fromDate = new Date(from);
  const toDate = new Date(to);

  const [openings, bookings] = await Promise.all([
    prisma.opening.findMany({
      where: {
        doctorId,
        startUtc: { lt: toDate },
        endUtc: { gt: fromDate },
      },
      orderBy: { startUtc: "asc" },
    }),
    prisma.booking.findMany({
      where: {
        doctorId,
        status: { in: ["PENDING", "CONFIRMED"] },
        startUtc: { lt: toDate },
        endUtc: { gt: fromDate },
      },
      select: { id: true, startUtc: true, endUtc: true },
    }),
  ]);

  return NextResponse.json({
    openings: openings.map((o) => ({ id: o.id, start: o.startUtc, end: o.endUtc })),
    busy: bookings.map((b) => ({ id: b.id, start: b.startUtc, end: b.endUtc })),
  });
}
