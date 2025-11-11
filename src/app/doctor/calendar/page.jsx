import { getServerSession } from "next-auth";
import { authOptions } from "../../../lib/auth";
import { prisma } from "../../../lib/prizma";
import ClientCalendar from "../calendar/client";

export default async function Page({ searchParams }) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return (
      <div className="p-6">
        <a
          className="underline"
          href={`/api/auth/signin?callbackUrl=${encodeURIComponent("/doctor/calendar")}`}
        >
          Войти
        </a>
      </div>
    );
  }

  // Get doctorId from query params (for admin viewing another doctor's calendar)
  const params = await searchParams;
  const queryDoctorId = params?.doctorId;

  // Check if user is admin
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { role: true },
  });

  let doctor;

  if (queryDoctorId && (user?.role === "ADMIN" || user?.role === "DOCTOR")) {
    // Admin or doctor viewing another doctor's calendar
    doctor = await prisma.doctor.findUnique({
      where: { id: queryDoctorId },
      select: {
        id: true,
        title: true,
        tzid: true,
        bufferMin: true,
        user: { select: { name: true, email: true } }
      },
    });

    if (!doctor) {
      return <div className="p-6">Врач не найден.</div>;
    }
  } else {
    // Regular doctor viewing their own calendar
    doctor = await prisma.doctor.findFirst({
      where: { userId: session.user.id },
      select: {
        id: true,
        title: true,
        tzid: true,
        bufferMin: true,
        user: { select: { name: true, email: true } }
      },
    });

    if (!doctor) {
      return <div className="p-6">Ваш аккаунт не привязан к роли «Врач». Обратитесь к администратору.</div>;
    }
  }

  return (
    <ClientCalendar
      doctorId={doctor.id}
      tzid={doctor.tzid || "UTC"}
      doctorName={doctor.user?.name || doctor.title || "Врач"}
      bufferMin={doctor.bufferMin ?? 15}
    />
  );
}
