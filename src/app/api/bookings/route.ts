// app/api/bookings/route.ts
import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prizma"
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../lib/auth";
import { generateOccurrences } from "../../../lib/rrule";

const schema = z.object({
  doctorId: z.string().min(1),
  serviceId: z.string().min(1),
  start: z.string().datetime(),
  note: z.preprocess(
    (val) => (typeof val === 'string' && val.trim() === '' ? undefined : val),
    z.string().max(500).optional()
  ),
});

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "VALIDATION" }, { status: 400 });
  }

  const { doctorId, serviceId, start, note } = parsed.data;

  // 1) Проверяем услугу и связку с врачом
  const service = await prisma.service.findUnique({
    where: { id: serviceId },
    select: { durationMin: true, doctorServices: { where: { doctorId, isActive: true }, select: { doctorId: true } } },
  });

  if (!service) {
    return NextResponse.json({ error: "Service not found" }, { status: 404 });
  }

  // NOTE: Validate doctor-service link exists
  if (service.doctorServices.length === 0) {
    return NextResponse.json({ error: "Service not available for this doctor" }, { status: 400 });
  }
  if (!Number.isFinite(service.durationMin) || service.durationMin <= 0) {
    return NextResponse.json({ error: "BAD_SERVICE_DURATION" }, { status: 500 });
  }

  // 2) Считаем интервал брони
  const startUtc = new Date(start);
  if (Number.isNaN(startUtc.getTime())) {
    return NextResponse.json({ error: "INVALID_START" }, { status: 400 });
  }
  const endUtc = new Date(startUtc.getTime() + service.durationMin * 60_000);

  
  if (startUtc < new Date()) return NextResponse.json({ error: "PAST_TIME" }, { status: 400 });

  // 3) Должно существовать окно врача, полностью накрывающее интервал
  const coveringOpening = await prisma.opening.findFirst({
    where: { doctorId, startUtc: { lte: startUtc }, endUtc: { gte: endUtc } },
    select: { id: true },
  });
  if (!coveringOpening) {
    return NextResponse.json({ error: "NO_OPENING" }, { status: 409 });
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
    return NextResponse.json({ error: "BUSY" }, { status: 409 });
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

  // 6) Создаём бронь (пока PENDING)
  try {
    const created = await prisma.booking.create({
      data: {
        doctorId,
        userId: session.user.id,
        serviceId,
        startUtc,
        endUtc,
        status: "PENDING",
        note: note ?? null,
      },
      select: { id: true },
    });

    return NextResponse.json({ ok: true, id: created.id });
  } catch (error: any) {
    // Handle unique constraint violation
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: "SLOT_TAKEN", message: "Это время уже занято. Пожалуйста, выберите другое время." },
        { status: 409 }
      );
    }
    throw error;
  }
}

// NOTE: Get bookings (user or admin)
export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  const url = new URL(req.url);
  const mine = url.searchParams.get("mine");
  const isAdmin = session.user.role === "ADMIN";

  // If "mine=1" is specified, always return user format (not admin format)
  const returnAdminFormat = isAdmin && mine !== "1";

  // Admin filters
  const query = url.searchParams.get("query") ?? "";
  const doctorId = url.searchParams.get("doctorId");
  const serviceId = url.searchParams.get("serviceId");
  const status = url.searchParams.get("status");
  const page = Math.max(1, Number(url.searchParams.get("page") ?? 1));
  const pageSize = Math.min(100, Math.max(1, Number(url.searchParams.get("pageSize") ?? 50)));

  // Build where clause
  const where: any = {};

  // User filter
  if (mine === "1") {
    where.userId = session.user.id;
  } else if (!isAdmin) {
    // Non-admins can only see their own bookings
    where.userId = session.user.id;
  }

  // Admin filters (only apply if not requesting "mine")
  if (returnAdminFormat) {
    if (doctorId) where.doctorId = doctorId;
    if (serviceId) where.serviceId = serviceId;
    if (status) where.status = status;

    // Search by client name, email, phone or booking ID
    if (query) {
      where.OR = [
        { id: { contains: query, mode: "insensitive" as const } },
        { user: { name: { contains: query, mode: "insensitive" as const } } },
        { user: { email: { contains: query, mode: "insensitive" as const } } },
        { user: { phone: { contains: query, mode: "insensitive" as const } } },
      ];
    }
  }

  // Всегда считаем total для пагинации
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
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
        },
      },
      service: {
        select: {
          id: true,
          name: true,
          priceCents: true,
          currency: true,
        },
      },
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
      payment: {
        select: {
          status: true,
        },
      },
    },
    orderBy: { startUtc: "desc" },
    skip: (page - 1) * pageSize,
    take: pageSize,
  });

  // NOTE: Transform to flat structure
  const transformed = bookings.map((b) => ({
    id: b.id,
    startUtc: b.startUtc.toISOString(),
    endUtc: b.endUtc.toISOString(),
    status: b.status,
    note: b.note,
    clientName: b.clientName || b.user?.name || "Клиент",
    clientEmail: b.clientEmail || b.user?.email || "",
    clientPhone: b.clientPhone || b.user?.phone || "",
    serviceName: b.service.name,
    serviceId: b.service.id,
    priceCents: b.service.priceCents,
    currency: b.service.currency,
    doctorName: b.doctor.user.name || b.doctor.title || "Врач",
    doctorId: b.doctor.id,
    doctorImage: b.doctor.user.image,
    paymentStatus: b.payment?.status || null,
    // Legacy format for backward compatibility
    service: {
      id: b.service.id,
      name: b.service.name,
      priceCents: b.service.priceCents,
      currency: b.service.currency,
    },
    doctor: {
      name: b.doctor.user.name || b.doctor.title || "Врач",
      image: b.doctor.user.image || null,
    },
  }));

  if (returnAdminFormat) {
    return NextResponse.json({ items: transformed, total, page, pageSize });
  }

  // Для обычных пользователей тоже возвращаем пагинацию
  return NextResponse.json({ bookings: transformed, total, page, pageSize });
}
