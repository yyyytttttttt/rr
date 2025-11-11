import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../../../../lib/auth";
import { prisma } from "../../../../../../lib/prizma";
import { z } from "zod";

const bodySchema = z.object({
  serviceId: z.string().min(1, "Service ID is required"),
});

// NOTE: GET linked and available services for a doctor
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ doctorId: string }> }
) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { role: true },
  });

  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { doctorId } = await params;

  // Verify doctor exists
  const doctor = await prisma.doctor.findUnique({
    where: { id: doctorId },
    select: { id: true },
  });

  if (!doctor) {
    return NextResponse.json({ error: "Doctor not found" }, { status: 404 });
  }

  // Get linked services
  const linkedServices = await prisma.service.findMany({
    where: {
      doctorServices: { some: { doctorId, isActive: true } },
      isActive: true,
    },
    select: {
      id: true,
      name: true,
      description: true,
      priceCents: true,
      currency: true,
      durationMin: true,
      category: { select: { id: true, name: true } },
    },
    orderBy: { name: "asc" },
  });

  // Get available services (not linked to this doctor)
  const availableServices = await prisma.service.findMany({
    where: {
      isActive: true,
      NOT: { doctorServices: { some: { doctorId, isActive: true } } },
    },
    select: {
      id: true,
      name: true,
      description: true,
      priceCents: true,
      currency: true,
      durationMin: true,
      category: { select: { id: true, name: true } },
    },
    orderBy: { name: "asc" },
  });

  return NextResponse.json({ linked: linkedServices, available: availableServices });
}

// NOTE: POST to link a service to a doctor (idempotent)
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ doctorId: string }> }
) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { role: true },
  });

  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { doctorId } = await params;
  const body = await req.json();
  console.log("POST /api/admin/doctors/[doctorId]/services - doctorId:", doctorId, "body:", body);

  const parsed = bodySchema.safeParse(body);

  if (!parsed.success) {
    console.error("Validation failed:", parsed.error.flatten());
    return NextResponse.json(
      { error: "Validation error", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { serviceId } = parsed.data;
  console.log("Linking service:", serviceId, "to doctor:", doctorId);

  // Verify doctor exists
  const doctor = await prisma.doctor.findUnique({
    where: { id: doctorId },
    select: { id: true },
  });

  if (!doctor) {
    return NextResponse.json({ error: "Doctor not found" }, { status: 404 });
  }

  // Verify service exists
  const service = await prisma.service.findUnique({
    where: { id: serviceId },
    select: { id: true, isActive: true },
  });

  if (!service) {
    return NextResponse.json({ error: "Service not found" }, { status: 404 });
  }

  // NOTE: Idempotent upsert - create or update isActive
  const link = await prisma.doctorService.upsert({
    where: { doctorId_serviceId: { doctorId, serviceId } },
    create: { doctorId, serviceId, isActive: true },
    update: { isActive: true },
    select: { doctorId: true, serviceId: true, isActive: true },
  });

  console.log("Link created/updated:", link);
  return NextResponse.json({ ok: true, link }, { status: 201 });
}
