import { getServerSession } from "next-auth";
import { authOptions } from "../../lib/auth";
import { redirect } from "next/navigation";
import AdminContent from "./_components/AdminContent";

type View =
  | "specialists.schedule"
  | "specialists.base"
  | "clients.base"
  | "clients.bookings"
  | "services.manage"
  | "services.categories"
  | "settings";

const VALID_VIEWS: View[] = [
  "specialists.schedule",
  "specialists.base",
  "clients.base",
  "clients.bookings",
  "services.manage",
  "services.categories",
  "settings",
];

type Props = {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
};

export default async function AdminPage({ searchParams }: Props) {
  const session = await getServerSession(authOptions);

  // NOTE: Check authentication and ADMIN role
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    redirect("/Login?from=/admin");
  }

  const params = (await searchParams) ?? {};
  let view: View = "clients.bookings"; // default view

  if (params.view && typeof params.view === "string" && VALID_VIEWS.includes(params.view as View)) {
    view = params.view as View;
  }

  const panelProps = {
    userId: session.user.id,
    filters: params,
  };

  return (
    <div className="min-h-screen bg-[#FFFCF3] flex flex-col">
      <AdminContent
        view={view}
        panelProps={panelProps}
        userName={session.user.name || ""}
        userEmail={session.user.email || ""}
        userImage={session.user.image || ""}
      />
    </div>
  );
}

export const metadata = {
  title: "Панель администратора",
  description: "Управление записями, специалистами и клиентами",
};
