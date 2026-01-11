import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../../lib/prizma";
import { fromZonedTime, toZonedTime } from "date-fns-tz";
import { addDays, isBefore, max as maxDate, min as minDate } from "date-fns";

function dayBoundsUtc(dayYYYYMMDD: string, tzid: string) {
  const dateString = `${dayYYYYMMDD}T00:00:00`;
  const startUtc = fromZonedTime(dateString, tzid);
  const endUtc = addDays(startUtc, 1);
  return { startUtc, endUtc };
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const doctorId = url.searchParams.get("doctorId") || "";
  const day = url.searchParams.get("day") || "2026-01-14";
  const tzid = url.searchParams.get("tzid") || "Europe/Moscow";

  try {
    // 1. Границы дня
    const { startUtc: dayStart, endUtc: dayEnd } = dayBoundsUtc(day, tzid);

    // 2. Openings из БД
    const openings = await prisma.opening.findMany({
      where: {
        doctorId,
        startUtc: { lt: dayEnd },
        endUtc: { gt: dayStart },
      },
      select: { id: true, startUtc: true, endUtc: true },
    });

    // 3. Schedules
    const schedules = await prisma.schedule.findMany({
      where: { doctorId },
      select: { byWeekday: true, startTime: true, endTime: true },
    });

    // 4. Проверяем день недели
    const localDayStart = toZonedTime(dayStart, tzid);
    const weekdayLocal = localDayStart.getDay(); // 0 - Sun, 1 - Mon ...

    return NextResponse.json({
      debug: {
        day,
        tzid,
        doctorId,
        dayStart: dayStart.toISOString(),
        dayEnd: dayEnd.toISOString(),
        localDayStart: {
          date: localDayStart.toISOString(),
          weekday: weekdayLocal,
          weekdayName: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][weekdayLocal],
        },
      },
      openings: openings.map((o) => ({
        id: o.id,
        startUtc: o.startUtc.toISOString(),
        endUtc: o.endUtc.toISOString(),
        startLocal: toZonedTime(o.startUtc, tzid).toISOString(),
        endLocal: toZonedTime(o.endUtc, tzid).toISOString(),
        intersects: o.startUtc < dayEnd && o.endUtc > dayStart,
      })),
      schedules: schedules.map((s) => ({
        byWeekday: s.byWeekday,
        startTime: s.startTime,
        endTime: s.endTime,
        matchesWeekday: s.byWeekday?.includes(weekdayLocal),
      })),
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
