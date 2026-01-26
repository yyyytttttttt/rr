import { getServerSession } from "next-auth";
import { authOptions } from "../../lib/auth";
import { prisma } from "../../lib/prizma";
import { redirect } from "next/navigation";
import DoctorContent from "./_components/DoctorContent";

type View = "home" | "calendar" | "services" | "schedule" | "blocks" | "settings";

const VALID_VIEWS: View[] = ["home", "calendar", "services", "schedule", "blocks", "settings"];

type Props = {
  searchParams: Promise<{ view?: string }>;
};

export default async function DoctorPage({ searchParams }: Props) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/Login?from=/doctor");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      role: true,
      name: true,
      email: true,
      image: true,
      doctor: {
        select: {
          id: true,
          title: true,
          rating: true,
          reviewCount: true,
          tzid: true,
          bufferMin: true,
          slotDurationMin: true,
          minLeadMin: true,
        },
      },
    },
  });

  if (!user || (user.role !== "DOCTOR" && user.role !== "ADMIN") || !user.doctor) {
    return (
      <div className="min-h-screen bg-[#FFFCF3] flex items-center justify-center p-8">
        <div className="max-w-md w-full bg-white rounded-[20px] border border-[#E8E2D5] p-[clamp(1.5rem,1.2692rem+1.0256vw,2.5rem)]">
          <h1 className="text-[clamp(1.5rem,1.2692rem+1.0256vw,2.5rem)] font-ManropeBold text-[#967450] mb-4">
            Доступ запрещён
          </h1>
          <p className="text-[clamp(0.875rem,0.8077rem+0.2885vw,1.125rem)] font-ManropeRegular text-[#636846] mb-6">
            Ваш аккаунт не привязан к роли «Врач». Обратитесь к администратору.
          </p>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-[clamp(0.5rem,0.4423rem+0.2564vw,0.75rem)] bg-[#5C6744] px-[clamp(2rem,1.6538rem+1.5385vw,3.5rem)] py-[clamp(0.75rem,0.6346rem+0.5128vw,1.25rem)] text-[clamp(1rem,0.9423rem+0.2564vw,1.25rem)] font-ManropeRegular text-white hover:bg-[#4F5938] transition-colors duration-300"
          >
            На главную
          </a>
        </div>
      </div>
    );
  }

  const doctor = user.doctor;

  // NOTE: Get timezone from doctor settings or default to UTC
  const tzid = doctor.tzid || "UTC";

  const params = await searchParams;
  let view: View = "home";
  if (params.view && VALID_VIEWS.includes(params.view as View)) {
    view = params.view as View;
  }

  const panelProps = {
    doctorId: doctor.id,
    tzid,
    doctorName: user.name || "",
    doctorEmail: user.email || "",
    doctorImage: user.image || "",
    doctorTitle: doctor.title || null,
    bufferMin: doctor.bufferMin ?? 15,
    slotDurationMin: doctor.slotDurationMin ?? 30,
    minLeadMin: doctor.minLeadMin ?? 60,
  };

  const doctorInfo = {
    id: doctor.id,
    name: user.name,
    email: user.email,
    image: user.image,
    title: doctor.title,
  };

  return (
    <div className="min-h-screen bg-[#FFFCF3] flex flex-col">
      <DoctorContent view={view} panelProps={panelProps} doctor={doctorInfo} />
    </div>
  );
}

export const metadata = {
  title: "Личный кабинет врача",
  description: "Управление расписанием, записями и настройками",
};
