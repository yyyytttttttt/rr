// app/api/mobile/admin/bookings/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../../../lib/prizma";
import { z } from "zod";
import { requireAuth, createCorsResponse } from "../../../../../lib/jwt";
import { generateOccurrences } from "../../../../../lib/rrule";

const schema = z.object({
  doctorId: z.string().min(1),
  serviceId: z.string().min(1),
  start: z.string().datetime(),
  note: z.string().max(500).optional(),
  clientName: z.string().min(1).optional(),
  clientEmail: z.string().email().optional(),
  clientPhone: z.string().optional(),
});

// Обработка OPTIONS для CORS preflight
export async function OPTIONS(request: NextRequest) {
  return createCorsResponse(request);
}

export async function GET(req: NextRequest) {
  const auth = requireAuth(req, ['ADMIN']);

  if ('error' in auth) {
    return auth.error;
  }

  if (auth.payload.role !== 'ADMIN') {
    return NextResponse.json({ error: "Доступ запрещен" }, { status: 403 });
  }

  const url = new URL(req.url);
  const doctorId = url.searchParams.get("doctorId") || undefined;
  const status = url.searchParams.get("status") || undefined;
  const page = Math.max(1, Number(url.searchParams.get("page") ?? 1));
  const pageSize = Math.min(100, Math.max(1, Number(url.searchParams.get("pageSize") ?? 20)));

  console.log("[MOBILE_ADMIN_BOOKINGS] GET - doctorId:", doctorId, "status:", status, "page:", page);

  try {
    const where: any = {};

    if (doctorId) {
      where.doctorId = doctorId;
    }

    if (status) {
      where.status = status;
    }

    const total = await prisma.booking.count({ where });

    const bookings = await prisma.booking.findMany({
      where,
      select: {
        id: true,
        startUtc: true,
        endUtc: true,
        status: true,
        note: true,
        clientName: true,
        clientEmail: true,
        clientPhone: true,
        createdAt: true,
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
        service: {
          select: {
            id: true,
            name: true,
            priceCents: true,
            currency: true,
            durationMin: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            image: true,
          },
        },
      },
      orderBy: { startUtc: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    console.log(`[MOBILE_ADMIN_BOOKINGS] Found ${bookings.length} bookings (total: ${total})`);

    return NextResponse.json({ items: bookings, total, page, pageSize });
  } catch (error) {
    console.error("[MOBILE_ADMIN_BOOKINGS] Error:", error);
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const auth = requireAuth(req, ['ADMIN']);

  if ('error' in auth) {
    return auth.error;
  }

  // Проверяем что пользователь - ADMIN
  if (auth.payload.role !== 'ADMIN') {
    return NextResponse.json({ error: "Доступ запрещен" }, { status: 403 });
  }

  console.log("[MOBILE_ADMIN_BOOKINGS] POST request by user:", auth.payload.userId);

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Ошибка валидации", details: parsed.error.flatten() }, { status: 400 });
  }

  const { doctorId, serviceId, start, note, clientName, clientEmail, clientPhone } = parsed.data;

  // 1) Проверяем услугу и связку с врачом
  const service = await prisma.service.findUnique({
    where: { id: serviceId },
    select: { durationMin: true, doctorServices: { where: { doctorId, isActive: true }, select: { doctorId: true } } },
  });

  if (!service) {
    return NextResponse.json({ error: "Услуга не найдена" }, { status: 404 });
  }

  // NOTE: Validate doctor-service link exists
  if (service.doctorServices.length === 0) {
    return NextResponse.json({ error: "Услуга недоступна для этого врача" }, { status: 400 });
  }
  if (!Number.isFinite(service.durationMin) || service.durationMin <= 0) {
    return NextResponse.json({ error: "Некорректная длительность услуги" }, { status: 500 });
  }

  // 2) Считаем интервал брони
  const startUtc = new Date(start);
  if (Number.isNaN(startUtc.getTime())) {
    return NextResponse.json({ error: "Некорректное время начала" }, { status: 400 });
  }
  const endUtc = new Date(startUtc.getTime() + service.durationMin * 60_000);

  // NOTE: Allow admins to create bookings in the past for historical records
  // if (startUtc < new Date()) return NextResponse.json({ error: "PAST_TIME" }, { status: 400 });

  // 3) Должно существовать окно врача, полностью накрывающее интервал
  const coveringOpening = await prisma.opening.findFirst({
    where: { doctorId, startUtc: { lte: startUtc }, endUtc: { gte: endUtc } },
    select: { id: true },
  });
  if (!coveringOpening) {
    return NextResponse.json({ error: "NO_OPENING", message: "Нет доступного окна приема в это время" }, { status: 409 });
  }

  // 4) Не должно быть пересечения с активными бронями
  const conflict = await prisma.booking.findFirst({
    where: {
      doctorId,
      status: { in: ["PENDING", "CONFIRMED"] },
      startUtc: { lt: endUtc },
      endUtc: { gt: startUtc },
    },
    select: { id: true },
  });
  if (conflict) {
    return NextResponse.json({ error: "BUSY", message: "Это время уже занято" }, { status: 409 });
  }

  // 5) Проверка unavailability блокировок (VACATION, DAY_OFF, NO_BOOKINGS)
  const doctor = await prisma.doctor.findUnique({
    where: { id: doctorId },
    select: { tzid: true },
  });

  const unavailabilities = await prisma.unavailability.findMany({
    where: {
      doctorId,
      OR: [
        // Обычные блокировки, пересекающиеся с бронью
        {
          start: { lt: endUtc },
          end: { gt: startUtc },
        },
        // Повторяющиеся блокировки
        {
          rrule: { not: null },
        },
      ],
    },
    select: {
      type: true,
      start: true,
      end: true,
      rrule: true,
      rruleUntil: true,
      tzid: true,
      reason: true,
    },
  });

  // Проверяем пересечения с unavailability блоками
  for (const unavail of unavailabilities) {
    if (unavail.rrule) {
      // Проверяем повторяющиеся блокировки
      const occurrences = generateOccurrences(
        unavail.rrule,
        unavail.start,
        unavail.end,
        startUtc,
        endUtc,
        unavail.tzid,
        unavail.rruleUntil
      );

      for (const occ of occurrences) {
        // Проверяем пересечение
        if (occ.start < endUtc && occ.end > startUtc) {
          const reasonMsg = unavail.reason ? `: ${unavail.reason}` : "";
          const typeMsg = unavail.type === "VACATION"
            ? "отпуск"
            : unavail.type === "DAY_OFF"
            ? "выходной"
            : "день без записей";

          return NextResponse.json({
            error: "UNAVAILABLE",
            message: `В это время приёмов нет (${typeMsg}${reasonMsg})`,
          }, { status: 409 });
        }
      }
    } else {
      // Обычная блокировка - уже проверена в WHERE запросе
      const reasonMsg = unavail.reason ? `: ${unavail.reason}` : "";
      const typeMsg = unavail.type === "VACATION"
        ? "отпуск"
        : unavail.type === "DAY_OFF"
        ? "выходной"
        : "день без записей";

      return NextResponse.json({
        error: "UNAVAILABLE",
        message: `В это время приёмов нет (${typeMsg}${reasonMsg})`,
      }, { status: 409 });
    }
  }

  // 6) Попробуем найти или создать пользователя по email
  let userId: string | null = null;

  if (clientEmail) {
    const existingUser = await prisma.user.findUnique({
      where: { email: clientEmail },
      select: { id: true },
    });
    userId = existingUser?.id || null;
  }

  // 7) Создаём бронь
  try {
    const created = await prisma.booking.create({
      data: {
        doctorId,
        userId, // NOTE: Can be null if client doesn't have an account
        serviceId,
        startUtc,
        endUtc,
        status: "CONFIRMED", // NOTE: Admin bookings are auto-confirmed
        note: note ?? null,
        // NOTE: Store client info directly on booking for non-registered clients
        clientName: clientName || null,
        clientEmail: clientEmail || null,
        clientPhone: clientPhone || null,
      },
      select: { id: true },
    });

    console.log("[MOBILE_ADMIN_BOOKINGS] Created booking:", created.id);
    return NextResponse.json({ ok: true, id: created.id });
  } catch (error: any) {
    // Handle unique constraint violation (slot already taken)
    if (error.code === "P2002") {
      return NextResponse.json(
        {
          error: "SLOT_TAKEN",
          message: "Это время уже занято другой записью",
        },
        { status: 409 }
      );
    }
    console.error("[MOBILE_ADMIN_BOOKINGS] Error creating booking:", error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
