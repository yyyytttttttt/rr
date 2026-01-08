import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../../lib/prizma';
import { requireAuth, createCorsResponse } from '../../../../../lib/jwt';

// Обработка OPTIONS для CORS preflight
export async function OPTIONS(request: NextRequest) {
  return createCorsResponse(request);
}

// GET - Получить статистику врача
export async function GET(request: NextRequest) {
  const auth = requireAuth(request, ['DOCTOR', 'ADMIN']);

  if ('error' in auth) {
    return auth.error;
  }

  const { userId } = auth.payload;

  try {
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

    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || 'month'; // day, week, month, year

    // Вычислить даты для фильтрации
    const now = new Date();
    let fromDate: Date;

    switch (period) {
      case 'day':
        fromDate = new Date(now);
        fromDate.setHours(0, 0, 0, 0);
        break;
      case 'week':
        fromDate = new Date(now);
        fromDate.setDate(now.getDate() - 7);
        break;
      case 'year':
        fromDate = new Date(now);
        fromDate.setFullYear(now.getFullYear() - 1);
        break;
      case 'month':
      default:
        fromDate = new Date(now);
        fromDate.setMonth(now.getMonth() - 1);
        break;
    }

    // Получить все бронирования за период
    const bookings = await prisma.booking.findMany({
      where: {
        doctorId: doctor.id,
        startUtc: {
          gte: fromDate,
          lte: now,
        },
      },
      include: {
        service: {
          select: {
            priceCents: true,
            currency: true,
          },
        },
      },
    });

    // Подсчитать статистику
    const stats = {
      totalBookings: bookings.length,
      confirmed: bookings.filter(b => b.status === 'CONFIRMED').length,
      pending: bookings.filter(b => b.status === 'PENDING').length,
      completed: bookings.filter(b => b.status === 'COMPLETED').length,
      canceled: bookings.filter(b => b.status === 'CANCELED').length,
      noShow: bookings.filter(b => b.status === 'NO_SHOW').length,

      // Финансовая статистика
      totalRevenueCents: bookings
        .filter(b => b.status === 'COMPLETED')
        .reduce((sum, b) => sum + (b.service?.priceCents || 0), 0),

      currency: bookings[0]?.service?.currency || 'RUB',

      // Процент завершенных
      completionRate: bookings.length > 0
        ? Math.round((bookings.filter(b => b.status === 'COMPLETED').length / bookings.length) * 100)
        : 0,

      // Процент отмен
      cancellationRate: bookings.length > 0
        ? Math.round((bookings.filter(b => b.status === 'CANCELED').length / bookings.length) * 100)
        : 0,

      period,
      fromDate,
      toDate: now,
    };

    return NextResponse.json({ stats });
  } catch (error) {
    console.error('[MOBILE_DOCTOR_STATS] GET error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch statistics' },
      { status: 500 }
    );
  }
}
