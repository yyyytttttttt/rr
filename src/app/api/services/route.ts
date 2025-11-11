import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prizma";
import { z } from "zod";

const bodySchema = z.object({
  doctorId: z.string().min(1), // NOTE: Still needed to create M:N link
  name: z.string().min(1),
  description: z.string().optional(),
  priceCents: z.number().int().min(0),
  currency: z.string().min(1),            // напр. "RUB", "USD", "EUR", "ILS"
  durationMin: z.number().int().min(1),   // длительность услуги
  isActive: z.boolean().optional().default(true),

  // если услуге нужен больший буфер, чем у врача
  bufferMinOverride: z.number().int().min(0).optional(),
});

export async function POST(req: Request) {
  try {
    const json = await req.json();
    const parsed = bodySchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "VALIDATION", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const {
      doctorId, name, description, priceCents, currency,
      durationMin, isActive, bufferMinOverride,
    } = parsed.data;

    // проверим, что врач существует
    const doc = await prisma.doctor.findUnique({ where: { id: doctorId }, select: { id: true } });
    if (!doc) {
      return NextResponse.json({ error: "DOCTOR_NOT_FOUND" }, { status: 404 });
    }

    // NOTE: Create service and link to doctor via M:N relation
    const service = await prisma.service.create({
      data: {
        name,
        description: description ?? null,
        priceCents,
        currency,
        durationMin,
        isActive: isActive ?? true,
        bufferMinOverride: bufferMinOverride ?? null,
        doctorServices: {
          create: [{ doctorId }]
        }
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
        createdAt: true,
      },
    });

    return NextResponse.json({ ok: true, service }, { status: 201 });
  } catch (e: any) {
    console.error("CREATE_SERVICE_ERR", e);
    return NextResponse.json(
      { error: "INTERNAL", message: e?.message ?? "Unknown error" },
      { status: 500 }
    );
  }
}
