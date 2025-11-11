"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";

type Props = {
  doctorId: string;
  tzid: string;
  doctorName: string;
  doctorEmail: string;
  doctorImage: string;
  doctorTitle?: string | null;
  bufferMin?: number;
  slotDurationMin?: number;
  minLeadMin?: number;
};

type Stats = {
  todayCount: number;
  upcomingCount: number;
  totalBookings: number;
};

export default function HomePanel({
  doctorId,
  doctorName,
  doctorTitle,
  bufferMin,
  slotDurationMin,
  minLeadMin,
  tzid,
}: Props) {
  const router = useRouter();
  const [stats, setStats] = useState<Stats>({ todayCount: 0, upcomingCount: 0, totalBookings: 0 });
  const [loading, setLoading] = useState(true);

  const firstName = doctorName?.split(' ')[0] || 'Доктор';

  useEffect(() => {
    // Загрузка статистики
    fetch(`/api/doctor/stats?doctorId=${doctorId}`)
      .then(res => res.json())
      .then(data => {
        if (data.ok) {
          setStats({
            todayCount: data.todayCount || 0,
            upcomingCount: data.upcomingCount || 0,
            totalBookings: data.totalBookings || 0,
          });
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [doctorId]);

  const quickActions = [
    { view: "calendar", icon: "📅", title: "Календарь", description: "Управление расписанием и записями" },
    { view: "services", icon: "💼", title: "Мои услуги", description: "Управление услугами" },
    { view: "schedule", icon: "📋", title: "Расписание", description: "Настройка недельных шаблонов" },
    { view: "blocks", icon: "🏖️", title: "Блокировки", description: "Отпуска, выходные, перерывы" },
  ];

  return (
    <div className="min-h-screen bg-[#FFFCF3] px-[clamp(1rem,0.5385rem+2.0513vw,3rem)] py-[clamp(2rem,1.7692rem+1.0256vw,3rem)]">
      {/* Заголовок */}
      <h1 className="text-[clamp(1.5rem,1.2692rem+1.0256vw,2.5rem)] font-ManropeBold text-[#4F5338] mb-[clamp(2rem,1.5385rem+2.0513vw,4rem)]">
        {firstName}, добро пожаловать в личный кабинет врача
      </h1>

      {/* Статистика */}
      <div className="grid md:grid-cols-3 gap-[clamp(1rem,0.7692rem+1.0256vw,2rem)] mb-[clamp(2rem,1.5385rem+2.0513vw,4rem)]">
        <div className="bg-white rounded-[20px] p-[clamp(1.5rem,1.2692rem+1.0256vw,2.5rem)] border border-[#E8E2D5]">
          <h3 className="text-[clamp(0.875rem,0.8077rem+0.2885vw,1.125rem)] font-ManropeRegular text-[#636846] mb-2">
            Записей сегодня
          </h3>
          <p className="text-[clamp(2rem,1.5385rem+2.0513vw,4rem)] font-ManropeBold text-[#5C6744]">
            {loading ? "..." : stats.todayCount}
          </p>
        </div>

        <div className="bg-white rounded-[20px] p-[clamp(1.5rem,1.2692rem+1.0256vw,2.5rem)] border border-[#E8E2D5]">
          <h3 className="text-[clamp(0.875rem,0.8077rem+0.2885vw,1.125rem)] font-ManropeRegular text-[#636846] mb-2">
            Предстоящих записей
          </h3>
          <p className="text-[clamp(2rem,1.5385rem+2.0513vw,4rem)] font-ManropeBold text-[#967450]">
            {loading ? "..." : stats.upcomingCount}
          </p>
        </div>

        <div className="bg-white rounded-[20px] p-[clamp(1.5rem,1.2692rem+1.0256vw,2.5rem)] border border-[#E8E2D5]">
          <h3 className="text-[clamp(0.875rem,0.8077rem+0.2885vw,1.125rem)] font-ManropeRegular text-[#636846] mb-2">
            Всего записей
          </h3>
          <p className="text-[clamp(2rem,1.5385rem+2.0513vw,4rem)] font-ManropeBold text-[#4F5338]">
            {loading ? "..." : stats.totalBookings}
          </p>
        </div>
      </div>

      {/* Быстрые действия */}
      <div className="bg-white rounded-[20px] p-[clamp(1.5rem,1.2692rem+1.0256vw,2.5rem)] border border-[#E8E2D5] mb-[clamp(2rem,1.5385rem+2.0513vw,4rem)]">
        <h2 className="text-[clamp(1.25rem,1.1346rem+0.5128vw,1.75rem)] font-Manrope-SemiBold text-[#4F5338] mb-[clamp(1.5rem,1.2692rem+1.0256vw,2.5rem)]">
          Быстрые действия
        </h2>

        <div className="grid md:grid-cols-2 gap-[clamp(1rem,0.8846rem+0.5128vw,1.5rem)]">
          {quickActions.map((action) => (
            <button
              key={action.view}
              onClick={() => router.replace(`/doctor?view=${action.view}`, { scroll: false })}
              className="flex items-start gap-4 p-[clamp(1rem,0.8846rem+0.5128vw,1.5rem)] border border-[#E8E2D5] rounded-[16px] hover:bg-[#F5F0E4] hover:border-[#967450] transition-all duration-200 text-left"
            >
              <span className="text-[clamp(1.5rem,1.3846rem+0.5128vw,2rem)] flex-shrink-0">{action.icon}</span>
              <div>
                <h3 className="text-[clamp(1rem,0.9423rem+0.2564vw,1.25rem)] font-Manrope-SemiBold text-[#4F5338] mb-1">
                  {action.title}
                </h3>
                <p className="text-[clamp(0.875rem,0.8077rem+0.2885vw,1.125rem)] font-ManropeRegular text-[#636846]">
                  {action.description}
                </p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Отступ снизу */}
      <div className="h-[clamp(2rem,1.5385rem+2.0513vw,4rem)]" />
    </div>
  );
}
