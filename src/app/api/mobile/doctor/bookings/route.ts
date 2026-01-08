import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../../lib/prizma';
import { requireAuth, createCorsResponse } from '../../../../../lib/jwt';

// Обработка OPTIONS для CORS preflight
export async function OPTIONS(request: NextRequest) {
  return createCorsResponse(request);
}

// GET - Получить бронирования врача
export async function GET(request: NextRequest) {
  const auth = requireAuth(request, ['DOCTOR', 'ADMIN']);

  if ('error' in auth) {
    return auth.error;
  }

  const { userId } = auth.payload;

  try {
    // Найти доктора по userId
    const doctor = await prisma.doctor.findUnique({
      where: { userId },
    });

    if (!doctor) {
      return NextResponse.json(
        { error: 'Doctor profile not found' },
        { status: 404 }
      );
    }

    // Получить параметры фильтрации из URL
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status'); // PENDING, CONFIRMED, CANCELED, COMPLETED
    const from = searchParams.get('from'); // ISO date
    const to = searchParams.get('to'); // ISO date

    const where: any = { doctorId: doctor.id };

    if (status) {
      where.status = status;
    }

    if (from || to) {
      where.startUtc = {};
      if (from) where.startUtc.gte = new Date(from);
      if (to) where.startUtc.lte = new Date(to);
    }

    // Получить бронирования
    const bookings = await prisma.booking.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            image: true,
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
      orderBy: { startUtc: 'asc' },
    });

    return NextResponse.json({ bookings, doctorId: doctor.id });
  } catch (error) {
    console.error('[MOBILE_DOCTOR_BOOKINGS] GET error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch bookings' },
      { status: 500 }
    );
  }
}

// PATCH - Изменить статус бронирования
export async function PATCH(request: NextRequest) {
  const auth = requireAuth(request, ['DOCTOR', 'ADMIN']);

  if ('error' in auth) {
    return auth.error;
  }

  const { userId } = auth.payload;

  try {
    const body = await request.json();
    const { bookingId, status } = body;

    if (!bookingId || !status) {
      return NextResponse.json(
        { error: 'bookingId and status are required' },
        { status: 400 }
      );
    }

    // Проверка допустимых статусов
    const validStatuses = ['PENDING', 'CONFIRMED', 'CANCELED', 'COMPLETED', 'NO_SHOW'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status' },
        { status: 400 }
      );
    }

    // Найти доктора
    const doctor = await prisma.doctor.findUnique({
      where: { userId },
    });

    if (!doctor) {
      return NextResponse.json(
        { error: 'Doctor profile not found' },
        { status: 404 }
      );
    }

    // Проверить что бронирование принадлежит этому доктору
    const booking = await prisma.booking.findFirst({
      where: {
        id: bookingId,
        doctorId: doctor.id,
      },
    });

    if (!booking) {
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      );
    }

    // Обновить статус
    const updatedBooking = await prisma.booking.update({
      where: { id: bookingId },
      data: { status },
      include: {
        user: {
          select: {
            name: true,
            email: true,
            phone: true,
          },
        },
        service: {
          select: {
            name: true,
            priceCents: true,
            currency: true,
          },
        },
      },
    });

    console.info(`[MOBILE_DOCTOR_BOOKINGS] Updated booking ${bookingId} to ${status} by doctor ${doctor.id}`);

    return NextResponse.json({ success: true, booking: updatedBooking });
  } catch (error) {
    console.error('[MOBILE_DOCTOR_BOOKINGS] PATCH error:', error);
    return NextResponse.json(
      { error: 'Failed to update booking status' },
      { status: 500 }
    );
  }
}
