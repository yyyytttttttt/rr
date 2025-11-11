import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../../../lib/prizma";

// GET /api/services/[id]/doctors - получить врачей, предоставляющих услугу
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: serviceId } = await params;

  try {
    // Найти врачей с активной связью к этой услуге
    const doctorServices = await prisma.doctorService.findMany({
      where: {
        serviceId,
        isActive: true,
      },
      select: {
        doctor: {
          select: {
            id: true,
            title: true,
            rating: true,
            reviewCount: true,
            user: {
              select: {
                name: true,
                image: true,
              },
            },
          },
        },
      },
    });

    const doctors = doctorServices.map((ds) => ({
      id: ds.doctor.id,
      name: ds.doctor.user?.name || ds.doctor.title || "Врач",
      title: ds.doctor.title,
      image: ds.doctor.user?.image,
      rating: ds.doctor.rating || 5.0,
      reviewCount: ds.doctor.reviewCount || 0,
    }));

    return NextResponse.json({ doctors });
  } catch (error) {
    console.error("Error loading doctors for service:", error);
    return NextResponse.json(
      { error: "Failed to load doctors" },
      { status: 500 }
    );
  }
}
