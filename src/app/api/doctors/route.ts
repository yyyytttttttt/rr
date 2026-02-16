import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prizma";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../lib/auth";
import { serverError } from "../../../lib/api-error";
import bcrypt from "bcrypt";
import crypto from "crypto";

const bodySchema = z.object({
  // один из двух способов: привязать к уже существующему userId ИЛИ создать пользователя по email
  userId: z.string().min(1).optional(),
  email: z.string().email().optional(),
  name: z.string().min(1).optional(),

  // карточка врача
  title: z.string().optional(),

  // таймзона и правила слотов
  tzid: z.string().default("UTC"),          // напр. "Europe/Moscow"
  minLeadMin: z.number().int().min(0).default(60),
  gridStepMin: z.number().int().min(1).default(10),
  slotDurationMin: z.number().int().min(1).default(30),
  bufferMin: z.number().int().min(0).default(0),
});

// NOTE: GET - for admin panel list with pagination
export async function GET(req: Request) {
  const session = await getServerSession(authOptions);

  // NOTE: Only admins can access
  if (session?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  }

  const url = new URL(req.url);
  const q = (url.searchParams.get("query") ?? "").trim().toLowerCase();
  const page = Math.max(1, Number(url.searchParams.get("page") ?? 1));
  const pageSize = Math.min(100, Math.max(1, Number(url.searchParams.get("pageSize") ?? 20)));

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

    return NextResponse.json({ items: doctors, total, page, pageSize });
  } catch (error) {
    console.error("Failed to fetch doctors:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  // [SEC] создание врача — только ADMIN
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  }

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
      userId, email, name, title,
      tzid, minLeadMin, gridStepMin, slotDurationMin, bufferMin,
    } = parsed.data;

    if (!userId && !email) {
      return NextResponse.json(
        { error: "USER_REQUIRED", message: "Нужно передать userId или email для создания пользователя DOCTOR." },
        { status: 400 }
      );
    }

    // 1) получаем/создаём пользователя с ролью DOCTOR
    let doctorUserId = userId ?? null;
    let generatedPassword: string | null = null;

    if (!doctorUserId && email) {
      // Проверим, существует ли пользователь
      const existing = await prisma.user.findUnique({
        where: { email },
        select: { id: true, doctor: { select: { id: true } } },
      });

      if (existing?.doctor) {
        return NextResponse.json(
          { error: "Этот пользователь уже является специалистом" },
          { status: 409 }
        );
      }

      if (existing) {
        // Пользователь есть — просто меняем роль
        await prisma.user.update({
          where: { id: existing.id },
          data: { role: "DOCTOR" },
        });
        doctorUserId = existing.id;
      } else {
        // Создаём нового пользователя с безопасным паролем
        generatedPassword = crypto.randomBytes(12).toString("base64url").slice(0, 16);
        const hashedPassword = await bcrypt.hash(generatedPassword, 12);

        const newUser = await prisma.user.create({
          data: {
            email,
            name: name?.trim() || null,
            password: hashedPassword,
            role: "DOCTOR",
            emailVerified: new Date(),
          },
          select: { id: true },
        });
        doctorUserId = newUser.id;
      }
    }

    // если передали userId — убедимся, что он существует и, при необходимости, выставим роль
    if (doctorUserId && userId) {
      const existingDoctor = await prisma.doctor.findUnique({
        where: { userId: doctorUserId },
        select: { id: true },
      });
      if (existingDoctor) {
        return NextResponse.json(
          { error: "Этот пользователь уже является специалистом" },
          { status: 409 }
        );
      }
      await prisma.user.update({
        where: { id: doctorUserId },
        data: { role: "DOCTOR" },
      }).catch(() => null);
    }

    // 2) создаём врача
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

    const response: any = { ok: true, doctor };
    if (generatedPassword && email) {
      response.credentials = { email, password: generatedPassword };
    }
    return NextResponse.json(response, { status: 201 });
  } catch (e: unknown) {
    return serverError('CREATE_DOCTOR_ERR', e);
  }
}
