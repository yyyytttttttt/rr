// app/api/slots/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../../lib/prizma";
import { createCorsResponse } from "../../../../lib/jwt";
import { z } from "zod";
import { RRule, RRuleSet } from "rrule";
import {
  toZonedTime,
  fromZonedTime,
  formatInTimeZone,
} from "date-fns-tz";
import {
  addDays,
  addMinutes,
  isBefore,
  max as maxDate,
  min as minDate,
  parseISO,
} from "date-fns";
import { generateOccurrences } from "../../../../lib/rrule";

// Обработка OPTIONS для CORS preflight
export async function OPTIONS(request: NextRequest) {
  return createCorsResponse(request);
}

const q = z.object({
  doctorId: z.string().min(1),
  serviceId: z.string().min(1),
  day: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "YYYY-MM-DD"),
  allowPast: z.string().optional(),      // "1" — показывать прошлое
  gridStepMin: z.string().regex(/^\d+$/).optional(), // сетка старта
  minLeadMin: z.string().regex(/^\d+$/).optional(),  // минимальный lead-time
  tzid: z.string().optional(),           // таймзона клиники/врача (временно из query)
});

const MAX_DAYS_AHEAD = 60;
const BLOCKING_STATUSES = ["PENDING", "CONFIRMED"] as const;

// ====== утилиты времени ======
function dayBoundsUtc(dayYYYYMMDD: string, tzid: string) {
  const localStart = new Date(`${dayYYYYMMDD}T00:00:00`);
  const startUtc = fromZonedTime(localStart, tzid);
  const endUtc = addDays(startUtc, 1);
  return { startUtc, endUtc };
}

type Opening = { startUtc: Date; endUtc: Date };

