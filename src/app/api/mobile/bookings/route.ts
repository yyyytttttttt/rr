import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prizma';
import { requireAuth } from '../../../../lib/jwt';
import { z } from 'zod';

// Обработка OPTIONS для CORS preflight
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': 'https://nikropolis.ru',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Credentials': 'true',
    },
  });
}

// GET - Получить бронирования пользователя
export async function GET(request: NextRequest) {
  const auth = requireAuth(request);

  if ('error' in auth) {
    return auth.error;
  }

  const { userId } = auth.payload;

  try {
    const bookings = await prisma.booking.findMany({
      where: { userId },
      include: {
        doctor: {
          include: {
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
            name: true,
            priceCents: true,
            currency: true,
            durationMin: true,
          },
        },
      },
      orderBy: { startUtc: 'desc' },
    });

    return NextResponse.json({ bookings });
  } catch (error) {
    console.error('[MOBILE_BOOKINGS] GET error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch bookings' },
      { status: 500 }
    );
  }
}

// POST - Создать новое бронирование
const createBookingSchema = z.object({
  doctorId: z.string().min(1),
  serviceId: z.string().min(1),
  start: z.string().datetime(),
  note: z.string().max(500).optional(),
});

export async function POST(request: NextRequest) {
  const auth = requireAuth(request);

  if ('error' in auth) {
    return auth.error;
  }

  const { userId } = auth.payload;

  try {
    const body = await request.json();
    const parsed = createBookingSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation error', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { doctorId, serviceId, start, note } = parsed.data;
    const startUtc = new Date(start);

    // Получить информацию о докторе и услуге
    const [doctor, service] = await Promise.all([
      prisma.doctor.findUnique({ where: { id: doctorId } }),
      prisma.service.findUnique({ where: { id: serviceId } }),
    ]);

    if (!doctor || !service) {
      return NextResponse.json(
        { error: 'Doctor or service not found' },
        { status: 404 }
      );
    }

    // Рассчитать endUtc
    const durationMs = service.durationMin * 60 * 1000;
    const endUtc = new Date(startUtc.getTime() + durationMs);

    // Проверить что слот не занят
    const existingBooking = await prisma.booking.findFirst({
      where: {
        doctorId,
        startUtc: { lt: endUtc },
        endUtc: { gt: startUtc },
        status: { notIn: ['CANCELED'] },
      },
    });

    if (existingBooking) {
      return NextResponse.json(
        { error: 'Time slot is already booked' },
        { status: 409 }
      );
    }

    // Создать бронирование
    const booking = await prisma.booking.create({
      data: {
        userId,
        doctorId,
        serviceId,
        startUtc,
        endUtc,
        status: 'PENDING',
        note: note || null,
      },
      include: {
        doctor: {
          include: {
            user: {
              select: { name: true, image: true },
            },
          },
        },
        service: true,
      },
    });

    console.info(`[MOBILE_BOOKINGS] Created booking ${booking.id} for user ${userId}`);

    return NextResponse.json({ success: true, booking }, { status: 201 });
  } catch (error) {
    console.error('[MOBILE_BOOKINGS] POST error:', error);
    return NextResponse.json(
      { error: 'Failed to create booking' },
      { status: 500 }
    );
  }
}
