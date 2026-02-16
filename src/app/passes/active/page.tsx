import { getServerSession } from "next-auth";
import { authOptions } from "../../../lib/auth";
import { redirect } from "next/navigation";
import ActivePassClient from "./ActivePassClient";

export default async function ActivePassPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect("/Login?from=/passes/active");
  }
  return <ActivePassClient />;
}

export const metadata = {
  title: "Активная программа",
  description: "Ваша текущая программа здоровья",
};
