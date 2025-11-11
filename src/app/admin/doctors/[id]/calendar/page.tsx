import { getServerSession } from "next-auth";
import { authOptions } from "../../../../../lib/auth";
import { prisma } from "../../../../../lib/prizma";
import { redirect } from "next/navigation";
import ClientCalendar from "../../../../doctor/calendar/client";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function AdminDoctorCalendarPage({ params }: Props) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    redirect(`/Login?from=/admin/doctors/${(await params).id}/calendar`);
  }

  // Check if user is admin
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { role: true },
  });

  if (!user || (user.role !== "ADMIN" && user.role !== "DOCTOR")) {
    redirect("/Login");
  }

  const { id: doctorId } = await params;

  // Get doctor info
  const doctor = await prisma.doctor.findUnique({
    where: { id: doctorId },
    select: {
      id: true,
      title: true,
      tzid: true,
      bufferMin: true,
      user: {
        select: {
          name: true,
          email: true
        }
      },
    },
  });

  if (!doctor) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">Врач не найден</h1>
        <a href="/admin?view=specialists.base" className="text-blue-600 hover:underline">
          ← Вернуться к списку специалистов
        </a>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center gap-4">
          <a
            href="/admin?view=specialists.base"
            className="text-gray-600 hover:text-gray-900"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M15 18l-6-6 6-6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </a>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Расписание: {doctor.user?.name || doctor.title || "Врач"}
            </h1>
            <p className="text-sm text-gray-600">{doctor.user?.email}</p>
          </div>
        </div>
      </div>

      {/* Calendar */}
      <ClientCalendar
        doctorId={doctor.id}
        tzid={doctor.tzid || "UTC"}
        doctorName={doctor.user?.name || doctor.title || "Врач"}
        bufferMin={doctor.bufferMin ?? 15}
      />
    </div>
  );
}
