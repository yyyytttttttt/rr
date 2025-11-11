import { getServerSession } from "next-auth";
import { authOptions } from "../../../lib/auth";
import { prisma } from "../../../lib/prizma";
import { redirect } from "next/navigation";
import AdminSlotsClient from "./client";

export default async function AdminSlotsPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    redirect("/Login?from=/admin/slots");
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { role: true },
  });

  if (!user || user.role !== "ADMIN") {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-4xl mx-auto bg-white rounded-lg shadow p-6">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Доступ запрещён</h1>
          <p className="text-gray-600">Требуется роль администратора.</p>
        </div>
      </div>
    );
  }

  return <AdminSlotsClient />;
}
