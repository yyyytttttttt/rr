import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../../lib/prizma";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../../lib/auth";
import { fromZonedTime, toZonedTime } from "date-fns-tz";
import { addDays, isBefore, max as maxDate, min as minDate } from "date-fns";

function dayBoundsUtc(dayYYYYMMDD: string, tzid: string) {
  const dateString = `${dayYYYYMMDD}T00:00:00`;
  const startUtc = fromZonedTime(dateString, tzid);
  const endUtc = addDays(startUtc, 1);
  return { startUtc, endUtc };
}

type Opening = { startUtc: Date; endUtc: Date };

async function openingsFromClassicScheduleForDay(
  doctorId: string,
  day: string,
  tzid: string
): Promise<Opening[]> {
  const { startUtc: dayStart, endUtc: dayEnd } = dayBoundsUtc(day, tzid);

  const schedules = await prisma.schedule.findMany({
    where: { doctorId },
    select: { byWeekday: true, startTime: true, endTime: true },
  });

  const localDayStart = toZonedTime(dayStart, tzid);
  const weekdayLocal = localDayStart.getDay();

  const openings: Opening[] = [];
  for (const s of schedules) {
    if (!s.byWeekday?.includes(weekdayLocal)) continue;
    const [sh, sm] = s.startTime.split(":").map(Number);
    const [eh, em] = s.endTime.split(":").map(Number);

    const localStart = new Date(
      `${localDayStart.getFullYear()}-${String(localDayStart.getMonth() + 1).padStart(2, "0")}-${String(localDayStart.getDate()).padStart(2, "0")}T${String(sh).padStart(2, "0")}:${String(sm).padStart(2, "0")}:00`
    );
    const localEnd = new Date(
      `${localDayStart.getFullYear()}-${String(localDayStart.getMonth() + 1).padStart(2, "0")}-${String(localDayStart.getDate()).padStart(2, "0")}T${String(eh).padStart(2, "0")}:${String(em).padStart(2, "0")}:00`
    );

    const start = fromZonedTime(localStart, tzid);
    const end = fromZonedTime(localEnd, tzid);
    const sUtc = maxDate([start, dayStart]);
    const eUtc = minDate([end, dayEnd]);
    if (isBefore(sUtc, eUtc)) openings.push({ startUtc: sUtc, endUtc: eUtc });
  }

  // Ручные окна Opening
  const manual = await prisma.opening.findMany({
    where: {
      doctorId,
      startUtc: { lt: dayEnd },
      endUtc: { gt: dayStart },
    },
    select: { startUtc: true, endUtc: true },
  });
  for (const o of manual) {
    const s = maxDate([o.startUtc, dayStart]);
    const e = minDate([o.endUtc, dayEnd]);
    if (isBefore(s, e)) openings.push({ startUtc: s, endUtc: e });
  }

  // Исключения Exception
  const ex = await prisma.exception.findMany({
    where: {
      doctorId,
      startUtc: { lt: dayEnd },
      endUtc: { gt: dayStart },
    },
    select: { startUtc: true, endUtc: true },
  });

  // Unavailability блокировки
  const unavailabilities = await prisma.unavailability.findMany({
    where: {
      doctorId,
      OR: [
        { start: { lt: dayEnd }, end: { gt: dayStart } },
        { rrule: { not: null } },
      ],
    },
    select: { start: true, end: true, rrule: true },
  });

  const allExclusions = [...ex, ...unavailabilities.map(u => ({ startUtc: u.start, endUtc: u.end }))];

  if (!allExclusions.length) {
    openings.sort((a, b) => a.startUtc.getTime() - b.startUtc.getTime());
    const merged: Opening[] = [];
    for (const w of openings) {
      const last = merged[merged.length - 1];
      if (!last) merged.push({ ...w });
      else if (last.endUtc > w.startUtc) {
        last.endUtc = new Date(Math.max(last.endUtc.getTime(), w.endUtc.getTime()));
      } else {
        merged.push({ ...w });
      }
    }
    return merged;
  }

  openings.sort((a, b) => a.startUtc.getTime() - b.startUtc.getTime());
  const cut: Opening[] = [];
  for (const win of openings) {
    let fragments: Opening[] = [win];
    for (const off of allExclusions) {
      const next: Opening[] = [];
      for (const f of fragments) {
        const os = new Date(Math.max(f.startUtc.getTime(), off.startUtc.getTime()));
        const oe = new Date(Math.min(f.endUtc.getTime(), off.endUtc.getTime()));
        if (os < oe) {
          if (f.startUtc < os) next.push({ startUtc: f.startUtc, endUtc: os });
          if (oe < f.endUtc) next.push({ startUtc: oe, endUtc: f.endUtc });
        } else {
          next.push(f);
        }
      }
      fragments = next;
      if (!fragments.length) break;
    }
    cut.push(...fragments);
  }
  return cut;
}

