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

  const { userId, role } = auth.payload;

  try {
    // Получить параметры из URL
    const { searchParams } = new URL(request.url);
    const doctorIdParam = searchParams.get('doctorId');
    const status = searchParams.get('status'); // PENDING, CONFIRMED, CANCELED, COMPLETED
    const from = searchParams.get('from'); // ISO date
    const to = searchParams.get('to'); // ISO date
    const filter = searchParams.get('filter'); // today | upcoming | all

    // Определяем ID врача в зависимости от роли
    let doctor;

    if (role === 'ADMIN') {
      // Админ может смотреть бронирования любого врача
      if (!doctorIdParam) {
        return NextResponse.json(
          { error: 'Для админа необходимо указать doctorId в query параметрах' },
          { status: 400 }
        );
      }

      doctor = await prisma.doctor.findUnique({
        where: { id: doctorIdParam },
      });
    } else {
      // Врач смотрит свои бронирования
      doctor = await prisma.doctor.findUnique({
        where: { userId },
      });
    }

    if (!doctor) {
      return NextResponse.json(
        { error: 'Doctor profile not found' },
        { status: 404 }
      );
    }

    const where: any = { doctorId: doctor.id };

    // Применяем filter (today | upcoming | all) если указан
    if (filter) {
      const now = new Date();
      const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);

      if (filter === 'today') {
        where.status = { in: ['PENDING', 'CONFIRMED'] };
        where.startUtc = {
          gte: startOfToday,
          lt: endOfToday,
        };
      } else if (filter === 'upcoming') {
        where.status = { in: ['PENDING', 'CONFIRMED'] };
        where.startUtc = { gte: now };
      }
      // filter === 'all' - без дополнительных фильтров
    } else {
      // Обратная совместимость: используем старые параметры status, from, to
      if (status) {
        where.status = status;
      }

      if (from || to) {
        where.startUtc = {};
        if (from) where.startUtc.gte = new Date(from);
        if (to) where.startUtc.lte = new Date(to);
      }
    }

    // Получить бронирования
    const bookings = await prisma.booking.findMany({
      where,
      select: {
        id: true,
        startUtc: true,
        endUtc: true,
        status: true,
        note: true,
        createdAt: true,
        clientName: true,
        clientEmail: true,
        clientPhone: true,
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
            id: true,
            name: true,
            priceCents: true,
            currency: true,
            durationMin: true,
          },
        },
      },
      orderBy: { startUtc: 'asc' },
    });

    // Формируем ответ с unified client объектом
    const formattedBookings = bookings.map((b) => ({
      id: b.id,
      startUtc: b.startUtc,
      endUtc: b.endUtc,
      status: b.status,
      note: b.note,
      createdAt: b.createdAt,
      service: b.service
        ? {
            id: b.service.id,
            name: b.service.name,
            durationMin: b.service.durationMin,
            priceCents: b.service.priceCents,
            currency: b.service.currency,
          }
        : null,
      client: {
        id: b.user?.id || null,
        name: b.user?.name || b.clientName || null,
        email: b.user?.email || b.clientEmail || null,
        phone: b.user?.phone || b.clientPhone || null,
        image: b.user?.image || null,
      },
    }));

    return NextResponse.json({
      ok: true,
      bookings: formattedBookings,
      doctorId: doctor.id
    });
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

  const { userId, role } = auth.payload;

  try {
    const body = await request.json();
    const { bookingId, status, doctorId: doctorIdFromBody } = body;

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

    // Определяем ID врача в зависимости от роли
    let doctorId: string;

    if (role === 'ADMIN') {
      // Админ должен указать doctorId в body или можно получить из booking
      if (doctorIdFromBody) {
        doctorId = doctorIdFromBody;
      } else {
        // Если не указан, получаем из самого бронирования
        const bookingData = await prisma.booking.findUnique({
          where: { id: bookingId },
          select: { doctorId: true },
        });

        if (!bookingData) {
          return NextResponse.json(
            { error: 'Booking not found' },
            { status: 404 }
          );
        }

        doctorId = bookingData.doctorId;
      }
    } else {
      // Врач работает со своими бронированиями
      const doctor = await prisma.doctor.findUnique({
        where: { userId },
      });

      if (!doctor) {
        return NextResponse.json(
          { error: 'Doctor profile not found' },
          { status: 404 }
        );
      }

      doctorId = doctor.id;
    }

    // Проверить что бронирование принадлежит этому доктору
    const booking = await prisma.booking.findFirst({
      where: {
        id: bookingId,
        doctorId: doctorId,
      },
    });

    if (!booking) {
      return NextResponse.json(
        { error: 'Booking not found or does not belong to this doctor' },
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

    console.info(`[MOBILE_DOCTOR_BOOKINGS] Updated booking ${bookingId} to ${status} by doctor ${doctorId} (role: ${role})`);

    return NextResponse.json({ success: true, booking: updatedBooking });
  } catch (error) {
    console.error('[MOBILE_DOCTOR_BOOKINGS] PATCH error:', error);
    return NextResponse.json(
      { error: 'Failed to update booking status' },
      { status: 500 }
    );
  }
}