// ====== генерация окон по RRULE, если появится support ======
async function openingsFromRRuleForDay(
  doctorId: string,
  day: string,
  tzid: string
): Promise<Opening[]> {
  // ВАЖНО: в твоей схеме сейчас нет полей rrule/tzid у Schedule.
  // Код ниже активируется, если ты добавишь optional поля: Schedule.rrule (String?), Schedule.tzid (String?)
  const rules = await prisma.schedule.findMany({
    where: { doctorId },
    select: {
      // ожидаемые поля (могут быть отсутствовать сейчас)
      // @ts-ignore
      rrule: true,
      // @ts-ignore
      tzid: true,
      // на случай смешанного режима используем существующие:
      byWeekday: true,
      startTime: true,
      endTime: true,
    },
  });

  // если ни у одной записи нет rrule — выходим
  if (!rules.some((r: any) => !!r.rrule)) return [];

  const tz = (rules.find((r: any) => r?.tzid)?.tzid as string) || tzid || "UTC";
  const { startUtc: dayStart, endUtc: dayEnd } = dayBoundsUtc(day, tz);

  const openings: Opening[] = [];

  for (const rule of rules as any[]) {
    if (!rule.rrule) continue;

    const set = new RRuleSet();
    const base = RRule.fromString(rule.rrule);

    const limited = new RRule({
      ...base.options,
      dtstart: new Date(dayStart.getTime() - 36e5),
      until: new Date(dayEnd.getTime() + 36e5),
    });
    set.rrule(limited);

    // при желании можно добавить exdates/rdates на уровне Schedule (не в твоей схеме сейчас)

    const days = set.between(dayStart, dayEnd, true);

    // для RRULE нужен способ задать локальное время окна;
    // если в schedule оставим startTime/endTime, используем их
    if (!rule.startTime || !rule.endTime) continue;
    const [sh, sm] = rule.startTime.split(":").map(Number);
    const [eh, em] = rule.endTime.split(":").map(Number);

    for (const d of days) {
      // локальный старт/конец окна
      const localStart = new Date(
        `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}T${String(sh).padStart(2, "0")}:${String(sm).padStart(2, "0")}:00`
      );
      const localEnd = new Date(
        `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}T${String(eh).padStart(2, "0")}:${String(em).padStart(2, "0")}:00`
      );

      const start = fromZonedTime(localStart, tz);
      const end = fromZonedTime(localEnd, tz);

      const s = maxDate([start, dayStart]);
      const e = minDate([end, dayEnd]);
      if (isBefore(s, e)) openings.push({ startUtc: s, endUtc: e });
    }
  }

  // слить пересечения
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

// ====== генерация окон по твоему Schedule (byWeekday + start/end) ======
async function openingsFromClassicScheduleForDay(
  doctorId: string,
  day: string,
  tzid: string
): Promise<Opening[]> {
  const { startUtc: dayStart, endUtc: dayEnd } = dayBoundsUtc(day, tzid);

  // Твои расписания: byWeekday: Int[] (0..6?) + startTime "HH:mm" + endTime "HH:mm"
  const schedules = await prisma.schedule.findMany({
    where: { doctorId },
    select: { byWeekday: true, startTime: true, endTime: true },
  });
  if (!schedules.length) return [];

  // определим локальный день недели (0..6) в tz врача/клиники
  const localDayStart = toZonedTime(dayStart, tzid);
  const weekdayLocal = localDayStart.getDay(); // 0 - Sun, 1 - Mon ...

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

  // учтём ручные окна Opening (если они перекрывают день)
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

  // вычтем исключения Exception
  const ex = await prisma.exception.findMany({
    where: {
      doctorId,
      startUtc: { lt: dayEnd },
      endUtc: { gt: dayStart },
    },
    select: { startUtc: true, endUtc: true },
  });

  // вычтем unavailability блокировки (VACATION, DAY_OFF, NO_BOOKINGS)
  const unavailabilities = await prisma.unavailability.findMany({
    where: {
      doctorId,
      OR: [
        // Обычные блокировки в диапазоне
        {
          start: { lt: dayEnd },
          end: { gt: dayStart },
        },
        // Повторяющиеся блокировки
        {
          rrule: { not: null },
        },
      ],
    },
    select: {
      start: true,
      end: true,
      rrule: true,
      rruleUntil: true,
      tzid: true,
    },
  });

  // Разворачиваем unavailability блоки с учётом RRULE
  const unavailBlocks: { startUtc: Date; endUtc: Date }[] = [];
  for (const unavail of unavailabilities) {
    if (unavail.rrule) {
      // Генерируем вхождения повторяющейся блокировки
      const occurrences = generateOccurrences(
        unavail.rrule,
        unavail.start,
        unavail.end,
        dayStart,
        dayEnd,
        unavail.tzid,
        unavail.rruleUntil
      );
      for (const occ of occurrences) {
        unavailBlocks.push({ startUtc: occ.start, endUtc: occ.end });
      }
    } else {
      // Обычная блокировка
      unavailBlocks.push({ startUtc: unavail.start, endUtc: unavail.end });
    }
  }

  // Объединяем исключения и unavailability блоки
  const allExclusions = [...ex, ...unavailBlocks];

  if (!allExclusions.length) {
    // слить пересекающиеся и вернуть
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

  // если исключения есть — режем окна на фрагменты
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
          // Есть пересечение - вырезаем
          if (f.startUtc < os) next.push({ startUtc: f.startUtc, endUtc: os });
          if (oe < f.endUtc) next.push({ startUtc: oe, endUtc: f.endUtc });
        } else {
          // Нет пересечения - оставляем как есть
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

// ====== handler ======
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const parsed = q.safeParse({
      doctorId: url.searchParams.get("doctorId"),
      serviceId: url.searchParams.get("serviceId"),
      day: url.searchParams.get("day"),
      allowPast: url.searchParams.get("allowPast") ?? undefined,
      gridStepMin: url.searchParams.get("gridStepMin") ?? undefined,
      minLeadMin: url.searchParams.get("minLeadMin") ?? undefined,
      tzid: url.searchParams.get("tzid") ?? undefined, // временно из query
    });
    if (!parsed.success) {
      return NextResponse.json(
        { error: "VALIDATION", details: parsed.error.flatten() },
        { status: 400 }
      );
    }
    const { doctorId, serviceId, day, allowPast } = parsed.data;
    const gridStepMin = parsed.data.gridStepMin
      ? Math.max(1, parseInt(parsed.data.gridStepMin, 10))
      : 10; // косметология: удобно 10 мин
    const minLeadMin = parsed.data.minLeadMin
      ? Math.max(0, parseInt(parsed.data.minLeadMin, 10))
      : 60; // например, минимум за 60 мин до визита
    const tzid = parsed.data.tzid || "UTC";

    // горизонт планирования
    const now = new Date();
    const maxAllowed = new Date(now.getTime() + MAX_DAYS_AHEAD * 24 * 60 * 60 * 1000);
    const dayStartProbe = new Date(`${day}T00:00:00.000Z`);
    if (Number.isNaN(dayStartProbe.getTime())) {
      return NextResponse.json({ error: "INVALID_DAY" }, { status: 400 });
    }
    if (dayStartProbe > maxAllowed) {
      return NextResponse.json({ error: "TOO_FAR", maxDays: MAX_DAYS_AHEAD }, { status: 400 });
    }

    // услуга
    const service = await prisma.service.findUnique({
      where: { id: serviceId },
      select: {
        durationMin: true,
        isActive: true,
        doctorServices: {
          where: { doctorId },
          select: { doctorId: true, isActive: true }
        }
      },
    });
    if (!service || service.doctorServices.length === 0 || !service.doctorServices[0].isActive || !service.isActive) {
      return NextResponse.json({ error: "SERVICE_NOT_FOUND" }, { status: 404 });
    }
    if (!Number.isFinite(service.durationMin) || service.durationMin! <= 0) {
      return NextResponse.json({ error: "BAD_SERVICE_DURATION" }, { status: 500 });
    }
    const durationMin = service.durationMin!;

    // врач
    const doctor = await prisma.doctor.findUnique({
      where: { id: doctorId },
      select: {
        slotDurationMin: true, // не обязателен для расчёта, берем из услуги
        bufferMin: true,
      },
    });
    if (!doctor) return NextResponse.json({ error: "DOCTOR_NOT_FOUND" }, { status: 404 });
    const bufferMin = Math.max(0, doctor.bufferMin ?? 0);

    // границы дня (локальный день в tz → UTC)
    const { startUtc: dayStart, endUtc: dayEnd } = dayBoundsUtc(day, tzid);

    // занятость
    const busy = await prisma.booking.findMany({
      where: {
        doctorId,
        status: { in: BLOCKING_STATUSES as any },
        startUtc: { lt: dayEnd },
        endUtc: { gt: dayStart },
      },
      select: { startUtc: true, endUtc: true },
    });
    const intersectsBusy = (s: Date, e: Date) =>
      busy.some((b) => b.startUtc < e && b.endUtc > s);

    // 1) пробуем RRULE (если добавишь поле rrule у Schedule)
    let openings = await openingsFromRRuleForDay(doctorId, day, tzid);

    // 2) иначе классическое расписание + ручные окна + исключения
    if (!openings.length) {
      openings = await openingsFromClassicScheduleForDay(doctorId, day, tzid);
    }

    // защита: если вообще нет окон — вернуть пусто
    if (!openings.length) {
      return NextResponse.json({ slots: [], meta: { tzid, durationMin, bufferMin, gridStepMin, minLeadMin } });
    }

    // слоты: «скользящая сетка»
    const visitMs = durationMin * 60_000;
    const stepMs = gridStepMin * 60_000;
    const minLeadMs = minLeadMin * 60_000;
    const nowPlusLead = new Date(now.getTime() + minLeadMs);

    const slotsSet = new Set<string>();

    for (const win of openings) {
      // выравниваем старт по сетке в ЛОКАЛЬНОЙ TZ
      const localWinStart = toZonedTime(win.startUtc, tzid);
      const alignedLocal = new Date(localWinStart);
      const minutes = alignedLocal.getMinutes();
      const alignedMinutes = Math.ceil(minutes / gridStepMin) * gridStepMin;
      alignedLocal.setMinutes(alignedMinutes, 0, 0);

      let t = fromZonedTime(alignedLocal, tzid).getTime();

      while (t + visitMs <= win.endUtc.getTime()) {
        const s = new Date(t);
        const e = new Date(t + visitMs);

        if (allowPast !== "1" && s < nowPlusLead) {
          t += stepMs;
          continue;
        }
        if (intersectsBusy(s, e)) {
          t += stepMs;
          continue;
        }
        slotsSet.add(s.toISOString());
        t += stepMs;
      }
    }

    const slotsUtc = Array.from(slotsSet).sort();
    const slots = slotsUtc.map((iso) => {
      const d = new Date(iso);
      return {
        startUtc: iso,
        startLocal: formatInTimeZone(d, tzid, "yyyy-MM-dd'T'HH:mm:ssXXX"),
        label: formatInTimeZone(d, tzid, "HH:mm"),
      };
    });

    return NextResponse.json({
      slots,
      meta: {
        tzid,
        durationMin,
        bufferMin,
        gridStepMin,
        minLeadMin,
        maxDaysAhead: MAX_DAYS_AHEAD,
        dayLocal: day,
      },
    });
  } catch (e: any) {
    console.error("SLOTS_API_ERROR", e);
    return NextResponse.json(
      { error: "INTERNAL", message: e?.message ?? "Unknown error" },
      { status: 500 }
    );
  }
}
