import { getServerSession } from "next-auth";
import { authOptions } from "../../lib/auth";
import { redirect } from "next/navigation";
import PassesCatalogClient from "./PassesCatalogClient";

export default async function PassesCatalogPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect("/Login?from=/passes");
  }
  return <PassesCatalogClient />;
}

export const metadata = {
  title: "Программы здоровья",
  description: "Выберите программу ежедневных заданий",
};
