import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../lib/auth";
import { prisma } from "../../../lib/prizma";
import ClientUnavailability from "./client";

export const metadata = {
  title: "Блокировки расписания",
};

export default async function UnavailabilityPage({ searchParams }: { searchParams: Promise<{ doctorId?: string }> }) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/Login?from=/doctor/unavailability");
  }

  // Get doctorId from query params (for admin viewing another doctor's unavailability)
  const params = await searchParams;
  const queryDoctorId = params?.doctorId;

  // Check if user is admin
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });

  let doctor;

  if (queryDoctorId && (user?.role === "ADMIN" || user?.role === "DOCTOR")) {
    // Admin or doctor viewing another doctor's unavailability
    doctor = await prisma.doctor.findUnique({
      where: { id: queryDoctorId },
      select: {
        id: true,
        tzid: true,
        user: {
          select: {
            name: true,
            role: true,
          },
        },
      },
    });

    if (!doctor) {
      return <div className="p-6">Врач не найден.</div>;
    }
  } else {
    // Regular doctor viewing their own unavailability
    doctor = await prisma.doctor.findFirst({
      where: { userId: session.user.id },
      select: {
        id: true,
        tzid: true,
        user: {
          select: {
            name: true,
            role: true,
          },
        },
      },
    });

    if (!doctor) {
      redirect("/profile");
    }
  }

  return (
    <ClientUnavailability
      doctorId={doctor.id}
      doctorName={doctor.user.name || "Врач"}
      doctorTzid={doctor.tzid}
      userRole={user?.role || doctor.user.role}
    />
  );
}
