import { NextResponse } from "next/server";
import { prisma } from "../../../../../lib/prizma";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../../../lib/auth";

const Create = z.object({
  action: z.literal("create"),
  doctorId: z.string(),
  start: z.coerce.date(),
  end: z.coerce.date(),
  reason: z.string().trim().max(200).optional(),
});
const Update = z.object({
  action: z.literal("update"),
  id: z.string(),
  doctorId: z.string(),
  start: z.coerce.date(),
  end: z.coerce.date(),
  reason: z.string().trim().max(200).optional(),
});
const Delete = z.object({
  action: z.literal("delete"),
  id: z.string(),
  doctorId: z.string(),
});
const Body = z.discriminatedUnion("action", [Create, Update, Delete]);

export async function POST(req) {
  const raw = await req.json().catch(() => null);
  const p = Body.safeParse(raw);
  if (!p.success) return NextResponse.json({ error: "VALIDATION", details: p.error.flatten() }, { status: 400 });

  const body = p.data;

  // Проверка доступа: врач может менять только свой календарь, админ - любой
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  const targetDoctorId = body.doctorId;

  // Check if user is admin
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });

  const isAdmin = user?.role === "ADMIN";

  // If not admin, check if user is the doctor
  if (!isAdmin) {
    const me = await prisma.doctor.findFirst({
      where: { userId: session.user.id },
      select: { id: true },
    });

    if (!me || me.id !== targetDoctorId) {
      return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
    }
  }

  if (body.action === "create") {
    const start = new Date(body.start);
    const end = new Date(body.end);
    if (!(start < end)) return NextResponse.json({ error: "BAD_RANGE" }, { status: 400 });

    // Разрешаем создавать исключения поверх окон — они «вырезают» доступность.
    // Но запретим, если внутри уже есть активные брони
    const conflict = await prisma.booking.findFirst({
      where: {
        doctorId: body.doctorId,
        status: { in: ["PENDING", "CONFIRMED"] },
        startUtc: { lt: end },
        endUtc: { gt: start },
      },
      select: { id: true },
    });
    if (conflict) return NextResponse.json({ error: "HAS_BOOKINGS" }, { status: 409 });

    const created = await prisma.exception.create({
      data: {
        doctorId: body.doctorId,
        startUtc: start,
        endUtc: end,
        reason: body.reason ?? null,
      },
      select: { id: true },
    });
    return NextResponse.json({ ok: true, id: created.id }, { status: 201 });
  }

  if (body.action === "update") {
    const start = new Date(body.start);
    const end = new Date(body.end);
    if (!(start < end)) return NextResponse.json({ error: "BAD_RANGE" }, { status: 400 });

    // нельзя «накрыть» активные брони
    const conflict = await prisma.booking.findFirst({
      where: {
        doctorId: body.doctorId,
        status: { in: ["PENDING", "CONFIRMED"] },
        startUtc: { lt: end },
        endUtc: { gt: start },
      },
      select: { id: true },
    });
    if (conflict) return NextResponse.json({ error: "HAS_BOOKINGS" }, { status: 409 });

    const upd = await prisma.exception.updateMany({
      where: { id: body.id, doctorId: targetDoctorId },
      data: { startUtc: start, endUtc: end, reason: body.reason ?? null },
    });
    if (upd.count === 0) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
    return NextResponse.json({ ok: true });
  }

  if (body.action === "delete") {
    // нельзя удалить, если внутри есть активные брони
    const row = await prisma.exception.findFirst({
      where: { id: body.id, doctorId: targetDoctorId },
      select: { startUtc: true, endUtc: true },
    });
    if (!row) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });

    const conflict = await prisma.booking.findFirst({
      where: {
        doctorId: body.doctorId,
        status: { in: ["PENDING", "CONFIRMED"] },
        startUtc: { lt: row.endUtc },
        endUtc: { gt: row.startUtc },
      },
      select: { id: true },
    });
    if (conflict) return NextResponse.json({ error: "HAS_BOOKINGS" }, { status: 409 });

    const del = await prisma.exception.deleteMany({ where: { id: body.id, doctorId: targetDoctorId } });
    if (del.count === 0) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "UNKNOWN_ACTION" }, { status: 400 });
}
