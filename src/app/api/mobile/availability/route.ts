import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prizma';
import { createCorsResponse } from '../../../../lib/jwt';

export async function OPTIONS(request: NextRequest) {
  return createCorsResponse(request);
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const serviceId = searchParams.get('serviceId');
    const doctorId = searchParams.get('doctorId');
    const date = searchParams.get('date'); // YYYY-MM-DD

    if (!serviceId || !doctorId || !date) {
      return NextResponse.json({ error: 'Missing params' }, { status: 400 });
    }

    // Получаем openings доктора на эту дату
    const startOfDay = new Date(`${date}T00:00:00Z`);
    const endOfDay = new Date(`${date}T23:59:59Z`);

    const openings = await prisma.opening.findMany({
      where: {
        doctorId,
        startUtc: { gte: startOfDay },
        endUtc: { lte: endOfDay },
      },
      orderBy: { startUtc: 'asc' },
    });

    // Получаем существующие бронирования
    const bookings = await prisma.booking.findMany({
      where: {
        doctorId,
        startUtc: { gte: startOfDay },
        endUtc: { lte: endOfDay },
        status: { in: ['PENDING', 'CONFIRMED'] },
      },
    });

    const bookedTimes = new Set(bookings.map(b => b.startUtc.toISOString()));

    const slots = openings
      .filter(o => !bookedTimes.has(o.startUtc.toISOString()))
      .map(o => ({
        start: o.startUtc.toISOString(),
        end: o.endUtc.toISOString(),
      }));

    return NextResponse.json({
      doctors: [{ id: doctorId, slots }],
    });
  } catch (error) {
    console.error('[API] Error:', error);
    return NextResponse.json({ error: 'Failed to fetch availability' }, { status: 500 });
  }
}
