import { getServerSession } from "next-auth";
import { authOptions } from "../../../lib/auth";
import { prisma } from "../../../lib/prizma";
import ClientTemplates from "./client";

export default async function Page({ searchParams }: { searchParams: Promise<{ doctorId?: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return (
      <div className="p-6">
        <a
          className="underline"
          href={`/api/auth/signin?callbackUrl=${encodeURIComponent("/doctor/templates")}`}
        >
          Войти
        </a>
      </div>
    );
  }

  // Get doctorId from query params (for admin viewing another doctor's templates)
  const params = await searchParams;
  const queryDoctorId = params?.doctorId;

  // Check if user is admin
  const user = await prisma.user.findUnique({
    where: { email: session.user.email || undefined },
    select: { role: true },
  });

  let doctor;

  if (queryDoctorId && (user?.role === "ADMIN" || user?.role === "DOCTOR")) {
    // Admin or doctor viewing another doctor's templates
    doctor = await prisma.doctor.findUnique({
      where: { id: queryDoctorId },
      select: {
        id: true,
        title: true,
        user: { select: { name: true, email: true } }
      },
    });

    if (!doctor) {
      return <div className="p-6">Врач не найден.</div>;
    }
  } else {
    // Regular doctor viewing their own templates
    doctor = await prisma.doctor.findFirst({
      where: { userId: session.user.id },
      select: {
        id: true,
        title: true,
        user: { select: { name: true, email: true } }
      },
    });

    if (!doctor) {
      return <div className="p-6">Ваш аккаунт не привязан к роли «Врач». Обратитесь к администратору.</div>;
    }
  }

  return (
    <ClientTemplates
      doctorId={doctor.id}
      doctorName={doctor.user?.name || doctor.title || "Врач"}
    />
  );
}
