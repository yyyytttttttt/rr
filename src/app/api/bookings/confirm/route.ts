import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prizma';
import crypto from 'crypto';
import { logger } from '../../../../lib/logger';

/**
 * GET /api/bookings/confirm?token=xxx&bookingId=xxx
 * Подтвердить гостевое бронирование по email ссылке
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');
    const bookingId = searchParams.get('bookingId');

    if (!token || !bookingId) {
      return NextResponse.json(
        { error: 'Отсутствуют обязательные параметры' },
        { status: 400 }
      );
    }

    // Хэшируем токен для сравнения
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    // Ищем токен в базе
    const verificationToken = await prisma.verificationToken.findFirst({
      where: {
        identifier: `booking:${bookingId}`,
        token: tokenHash,
      },
    });

    if (!verificationToken) {
      return NextResponse.json(
        { error: 'Недействительная ссылка подтверждения', code: 'INVALID_TOKEN' },
        { status: 400 }
      );
    }

    // Проверяем срок действия
    if (verificationToken.expires < new Date()) {
      // Удаляем просроченный токен
      await prisma.verificationToken.delete({
        where: {
          identifier_token: {
            identifier: verificationToken.identifier,
            token: verificationToken.token,
          },
        },
      });

      return NextResponse.json(
        { error: 'Ссылка подтверждения истекла', code: 'TOKEN_EXPIRED' },
        { status: 400 }
      );
    }

    // Находим бронирование
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        doctor: {
          include: {
            user: { select: { name: true } },
          },
        },
        service: {
          select: { name: true, priceCents: true, durationMin: true },
        },
      },
    });

    if (!booking) {
      return NextResponse.json(
        { error: 'Бронирование не найдено', code: 'BOOKING_NOT_FOUND' },
        { status: 404 }
      );
    }

    // Проверяем статус
    if (booking.status === 'CONFIRMED') {
      return NextResponse.json({
        success: true,
        message: 'Запись уже подтверждена',
        alreadyConfirmed: true,
        booking: {
          id: booking.id,
          doctorName: booking.doctor.user?.name || booking.doctor.title,
          serviceName: booking.service.name,
          startUtc: booking.startUtc,
          status: booking.status,
        },
      });
    }

    if (booking.status === 'CANCELED') {
      return NextResponse.json(
        { error: 'Эта запись была отменена', code: 'BOOKING_CANCELED' },
        { status: 400 }
      );
    }

    // Подтверждаем бронирование
    const updatedBooking = await prisma.booking.update({
      where: { id: bookingId },
      data: { status: 'CONFIRMED' },
      include: {
        doctor: {
          include: {
            user: { select: { name: true } },
          },
        },
        service: {
          select: { name: true, priceCents: true, durationMin: true },
        },
      },
    });

    // Удаляем использованный токен
    await prisma.verificationToken.delete({
      where: {
        identifier_token: {
          identifier: verificationToken.identifier,
          token: verificationToken.token,
        },
      },
    });

    logger.debug('[BOOKING_CONFIRM] Booking confirmed', { bookingId });

    return NextResponse.json({
      success: true,
      message: 'Запись успешно подтверждена!',
      booking: {
        id: updatedBooking.id,
        doctorName: updatedBooking.doctor.user?.name || updatedBooking.doctor.title,
        serviceName: updatedBooking.service.name,
        startUtc: updatedBooking.startUtc,
        endUtc: updatedBooking.endUtc,
        status: updatedBooking.status,
        clientName: updatedBooking.clientName,
      },
    });

  } catch (error) {
    logger.error('[BOOKING_CONFIRM] Error', error);
    return NextResponse.json(
      { error: 'Ошибка при подтверждении записи', code: 'SERVER_ERROR' },
      { status: 500 }
    );
  }
}
