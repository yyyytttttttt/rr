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
});
const Update = z.object({
  action: z.literal("update"),
  id: z.string(),
  doctorId: z.string(),
  start: z.coerce.date(),
  end: z.coerce.date(),
});
const Delete = z.object({
  action: z.literal("delete"),
  id: z.string(),
  doctorId: z.string(),
});
type Body = z.infer<typeof Create> | z.infer<typeof Update> | z.infer<typeof Delete>;

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as Body | null;
  if (!body?.action) return NextResponse.json({ error: "NO_ACTION" }, { status: 400 });

  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  const targetDoctorId = (body as any).doctorId;

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
    const p = Create.safeParse(body);
    if (!p.success) return NextResponse.json({ error: "VALIDATION" }, { status: 400 });
    const { doctorId, start, end } = p.data;

    // --- проверки дат ---
    const startDate = new Date(start);
    const endDate = new Date(end);
    if (Number.isNaN(startDate.getTime())) return NextResponse.json({ error: "INVALID_START" }, { status: 400 });
    if (Number.isNaN(endDate.getTime())) return NextResponse.json({ error: "INVALID_END" }, { status: 400 });
    if (startDate >= endDate) return NextResponse.json({ error: "START_GE_END" }, { status: 400 });

    if (startDate < new Date()) return NextResponse.json({ error: "PAST_TIME" }, { status: 400 });

    // --- конфликт с бронями ---
    const conflict = await prisma.booking.findFirst({
      where: {
        doctorId,
        status: { in: ["PENDING", "CONFIRMED"] },
        startUtc: { lt: endDate },
        endUtc: { gt: startDate },
      },
      select: { id: true },
    });
    if (conflict) {
      return NextResponse.json({ error: "HAS_BOOKINGS" }, { status: 409 });
    }

    // --- пересечение с другими окнами (Opening↔Opening) ---
    const openingOverlap = await prisma.opening.findFirst({
      where: {
        doctorId,
        startUtc: { lt: endDate },
        endUtc: { gt: startDate },
      },
      select: { id: true },
    });
    if (openingOverlap) {
      return NextResponse.json({ error: "HAS_OPENING_OVERLAP" }, { status: 409 });
    }

    const created = await prisma.opening.create({
      data: { doctorId, startUtc: startDate, endUtc: endDate },
    });
    return NextResponse.json({ ok: true, id: created.id });
  }

  if (body.action === "update") {
    const p = Update.safeParse(body);
    if (!p.success) return NextResponse.json({ error: "VALIDATION" }, { status: 400 });
    const { id, doctorId, start, end } = p.data;

    // --- проверки дат ---
    const startDate = new Date(start);
    const endDate = new Date(end);
    if (Number.isNaN(startDate.getTime())) return NextResponse.json({ error: "INVALID_START" }, { status: 400 });
    if (Number.isNaN(endDate.getTime())) return NextResponse.json({ error: "INVALID_END" }, { status: 400 });
    if (startDate >= endDate) return NextResponse.json({ error: "START_GE_END" }, { status: 400 });
    if (startDate < new Date()) return NextResponse.json({ error: "PAST_TIME" }, { status: 400 });

    // --- конфликт с бронями ---
    const conflict = await prisma.booking.findFirst({
      where: {
        doctorId,
        status: { in: ["PENDING", "CONFIRMED"] },
        startUtc: { lt: endDate },
        endUtc: { gt: startDate },
      },
      select: { id: true },
    });
    if (conflict) return NextResponse.json({ error: "HAS_BOOKINGS" }, { status: 409 });

    // --- пересечение с другими окнами (кроме самого себя) ---
    const openingOverlap = await prisma.opening.findFirst({
      where: {
        doctorId,
        startUtc: { lt: endDate },
        endUtc: { gt: startDate },
        NOT: { id }, // игнорируем текущее окно
      },
      select: { id: true },
    });
    if (openingOverlap) {
      return NextResponse.json({ error: "HAS_OPENING_OVERLAP" }, { status: 409 });
    }

    // --- доп. защита владения на уровне запроса ---
    const updated = await prisma.opening.updateMany({
      where: { id, doctorId: targetDoctorId },
      data: { startUtc: startDate, endUtc: endDate },
    });
    if (updated.count === 0) {
      return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  }

  if (body.action === "delete") {
    const p = Delete.safeParse(body);
    if (!p.success) return NextResponse.json({ error: "VALIDATION" }, { status: 400 });

    // --- убедимся, что окно принадлежит врачу и вообще существует ---
    const win = await prisma.opening.findFirst({
      where: { id: p.data.id, doctorId: targetDoctorId },
      select: { startUtc: true, endUtc: true },
    });
    if (!win) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });

    // --- запрет удаления, если внутри есть активные брони ---
    const has = await prisma.booking.findFirst({
      where: {
        doctorId: p.data.doctorId,
        status: { in: ["PENDING", "CONFIRMED"] },
        startUtc: { lt: win.endUtc },
        endUtc: { gt: win.startUtc },
      },
      select: { id: true },
    });
    if (has) return NextResponse.json({ error: "HAS_BOOKINGS" }, { status: 409 });

    // --- удаляем с доп. защитой владения ---
    const del = await prisma.opening.deleteMany({ where: { id: p.data.id, doctorId: targetDoctorId } });
    if (del.count === 0) {
      return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "UNKNOWN_ACTION" }, { status: 400 });
}
