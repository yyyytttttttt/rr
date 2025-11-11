import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prizma";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../../lib/auth";
import { generateOccurrences } from "../../../../lib/rrule";

const q = z.object({
  doctorId: z.string().min(1),
  from: z.coerce.date(), // ISO
  to: z.coerce.date(),   // ISO
});

export async function GET(req) {
  const url = new URL(req.url);
  const parsed = q.safeParse({
    doctorId: url.searchParams.get("doctorId"),
    from: url.searchParams.get("from"),
    to: url.searchParams.get("to"),
  });
  if (!parsed.success) {
    return NextResponse.json({ error: "VALIDATION", details: parsed.error.flatten() }, { status: 400 });
  }

  // проверяем доступ: врач читает свой календарь, админ - любой
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

  const [openings, exceptions, bookings, unavailabilities] = await Promise.all([
    prisma.opening.findMany({
      where: { doctorId, startUtc: { lt: toDate }, endUtc: { gt: fromDate } },
      orderBy: { startUtc: "asc" },
      select: { id: true, startUtc: true, endUtc: true },
    }),
    prisma.exception.findMany({
      where: { doctorId, startUtc: { lt: toDate }, endUtc: { gt: fromDate } },
      orderBy: { startUtc: "asc" },
      select: { id: true, startUtc: true, endUtc: true, reason: true },
    }),
    prisma.booking.findMany({
      where: { doctorId, startUtc: { lt: toDate }, endUtc: { gt: fromDate } },
      orderBy: { startUtc: "asc" },
      select: {
        id: true, startUtc: true, endUtc: true, status: true,
        service: { select: { name: true, durationMin: true } },
        user: { select: { name: true, email: true } },
        note: true,
      },
    }),
    prisma.unavailability.findMany({
      where: {
        doctorId,
        OR: [
          // Обычные блокировки
          { start: { lt: toDate }, end: { gt: fromDate } },
          // Повторяющиеся блокировки
          { rrule: { not: null } },
        ],
      },
      orderBy: { start: "asc" },
      select: {
        id: true,
        type: true,
        start: true,
        end: true,
        rrule: true,
        rruleUntil: true,
        tzid: true,
        reason: true,
      },
    }),
  ]);

  // Разворачиваем unavailability с учётом RRULE
  const unavailBlocks = [];
  for (const unavail of unavailabilities) {
    if (unavail.rrule) {
      const occurrences = generateOccurrences(
        unavail.rrule,
        unavail.start,
        unavail.end,
        fromDate,
        toDate,
        unavail.tzid,
        unavail.rruleUntil
      );
      for (const occ of occurrences) {
        unavailBlocks.push({
          id: `${unavail.id}_${occ.start.toISOString()}`,
          parentId: unavail.id,
          type: unavail.type,
          start: occ.start,
          end: occ.end,
          reason: unavail.reason,
          isRecurring: true,
        });
      }
    } else {
      unavailBlocks.push({
        id: unavail.id,
        parentId: unavail.id,
        type: unavail.type,
        start: unavail.start,
        end: unavail.end,
        reason: unavail.reason,
        isRecurring: false,
      });
    }
  }

  return NextResponse.json({
    openings: openings.map(o => ({ id: o.id, start: o.startUtc, end: o.endUtc })),
    exceptions: exceptions.map(e => ({ id: e.id, start: e.startUtc, end: e.endUtc, reason: e.reason ?? null })),
    bookings: bookings.map(b => ({
      id: b.id,
      start: b.startUtc,
      end: b.endUtc,
      status: b.status,                    // PENDING | CONFIRMED | CANCELED | COMPLETED | NO_SHOW
      title: b.service?.name ?? "Запись",
      clientName: b.user?.name ?? null,
      clientEmail: b.user?.email ?? null,
      note: b.note ?? null,
      durationMin: b.service?.durationMin ?? null,
    })),
    unavailabilities: unavailBlocks,
  });
}
