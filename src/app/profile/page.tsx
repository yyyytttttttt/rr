import { getServerSession } from "next-auth";
import { authOptions } from "../../lib/auth";
import { prisma } from "../../lib/prizma";
import { redirect } from "next/navigation";
import ProfileContent from "./_components/ProfileContent";
import BottomNav from '../components/menus/BottomNav'

type View = "home" | "booking" | "healthpasses" | "history" | "gifts" | "settings";

const VALID_VIEWS: View[] = ["home", "booking", "healthpasses", "history", "gifts", "settings"];

type Props = {
  searchParams: Promise<{ view?: string; date?: string }>;
};

export default async function ProfilePage({ searchParams }: Props) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/Login?from=/profile");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      phone: true,
    },
  });

  if (!user) {
    redirect("/Login");
  }

  // NOTE: Get timezone from user settings or default to Europe/Moscow
  const tzid = "Europe/Moscow"; // TODO: store in user preferences

  const params = await searchParams;
  let view: View = "home";
  if (params.view && VALID_VIEWS.includes(params.view as View)) {
    view = params.view as View;
  }

  const panelProps = {
    userId: user.id,
    tzid,
    userName: user.name || "",
    userEmail: user.email || "",
    userImage: user.image || "",
    userPhone: user.phone || null,
    initialDate: params.date,
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <ProfileContent view={view} panelProps={panelProps} user={user} />
      <BottomNav></BottomNav>
    </div>
  );
}

export const metadata = {
  title: "Личный кабинет",
  description: "Управление записями, профилем и настройками",
};
