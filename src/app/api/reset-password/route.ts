export const runtime = "nodejs";
import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prizma";
import { invalidateTokenVersionCache } from "../../../lib/auth";
import {z} from "zod";
import bcrypt from "bcrypt";
import crypto from "crypto";

const schema = z.object({
  email: z.email(),
  token: z.string().min(10),
  oldPassword: z.string().min(6),
  password: z.string().min(6),
});

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    console.error("Validation failed:", parsed.error.issues);
    return NextResponse.json({
      error: "VALIDATION",
      details: parsed.error.issues
    }, { status: 400 });
  }
  const email = parsed.data?.email.toLowerCase();
  const raw = parsed.data?.token;
  const oldPassword = parsed.data?.oldPassword;
  const newPassword = parsed.data?.password;
  const tokenHash = crypto.createHash("sha256").update(raw).digest("hex");

  const rec = await prisma.passwordResetToken.findFirst({
    where: { identifier: email, token: tokenHash },
  });

  if (!rec) {
    return NextResponse.json({ error: "TOKEN_INVALID" }, { status: 400 });
  }
  if (rec.expires < new Date()) {
    await prisma.passwordResetToken.deleteMany({
      where: { identifier: email },
    });
    return NextResponse.json({ error: "USER_NOT_FOUND" }, { status: 404 });
  }
  const user = await prisma.user.findUnique({
    where: { email },
  });
  if (!user) {
    return NextResponse.json({ error: "USER_NOT_FOUND" }, { status: 404 });
  }

  // Проверяем старый пароль
  if (!user.password || !(await bcrypt.compare(oldPassword, user.password))) {
    return NextResponse.json({ error: "Старый пароль неверен" }, { status: 400 });
  }

  // Проверяем, что новый пароль отличается от старого
  if (await bcrypt.compare(newPassword, user.password)) {
    return NextResponse.json({ error: "Новый пароль не может совпадать со старым" }, { status: 400 });
  }
  const hash = await bcrypt.hash(newPassword, 12);

  await prisma.$transaction([
    prisma.user.update({
      where: { email },
      data: { password: hash, passwordUpdatedAt: new Date(), tokenVersion: { increment: 1 } },
    }),
    prisma.passwordResetToken.deleteMany({
      where: { identifier: email },
    }),
  ]);

  // [SEC] Инвалидируем кэш tokenVersion после смены пароля
  invalidateTokenVersionCache(user.id);

  return NextResponse.json({ ok: true });
}