export async function GET(req: NextRequest) {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
  // [SEC] debug endpoint — admin/doctor only
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || (session.user.role !== "ADMIN" && session.user.role !== "DOCTOR")) {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  }

  const url = new URL(req.url);
  const doctorId = url.searchParams.get("doctorId") || "";
  const day = url.searchParams.get("day") || "2026-01-14";
  const tzid = url.searchParams.get("tzid") || "Europe/Moscow";

  try {
    const { startUtc: dayStart, endUtc: dayEnd } = dayBoundsUtc(day, tzid);

    // Schedules
    const schedules = await prisma.schedule.findMany({
      where: { doctorId },
      select: { byWeekday: true, startTime: true, endTime: true },
    });

    // Openings
    const manualOpenings = await prisma.opening.findMany({
      where: {
        doctorId,
        startUtc: { lt: dayEnd },
        endUtc: { gt: dayStart },
      },
      select: { id: true, startUtc: true, endUtc: true },
    });

    // Exceptions
    const exceptions = await prisma.exception.findMany({
      where: {
        doctorId,
        startUtc: { lt: dayEnd },
        endUtc: { gt: dayStart },
      },
      select: { id: true, startUtc: true, endUtc: true },
    });

    // Unavailabilities
    const unavailabilities = await prisma.unavailability.findMany({
      where: {
        doctorId,
        OR: [
          { start: { lt: dayEnd }, end: { gt: dayStart } },
          { rrule: { not: null } },
        ],
      },
      select: { id: true, type: true, start: true, end: true, rrule: true },
    });

    // Генерация openings
    const generatedOpenings = await openingsFromClassicScheduleForDay(doctorId, day, tzid);

    return NextResponse.json({
      debug: {
        day,
        tzid,
        doctorId,
        dayStart: dayStart.toISOString(),
        dayEnd: dayEnd.toISOString(),
      },
      raw: {
        schedules,
        manualOpenings: manualOpenings.map(o => ({
          ...o,
          startUtc: o.startUtc.toISOString(),
          endUtc: o.endUtc.toISOString(),
        })),
        exceptions: exceptions.map(e => ({
          ...e,
          startUtc: e.startUtc.toISOString(),
          endUtc: e.endUtc.toISOString(),
        })),
        unavailabilities: unavailabilities.map(u => ({
          ...u,
          start: u.start.toISOString(),
          end: u.end.toISOString(),
        })),
      },
      generated: {
        openingsCount: generatedOpenings.length,
        openings: generatedOpenings.map(o => ({
          startUtc: o.startUtc.toISOString(),
          endUtc: o.endUtc.toISOString(),
          startLocal: toZonedTime(o.startUtc, tzid).toISOString(),
          endLocal: toZonedTime(o.endUtc, tzid).toISOString(),
        })),
      },
    });
  } catch (error: any) {
    console.error("[DEBUG_SLOTS_DETAIL]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
