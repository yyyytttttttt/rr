export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prizma";
import crypto from "crypto";
import { sendMail } from "../../../lib/mailer";
import { logger } from "../../../lib/logger";

export async function POST(req: Request) {
 
  const body = await req.json().catch(() => ({} as any));
  const emailRaw = typeof body?.email === "string" ? body.email : "";
  const normalEmail = emailRaw.trim().toLowerCase();

  if (!normalEmail) {
    return NextResponse.json({ error: "NO_EMAIL" }, { status: 400 });
  }

 
  const user = await prisma.user.findUnique({
    where: { email: normalEmail },
    select: { emailVerified: true },
  });

 
  if (!user) {
    return NextResponse.json({ ok: true });
  }


  if (user.emailVerified) {
    return NextResponse.json(
      {error:'EMAIL_ALREADY_VERIFIED', message:'почта уже подтверждена.'},
      {status:409}
    );
    
  } 

  
  await prisma.verificationToken.deleteMany({
    where: { identifier: normalEmail },
  });

  const raw = crypto.randomBytes(32).toString("hex");
  const tokenHash = crypto.createHash("sha256").update(raw).digest("hex");
  const expires = new Date(Date.now() + 24 * 60 * 60 * 1000);

  await prisma.verificationToken.create({
    data: { identifier: normalEmail, token: tokenHash, expires },
  });

  const link = `${process.env.NEXTAUTH_URL}/verify?token=${raw}&email=${encodeURIComponent(
    normalEmail
  )}`;

 
  try {
    await sendMail({
      to: normalEmail,
      subject: "Подтвердите e-mail",
      html: `<p>Подтвердите почту:</p>
             <p><a href="${link}">${link}</a></p>
             <p>Ссылка активна 24 часа.</p>`,
    });
  } catch (e) {
    logger.error("[RESEND_MAIL_ERROR]", e);
    
  }

  return NextResponse.json({ ok: true });
}
