import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../../../lib/auth";
import { prisma } from "../../../../../lib/prizma";

// Public endpoint - get services linked to a doctor
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: doctorId } = await params;

  const doctor = await prisma.doctor.findUnique({
    where: { id: doctorId },
    select: { id: true },
  });

  if (!doctor) {
    return NextResponse.json({ error: "Doctor not found" }, { status: 404 });
  }

  // Для API возвращаем полную информацию о связи DoctorService
  const doctorServices = await prisma.doctorService.findMany({
    where: { doctorId, isActive: true },
    include: {
      service: {
        include: {
          category: { select: { id: true, name: true } }
        }
      }
    },
    orderBy: { service: { name: "asc" } },
  });

  return NextResponse.json({ services: doctorServices });
}

// Admin endpoint - add services to a doctor
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "DOCTOR")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: doctorId } = await params;
    const body = await req.json();
    const { serviceIds } = body;

    if (!Array.isArray(serviceIds) || serviceIds.length === 0) {
      return NextResponse.json({ error: "Service IDs are required" }, { status: 400 });
    }

    // Проверяем что врач существует
    const doctor = await prisma.doctor.findUnique({
      where: { id: doctorId },
      select: { id: true },
    });

    if (!doctor) {
      return NextResponse.json({ error: "Doctor not found" }, { status: 404 });
    }

    // Добавляем услуги (используем createMany с skipDuplicates)
    const result = await prisma.doctorService.createMany({
      data: serviceIds.map((serviceId: string) => ({
        doctorId,
        serviceId,
        isActive: true,
      })),
      skipDuplicates: true,
    });

    return NextResponse.json({ success: true, count: result.count });
  } catch (error) {
    console.error("Failed to add services:", error);
    return NextResponse.json({ error: "Failed to add services" }, { status: 500 });
  }
}
