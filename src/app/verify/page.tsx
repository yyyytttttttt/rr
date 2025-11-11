export const runtime = "nodejs";

import { prisma } from "../../lib/prizma";
import crypto from "crypto";
import Link from "next/link";
import { ResendButton } from "../components/profile/ResendEmailButton";

export default async function VerifyPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string; token?: string }>;
}) {
  const sp = await searchParams;           
  const email = (sp.email ?? "").toLowerCase();
  const raw   = sp.token ?? "";

  if (!email || !raw) {
    return (
      <div>
        Неверная ссылка. <Link href="/login">На страницу входа</Link>
      </div>
    );
  }

  const tokenHash = crypto.createHash("sha256").update(raw).digest("hex");


  const rec = await prisma.verificationToken.findUnique({
    where: { identifier_token: { identifier: email, token: tokenHash } },
  });

  if (!rec) {
    return (
      <div>
        Токен не найден или уже использован. <ResendButton email={email} />
      </div>
    );
  }

  
  if (rec.expires < new Date()) {
   
    await prisma.verificationToken.deleteMany({
      where: { identifier: email, expires: { lt: new Date() } },
    });

    return (
      <div>
        <p>Ссылка истекла.</p>
        <ResendButton email={email} />
      </div>
    );
  }


  await prisma.$transaction([
    prisma.user.update({
      where: { email },
      data: { emailVerified: new Date() },
    }),
    prisma.verificationToken.deleteMany({ where: { identifier: email } }),
  ]);

  return (
    <div>
      Почта подтверждена! <Link href="/login">Войти</Link>
    </div>
  );
}
