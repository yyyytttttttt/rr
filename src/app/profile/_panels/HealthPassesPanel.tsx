"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

type Props = { userId: string; tzid: string };

type ActiveSummary = {
  slug: string;
  title: string;
  progressPercent: number;
  completedDaysCount: number;
  totalDays: number;
  daysLeft: number;
  currentDayNumber: number;
  isFinished: boolean;
} | null;

function getDaysWord(n: number): string {
  const abs = Math.abs(n) % 100;
  const d = abs % 10;
  if (abs >= 11 && abs <= 19) return "дней";
  if (d === 1) return "день";
  if (d >= 2 && d <= 4) return "дня";
  return "дней";
}

export default function HealthPassesPanel({}: Props) {
  const router = useRouter();
  const [active, setActive] = useState<ActiveSummary | undefined>(undefined); // undefined = loading
  const [error, setError] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/passes/active");
        if (res.ok) {
          const data = await res.json();
          setActive(data.active ?? null);
        } else {
          setError(true);
        }
      } catch {
        setError(true);
      }
    })();
  }, []);

  // Loading
  if (active === undefined && !error) {
    return (
      <div className="min-h-[40vh] bg-[#FFFCF3] px-3 sm:px-6 lg:px-10 py-6 sm:py-8">
        <div className="h-8 w-52 bg-[#EEE7DC] rounded mb-6 animate-pulse" />
        <div className="h-32 bg-[#F6F2EA] rounded-[20px] animate-pulse" />
      </div>
    );
  }

  // No active pass
  if (active === null || error) {
    return (
      <div className="min-h-[40vh] bg-[#FFFCF3] px-3 sm:px-6 lg:px-10 py-6 sm:py-8">
        <h1 className="text-[clamp(1.125rem,0.8269rem+1.3248vw,2rem)] font-ManropeBold text-[#4F5338] mb-4 sm:mb-6">
          Мои программы
        </h1>

        <div className="bg-white rounded-[12px] sm:rounded-[16px] lg:rounded-[20px] border border-[#E8E2D5] p-5 sm:p-6 lg:p-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-[10px] bg-[#F5F0E4] flex items-center justify-center shrink-0">
              <span className="text-xl">🎯</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm sm:text-base font-ManropeMedium text-[#4F5338]">
                Программы здоровья
              </p>
              <p className="text-xs sm:text-sm font-ManropeRegular text-[#7A7A5A] mt-0.5">
                Выберите программу ежедневных заданий и получите скидку
              </p>
            </div>
            <button
              type="button"
              onClick={() => router.push("/passes/")}
              className="px-5 sm:px-6 py-2.5 rounded-[8px] bg-[#5C6744] text-white text-sm font-ManropeMedium hover:bg-[#4F5938] transition-colors shrink-0"
            >
              Выбрать
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Active pass widget — TS narrowing: active is guaranteed non-null here
  const pass = active!;
  return (
    <div className="min-h-[40vh] bg-[#FFFCF3] px-3 sm:px-6 lg:px-10 py-6 sm:py-8">
      <h1 className="text-[clamp(1.125rem,0.8269rem+1.3248vw,2rem)] font-ManropeBold text-[#4F5338] mb-4 sm:mb-6">
        Мои программы
      </h1>

      <div className="bg-white rounded-[12px] sm:rounded-[16px] lg:rounded-[20px] border border-[#E8E2D5] p-4 sm:p-6 lg:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
          {/* Left: icon + info */}
          <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-[10px] sm:rounded-[12px] bg-gradient-to-br from-[#D5D96B] to-[#A8AD3F] shrink-0 flex items-center justify-center">
              <span className="text-xl sm:text-2xl leading-none">
                {pass.slug === "siyanie-iznutri" ? "✨" : "🧖‍♀️"}
              </span>
            </div>
            <div className="min-w-0">
              <p className="text-sm sm:text-base font-ManropeBold text-[#4F5338] truncate">
                {pass.title}
              </p>
              <p className="text-xs sm:text-sm font-ManropeRegular text-[#7A7A5A] mt-0.5">
                День {pass.currentDayNumber} из {pass.totalDays}
              </p>
            </div>
          </div>

          {/* Center: progress */}
          <div className="sm:w-[180px] lg:w-[220px] shrink-0">
            <div className="h-[5px] bg-[#F0EBE1] rounded-full overflow-hidden mb-1.5">
              <div
                className="h-full bg-[#5C6744] rounded-full transition-all duration-700"
                style={{ width: `${pass.progressPercent}%` }}
              />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-ManropeRegular text-[#636846]">
                {pass.completedDaysCount}/{pass.totalDays}
              </span>
              <span className="text-xs font-ManropeBold text-[#5C6744]">
                {pass.progressPercent}%
              </span>
            </div>
          </div>

          {/* Right: button */}
          <button
            type="button"
            onClick={() => router.push("/passes/active/")}
            className="px-5 sm:px-6 py-2.5 rounded-[8px] bg-[#5C6744] text-white text-sm font-ManropeMedium hover:bg-[#4F5938] transition-colors shrink-0"
          >
            Открыть
          </button>
        </div>

        {/* Bottom line */}
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-[#F0EBE1]">
          <span className="text-xs font-ManropeRegular text-[#7A7A5A]">
            Осталось {pass.daysLeft} {getDaysWord(pass.daysLeft)}
          </span>
          <span className="text-sm">🎁</span>
        </div>
      </div>
    </div>
  );
}
