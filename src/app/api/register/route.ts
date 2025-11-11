export const runtime = 'nodejs';
import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prizma";        // проверь путь к твоему singleton PrismaClient
import bcrypt from "bcrypt";
import { z } from "zod";
import crypto from "crypto";
import {sendMail} from '../../../lib/mailer'

const schema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(6),
  name: z.string().trim().min(1).max(50).optional(),
  phone: z.string().regex(/^\+7 \(\d{3}\) \d{3}-\d{2}-\d{2}$/).optional(),
  birthDate: z.string().regex(/^\d{2}\.\d{2}\.\d{4}$/).optional(),
});


export async function POST(req: Request) {
  const body = await req.json().catch(() => null);

  const parse = schema.safeParse(body);
  if (!parse.success) {
    return NextResponse.json(
      { error: "Validation error", details: parse.error.flatten() },
      { status: 400 }
    );
  }

  const { email, password, name, phone, birthDate } = parse.data;
  const normEmail = email.toLowerCase();

  // Уже есть такой email?
  const existing = await prisma.user.findUnique({ where: { email: normEmail } });
  if (existing) {
    return NextResponse.json({ error: "Этот email уже используется" }, { status: 409 });
  }

  // Преобразование даты из ДД.ММ.ГГГГ в ISO
  let birthDateISO: Date | null = null;
  if (birthDate) {
    const [day, month, year] = birthDate.split('.');
    birthDateISO = new Date(`${year}-${month}-${day}`);
  }

  // Хэш пароля и создание пользователя
  const hash = await bcrypt.hash(password, 11);
  await prisma.user.create({
    data: {
      email: normEmail,
      password: hash,
      name: name ?? null,
      phone: phone ?? null,
      birthDate: birthDateISO,
      role: "USER",
      emailVerified:null

    },
  });
  
  const raw = crypto.randomBytes(32).toString("hex");
  const tokenHash = crypto.createHash('sha256').update(raw).digest('hex')
  const expires = new Date(Date.now() + 24 * 60 * 60 * 1000);
  
  await prisma.verificationToken.create({
    data:{
      identifier:normEmail,
      token:tokenHash,
      expires
    }
  })
  const link = `${process.env.NEXTAUTH_URL}/verify?token=${raw}&email=${encodeURIComponent(email)}`
  try{

    await sendMail({
      to:email,
      subject:'Подтвердите e-mail',
       html: `
        <p>Здравствуйте, ${name}!</p>
        <p>Пожалуйста, подтвердите почту, перейдя по ссылке:</p>
        <p><a href="${link}">${link}</a></p>
        <p>Ссылка активна 24 часа. Если вы не регистрировались — игнорируйте это письмо.</p>
      `,
  
    })
  } catch (e) {
    console.error("[MAIL_SEND_ERROR]", e)
    return NextResponse.json({error:"MAIL_FAIL"},{status:500})

  }


  return NextResponse.json({ ok: true, needVerify: true }, { status: 201 });

}
