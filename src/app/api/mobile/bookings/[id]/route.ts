import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../../lib/prizma';
import { requireAuth, createCorsResponse } from '../../../../../lib/jwt';

// Обработка OPTIONS для CORS preflight
export async function OPTIONS(request: NextRequest) {
  return createCorsResponse(request);
}

// GET - Получить конкретное бронирование
export async function GET(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  const params = await props.params;
  const auth = requireAuth(request);

  if ('error' in auth) {
    return auth.error;
  }

  const { userId, role } = auth.payload;
  const bookingId = params.id;

  try {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
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
        service: true,
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
    });

    if (!booking) {
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      );
    }

    // Проверка прав доступа
    const isOwner = booking.userId === userId;
    const isDoctor = booking.doctor.userId === userId;
    const isAdmin = role === 'ADMIN';

    if (!isOwner && !isDoctor && !isAdmin) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    return NextResponse.json({ booking });
  } catch (error) {
    console.error('[MOBILE_BOOKING_ID] GET error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch booking' },
      { status: 500 }
    );
  }
}

// PATCH - Обновить бронирование (например, изменить note или статус)
export async function PATCH(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  const params = await props.params;
  const auth = requireAuth(request);

  if ('error' in auth) {
    return auth.error;
  }

  const { userId, role } = auth.payload;
  const bookingId = params.id;

  try {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        doctor: true,
      },
    });

    if (!booking) {
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      );
    }

    // Проверка прав доступа
    const isOwner = booking.userId === userId;
    const isDoctor = booking.doctor.userId === userId;
    const isAdmin = role === 'ADMIN';

    if (!isOwner && !isDoctor && !isAdmin) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { note, status } = body;

    const updates: any = {};

    // Пользователь может изменить только note
    if (isOwner && !isDoctor && !isAdmin) {
      if (note !== undefined) updates.note = note;
    }

    // Доктор и админ могут изменить статус
    if (isDoctor || isAdmin) {
      if (status !== undefined) {
        const validStatuses = ['PENDING', 'CONFIRMED', 'CANCELED', 'COMPLETED', 'NO_SHOW'];
        if (!validStatuses.includes(status)) {
          return NextResponse.json(
            { error: 'Invalid status' },
            { status: 400 }
          );
        }
        updates.status = status;
      }
      if (note !== undefined) updates.note = note;
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: 'No valid updates provided' },
        { status: 400 }
      );
    }

    const updatedBooking = await prisma.booking.update({
      where: { id: bookingId },
      data: updates,
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

    console.info(`[MOBILE_BOOKING_ID] Updated booking ${bookingId} by user ${userId}`);

    return NextResponse.json({ success: true, booking: updatedBooking });
  } catch (error) {
    console.error('[MOBILE_BOOKING_ID] PATCH error:', error);
    return NextResponse.json(
      { error: 'Failed to update booking' },
      { status: 500 }
    );
  }
}

// DELETE - Отменить бронирование
export async function DELETE(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  const params = await props.params;
  const auth = requireAuth(request);

  if ('error' in auth) {
    return auth.error;
  }

  const { userId, role } = auth.payload;
  const bookingId = params.id;

  try {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        doctor: true,
      },
    });

    if (!booking) {
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      );
    }

    // Проверка прав доступа
    const isOwner = booking.userId === userId;
    const isDoctor = booking.doctor.userId === userId;
    const isAdmin = role === 'ADMIN';

    if (!isOwner && !isDoctor && !isAdmin) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    // Отменяем бронирование (не удаляем из БД, а меняем статус)
    const canceledBooking = await prisma.booking.update({
      where: { id: bookingId },
      data: { status: 'CANCELED' },
    });

    console.info(`[MOBILE_BOOKING_ID] Canceled booking ${bookingId} by user ${userId}`);

    return NextResponse.json({
      success: true,
      message: 'Booking canceled successfully',
      booking: canceledBooking,
    });
  } catch (error) {
    console.error('[MOBILE_BOOKING_ID] DELETE error:', error);
    return NextResponse.json(
      { error: 'Failed to cancel booking' },
      { status: 500 }
    );
  }
}
