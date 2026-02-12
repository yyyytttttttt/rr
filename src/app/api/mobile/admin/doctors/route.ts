import { NextRequest, NextResponse } from "next/server";
import { requireAuth, createCorsResponse } from "../../../../../lib/jwt";
import { prisma } from "../../../../../lib/prizma";
import { z } from "zod";
import { serverError } from "../../../../../lib/api-error";

const bodySchema = z.object({
  userId: z.string().min(1).optional(),
  email: z.string().email().optional(),
  title: z.string().optional(),
  tzid: z.string().default("UTC"),
  minLeadMin: z.number().int().min(0).default(60),
  gridStepMin: z.number().int().min(1).default(10),
  slotDurationMin: z.number().int().min(1).default(30),
  bufferMin: z.number().int().min(0).default(0),
});

export async function OPTIONS(request: NextRequest) {
  return createCorsResponse(request);
}

export async function GET(req: NextRequest) {
  const auth = requireAuth(req, ['ADMIN']);

  if ('error' in auth) {
    return auth.error;
  }

  const url = new URL(req.url);
  const q = (url.searchParams.get("query") ?? "").trim().toLowerCase();
  const page = Math.max(1, Number(url.searchParams.get("page") ?? 1));
  const pageSize = Math.min(100, Math.max(1, Number(url.searchParams.get("pageSize") ?? 20)));

  console.log("[MOBILE_ADMIN_DOCTORS] GET - query:", q, "page:", page, "pageSize:", pageSize);

  try {
    const where = q
      ? {
          OR: [
            { title: { contains: q, mode: "insensitive" as const } },
            { user: { name: { contains: q, mode: "insensitive" as const } } },
            { user: { email: { contains: q, mode: "insensitive" as const } } },
            { user: { phone: { contains: q, mode: "insensitive" as const } } },
          ],
        }
      : {};

    const total = await prisma.doctor.count({ where });

    const doctors = await prisma.doctor.findMany({
      where,
      select: {
        id: true,
        title: true,
        rating: true,
        reviewCount: true,
        createdAt: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            image: true,
          },
        },
        _count: {
          select: { doctorServices: true },
        },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    console.log(`[MOBILE_ADMIN_DOCTORS] Found ${doctors.length} doctors (total: ${total})`);

    return NextResponse.json({ items: doctors, total, page, pageSize });
  } catch (error) {
    console.error("[MOBILE_ADMIN_DOCTORS] Error:", error);
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const auth = requireAuth(req, ['ADMIN']);

  if ('error' in auth) {
    return auth.error;
  }

  console.log("[MOBILE_ADMIN_DOCTORS] POST - creating new doctor");

  try {
    const json = await req.json();
    const parsed = bodySchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Ошибка валидации", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const {
      userId, email, title,
      tzid, minLeadMin, gridStepMin, slotDurationMin, bufferMin,
    } = parsed.data;

    if (!userId && !email) {
      return NextResponse.json(
        { error: "Необходимо указать userId или email" },
        { status: 400 }
      );
    }

    let doctorUserId = userId ?? null;

    if (!doctorUserId && email) {
      const user = await prisma.user.upsert({
        where: { email },
        update: { role: "DOCTOR" },
        create: { email, role: "DOCTOR" },
        select: { id: true },
      });
      doctorUserId = user.id;
    }

    if (doctorUserId && userId) {
      await prisma.user.update({
        where: { id: doctorUserId },
        data: { role: "DOCTOR" },
      }).catch(() => null);
    }

    const doctor = await prisma.doctor.create({
      data: {
        user: { connect: { id: doctorUserId! } },
        title: title ?? null,
        tzid,
        minLeadMin,
        gridStepMin,
        slotDurationMin,
        bufferMin,
      },
      select: {
        id: true, userId: true, title: true,
        tzid: true, minLeadMin: true, gridStepMin: true, slotDurationMin: true, bufferMin: true,
        createdAt: true,
      },
    });

    console.log("[MOBILE_ADMIN_DOCTORS] Created doctor:", doctor.id);

    return NextResponse.json({ ok: true, doctor }, { status: 201 });
  } catch (e: unknown) {
    return serverError('[MOBILE_ADMIN_DOCTORS] Error creating doctor', e);
  }
}
