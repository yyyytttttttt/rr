import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../../../lib/auth";
import { prisma } from "../../../../../lib/prizma";
import { z } from "zod";

const serviceSchema = z.object({
  name: z.string().min(1),
  description: z.string().nullable().optional(),
  priceCents: z.number().int().min(0),
  currency: z.string().min(1),
  durationMin: z.number().int().min(1),
  isActive: z.boolean().optional(),
  bufferMinOverride: z.number().int().min(0).nullable().optional(),
  categoryId: z.string().nullable().optional()
    .transform(v => v === "" || !v ? null : v),
});

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
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

  const { id } = params;
  const body = await req.json();
  const parsed = serviceSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation error", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const data = parsed.data;

  const service = await prisma.service.update({
    where: { id },
    data: {
      name: data.name,
      description: data.description ?? null,
      priceCents: data.priceCents,
      currency: data.currency,
      durationMin: data.durationMin,
      isActive: data.isActive ?? true,
      bufferMinOverride: data.bufferMinOverride ?? null,
      categoryId: data.categoryId ?? null,
    },
    select: {
      id: true,
      name: true,
      description: true,
      priceCents: true,
      currency: true,
      durationMin: true,
      isActive: true,
      bufferMinOverride: true,
    },
  });

  return NextResponse.json({ ok: true, service });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
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

  const { id } = params;

  // Check for active bookings
  const activeBookings = await prisma.booking.count({
    where: {
      serviceId: id,
      status: { in: ["PENDING", "CONFIRMED"] },
      startUtc: { gte: new Date() },
    },
  });

  if (activeBookings > 0) {
    return NextResponse.json(
      { error: "Cannot delete service with active bookings" },
      { status: 409 }
    );
  }

  await prisma.service.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}
