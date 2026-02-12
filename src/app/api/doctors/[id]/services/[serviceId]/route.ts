import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../../../../lib/auth";
import { prisma } from "../../../../../../lib/prizma";

// Admin endpoint - remove service from a doctor
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; serviceId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "DOCTOR")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: doctorId, serviceId } = await params;

    // DOCTOR can only modify their own services
    if (session.user.role === "DOCTOR") {
      const me = await prisma.doctor.findFirst({
        where: { userId: session.user.id },
        select: { id: true },
      });
      if (!me || me.id !== doctorId) {
        return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
      }
    }

    // Проверяем что связь существует
    const doctorService = await prisma.doctorService.findUnique({
      where: {
        doctorId_serviceId: {
          doctorId,
          serviceId,
        },
      },
    });

    if (!doctorService) {
      return NextResponse.json({ error: "Service not linked to doctor" }, { status: 404 });
    }

    // Удаляем связь (или делаем неактивной)
    await prisma.doctorService.update({
      where: {
        doctorId_serviceId: {
          doctorId,
          serviceId,
        },
      },
      data: { isActive: false },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to remove service:", error);
    return NextResponse.json({ error: "Failed to remove service" }, { status: 500 });
  }
}
