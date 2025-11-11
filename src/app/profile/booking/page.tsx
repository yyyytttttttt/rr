import { getServerSession } from "next-auth";
import { authOptions } from "../../../lib/auth";
import { prisma } from "../../../lib/prizma";
import { redirect } from "next/navigation";
import BookingClient from "./client";

export const metadata = {
  title: "Записаться на приём",
};

export default async function ProfileBookingPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/Login?from=/profile/booking");
  }

  // Получаем данные пользователя
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      name: true,
      email: true,
      image: true,
    },
  });

  return (
    <BookingClient
      userName={user?.name || ""}
      userEmail={user?.email || ""}
      userImage={user?.image || ""}
    />
  );
}
