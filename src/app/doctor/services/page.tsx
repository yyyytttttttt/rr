import { getServerSession } from "next-auth";
import { authOptions } from "../../../lib/auth";
import { prisma } from "../../../lib/prizma";
import { redirect } from "next/navigation";
import DoctorServicesClient from "./client";

export default async function DoctorServicesPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/Login?from=/doctor/services");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      role: true,
      name: true,
      doctor: { select: { id: true } },
    },
  });

  if (!user || (user.role !== "DOCTOR" && user.role !== "ADMIN") || !user.doctor) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-4xl mx-auto bg-white rounded-lg shadow p-6">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Доступ запрещён</h1>
          <p className="text-gray-600">
            Ваш аккаунт не привязан к роли «Врач». Обратитесь к администратору.
          </p>
        </div>
      </div>
    );
  }

  return <DoctorServicesClient doctorId={user.doctor.id} doctorName={user.name || "Врач"} />;
}
