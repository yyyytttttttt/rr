import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../../../lib/prizma';
import { createCorsResponse } from '../../../../../../lib/jwt';

export async function OPTIONS(request: NextRequest) {
  return createCorsResponse(request);
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: serviceId } = await params;

    // Находим всех докторов, которые предоставляют эту услугу
    const doctorServices = await prisma.doctorService.findMany({
      where: {
        serviceId: serviceId,
        isActive: true,
      },
      include: {
        doctor: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                image: true,
              },
            },
          },
        },
      },
    });

    // Форматируем ответ
    const doctors = doctorServices.map((ds) => ({
      id: ds.doctor.id,
      userId: ds.doctor.userId,
      name: ds.doctor.user.name,
      image: ds.doctor.user.image,
      title: ds.doctor.title,
      rating: ds.doctor.rating,
      reviewCount: ds.doctor.reviewCount,
      slotDurationMin: ds.doctor.slotDurationMin,
    }));

    return NextResponse.json({ doctors });
  } catch (error) {
    console.error('[API] Error fetching doctors for service:', error);
    return NextResponse.json(
      { error: 'Failed to fetch doctors' },
      { status: 500 }
    );
  }
}
