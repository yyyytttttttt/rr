// app/api/bookings/route.ts
import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prizma"
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../lib/auth";
import { generateOccurrences } from "../../../lib/rrule";
import { startOfDay, addDays, endOfWeek } from "date-fns";
import { logger } from "../../../lib/logger";
import { calculateBookingQuote } from "../../../lib/booking-quote";
import { rateLimit, sanitizeIp } from "../../../lib/rate-limit";
import { serverError } from "../../../lib/api-error";

const bookingLimiter = rateLimit({ windowMs: 60_000, max: 10, keyPrefix: 'booking-create' });

const schema = z.object({
  doctorId: z.string().min(1),
  serviceId: z.string().min(1),
  start: z.string().datetime(),
  note: z.preprocess(
    (val) => (typeof val === 'string' && val.trim() === '' ? undefined : val),
    z.string().max(500).optional()
  ),
  promoCode: z.string().max(50).optional(),
  paymentMethod: z.enum(['online', 'onsite']).optional(),
});

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  const ip = sanitizeIp(
    req.headers.get('x-forwarded-for'),
    req.headers.get('x-real-ip'),
  );
  const rl = await bookingLimiter(ip);
  if (!rl.ok) {
    return NextResponse.json(
      { error: 'TOO_MANY_REQUESTS' },
      { status: 429, headers: { 'Retry-After': String(rl.retryAfterSec) } },
    );
  }

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "VALIDATION" }, { status: 400 });
  }

  const { doctorId, serviceId, start, note, promoCode, paymentMethod } = parsed.data;

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

  // 6) Calculate server-side pricing
  let quote;
  try {
    quote = await calculateBookingQuote({
      serviceIds: [serviceId],
      promoCode,
      userId: session.user.id,
    });
  } catch (e: unknown) {
    return serverError('[BOOKINGS] quote calculation', e);
  }

  // 7) Создаём бронь + atomic promo redemption в транзакции
  try {
    const result = await prisma.$transaction(async (tx) => {
      const booking = await tx.booking.create({
        data: {
          doctorId,
          userId: session.user.id,
          serviceId,
          startUtc,
          endUtc,
          status: "PENDING",
          note: note ?? null,
          baseAmountCents: quote.baseAmountCents,
          discountAmountCents: quote.discountAmountCents,
          finalAmountCents: quote.finalAmountCents,
          promoCodeId: quote.promoId,
          promoCodeSnapshot: quote.promoValid ? promoCode?.trim() : null,
          paymentMethod: paymentMethod ?? null,
          serviceSnapshot: quote.services[0],
        },
        select: { id: true },
      });

      // Atomic promo reservation
      if (quote.promoId && quote.promoValid) {
        // Race-safe maxUses enforcement via raw SQL
        const reserved: number = await tx.$executeRaw`
          UPDATE "PromoCode"
          SET "usedCount" = "usedCount" + 1, "updatedAt" = NOW()
          WHERE id = ${quote.promoId}
            AND "isActive" = true
            AND ("maxUses" IS NULL OR "usedCount" < "maxUses")
        `;
        if (reserved !== 1) {
          throw new Error('PROMO_EXHAUSTED');
        }

        await tx.promoRedemption.create({
          data: {
            promoCodeId: quote.promoId,
            userId: session.user.id,
            bookingId: booking.id,
            discountPercentSnapshot: quote.discountPercent,
            discountCentsSnapshot: quote.discountCentsFixed,
            baseAmountCents: quote.baseAmountCents,
            discountAmountCents: quote.discountAmountCents,
            finalAmountCents: quote.finalAmountCents,
          },
        });
      }

      return booking;
    });

    return NextResponse.json({
      ok: true,
      id: result.id,
      baseAmountCents: quote.baseAmountCents,
      discountAmountCents: quote.discountAmountCents,
      finalAmountCents: quote.finalAmountCents,
      currency: quote.currency,
      promoApplied: quote.promoValid,
    });
  } catch (error: any) {
    // Promo exhausted (atomic check failed)
    if (error.message === 'PROMO_EXHAUSTED') {
      return NextResponse.json(
        { error: 'PROMO_EXHAUSTED', message: 'Промокод исчерпан' },
        { status: 409 },
      );
    }

    // Unique constraint violations (P2002)
    if (error.code === 'P2002') {
      const target = Array.isArray(error.meta?.target) ? error.meta.target.join(',') : String(error.meta?.target ?? '');
      if (target.includes('one_promo_per_user')) {
        return NextResponse.json(
          { error: 'PROMO_ALREADY_USED', message: 'Вы уже использовали этот промокод' },
          { status: 409 },
        );
      }
      if (target.includes('bookingId')) {
        return NextResponse.json(
          { error: 'PROMO_ALREADY_ON_BOOKING', message: 'К этой записи уже применён промокод' },
          { status: 409 },
        );
      }
      // Default: slot collision
      return NextResponse.json(
        { error: "SLOT_TAKEN", message: "Это время уже занято. Пожалуйста, выберите другое время." },
        { status: 409 }
      );
    }

    return serverError('[BOOKINGS] Error creating booking', error);
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
  const userId = url.searchParams.get("userId");
  const serviceId = url.searchParams.get("serviceId");
  const status = url.searchParams.get("status");
  const dateFilter = url.searchParams.get("date");
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
    if (userId) where.userId = userId;
    if (doctorId) where.doctorId = doctorId;
    if (serviceId) where.serviceId = serviceId;
    if (status) where.status = status;

    // Date filter
    if (dateFilter) {
      const now = new Date();
      const todayStart = startOfDay(now);
      if (dateFilter === "today") {
        where.startUtc = { gte: todayStart, lt: addDays(todayStart, 1) };
      } else if (dateFilter === "tomorrow") {
        where.startUtc = { gte: addDays(todayStart, 1), lt: addDays(todayStart, 2) };
      } else if (dateFilter === "week") {
        where.startUtc = { gte: todayStart, lt: addDays(endOfWeek(now, { weekStartsOn: 1 }), 1) };
      }
    }

    // Search by client name, email, phone, doctor, service or booking ID
    if (query) {
      where.OR = [
        { id: { contains: query, mode: "insensitive" as const } },
        { user: { name: { contains: query, mode: "insensitive" as const } } },
        { user: { email: { contains: query, mode: "insensitive" as const } } },
        { user: { phone: { contains: query, mode: "insensitive" as const } } },
        { clientName: { contains: query, mode: "insensitive" as const } },
        { clientPhone: { contains: query, mode: "insensitive" as const } },
        { doctor: { user: { name: { contains: query, mode: "insensitive" as const } } } },
        { service: { name: { contains: query, mode: "insensitive" as const } } },
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
      baseAmountCents: true,
      discountAmountCents: true,
      finalAmountCents: true,
      promoCodeSnapshot: true,
      paymentMethod: true,
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
    baseAmountCents: b.baseAmountCents,
    discountAmountCents: b.discountAmountCents,
    finalAmountCents: b.finalAmountCents,
    promoCodeSnapshot: b.promoCodeSnapshot,
    paymentMethod: b.paymentMethod,
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
