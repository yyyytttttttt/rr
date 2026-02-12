import { NextRequest, NextResponse } from "next/server";
import { requireAuth, createCorsResponse } from "../../../../../../../lib/jwt";
import { prisma } from "../../../../../../../lib/prizma";
import { z } from "zod";
import { logger } from "../../../../../../../lib/logger";

const bodySchema = z.object({
  serviceId: z.string().min(1, "Service ID is required"),
});

// Обработка OPTIONS для CORS preflight
export async function OPTIONS(request: NextRequest) {
  return createCorsResponse(request);
}

// NOTE: GET linked and available services for a doctor
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ doctorId: string }> }
) {
  const auth = requireAuth(req, ['ADMIN']);

  if ('error' in auth) {
    return auth.error;
  }

  const { doctorId } = await params;

  logger.debug('[MOBILE_ADMIN_DOCTOR_SERVICES] GET', { doctorId });

  // Only ADMIN can access this endpoint
  if (auth.payload.role !== 'ADMIN') {
    return NextResponse.json({ error: "Доступ запрещен" }, { status: 403 });
  }

  // Verify doctor exists
  const doctor = await prisma.doctor.findUnique({
    where: { id: doctorId },
    select: { id: true },
  });

  if (!doctor) {
    return NextResponse.json({ error: "Врач не найден" }, { status: 404 });
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
  const auth = requireAuth(req, ['ADMIN']);

  if ('error' in auth) {
    return auth.error;
  }

  const { doctorId } = await params;

  logger.debug('[MOBILE_ADMIN_DOCTOR_SERVICES] POST', { doctorId });

  // Only ADMIN can access this endpoint
  if (auth.payload.role !== 'ADMIN') {
    return NextResponse.json({ error: "Доступ запрещен" }, { status: 403 });
  }

  const body = await req.json();

  const parsed = bodySchema.safeParse(body);

  if (!parsed.success) {
    logger.warn('[MOBILE_ADMIN_DOCTOR_SERVICES] Validation failed');
    return NextResponse.json(
      { error: "Ошибка валидации", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { serviceId } = parsed.data;
  logger.debug('[MOBILE_ADMIN_DOCTOR_SERVICES] Linking service', { serviceId, doctorId });

  // Verify doctor exists
  const doctor = await prisma.doctor.findUnique({
    where: { id: doctorId },
    select: { id: true },
  });

  if (!doctor) {
    return NextResponse.json({ error: "Врач не найден" }, { status: 404 });
  }

  // Verify service exists
  const service = await prisma.service.findUnique({
    where: { id: serviceId },
    select: { id: true, isActive: true },
  });

  if (!service) {
    return NextResponse.json({ error: "Услуга не найдена" }, { status: 404 });
  }

  // NOTE: Idempotent upsert - create or update isActive
  const link = await prisma.doctorService.upsert({
    where: { doctorId_serviceId: { doctorId, serviceId } },
    create: { doctorId, serviceId, isActive: true },
    update: { isActive: true },
    select: { doctorId: true, serviceId: true, isActive: true },
  });

  logger.debug('[MOBILE_ADMIN_DOCTOR_SERVICES] Link created/updated', { serviceId, doctorId });
  return NextResponse.json({ ok: true, link }, { status: 201 });
}
