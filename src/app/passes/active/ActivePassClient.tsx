"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

type DayStatus = "DONE" | "AVAILABLE" | "LOCKED";
type DayInfo = { dayNumber: number; title: string; status: DayStatus; content: string | null };

type ActivePass = {
  slug: string;
  title: string;
  description: string | null;
  totalDays: number;
  progressPercent: number;
  currentDayNumber: number;
  currentDayTitle: string | null;
  currentDayText: string | null;
  isDayCompleted: boolean;
  nextAvailableInSec: number | null;
  locked: boolean;
  completedDaysCount: number;
  daysLeft: number;
  isFinished: boolean;
  rewardPromoCode: string | null;
  days: DayInfo[];
};

function getDaysWord(n: number): string {
  const abs = Math.abs(n) % 100;
  const d = abs % 10;
  if (abs >= 11 && abs <= 19) return "дней";
  if (d === 1) return "день";
  if (d >= 2 && d <= 4) return "дня";
  return "дней";
}

export default function ActivePassClient() {
  const router = useRouter();
  const [active, setActive] = useState<ActivePass | null | undefined>(undefined); // undefined = loading
  const [completing, setCompleting] = useState(false);
  const [countdown, setCountdown] = useState("");
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [viewedDay, setViewedDay] = useState<number | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/passes/active");
      if (res.ok) {
        const data = await res.json();
        setActive(data.active ?? null);
      }
    } catch {
      toast.error("Не удалось загрузить данные");
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // Countdown timer
  useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (!active?.nextAvailableInSec || active.nextAvailableInSec <= 0) {
      setCountdown("");
      return;
    }

    const target = Date.now() + active.nextAvailableInSec * 1000;

    const update = () => {
      const diff = target - Date.now();
      if (diff <= 0) {
        setCountdown("");
        if (timerRef.current) clearInterval(timerRef.current);
        load(); // Reload when timer expires
        return;
      }
      const h = Math.floor(diff / 3_600_000);
      const m = Math.floor((diff % 3_600_000) / 60_000);
      const s = Math.floor((diff % 60_000) / 1000);
      setCountdown(
        `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
      );
    };

    update();
    timerRef.current = setInterval(update, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [active?.nextAvailableInSec, load]);

  const handleComplete = useCallback(async () => {
    if (completing || !active) return;
    setCompleting(true);
    try {
      const res = await fetch("/api/passes/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dayNumber: active.currentDayNumber }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.rewardPromoCode) {
          toast.success(`День выполнен! Промокод: ${data.rewardPromoCode}`);
        } else {
          toast.success("День выполнен!");
        }
        setActive(data.active ?? null);
        setViewedDay(null);
      } else {
        const err = await res.json().catch(() => null);
        toast.error(err?.message || "Не удалось выполнить день");
      }
    } catch {
      toast.error("Ошибка соединения");
    } finally {
      setCompleting(false);
    }
  }, [active, completing]);

  // Viewed past day data
  const viewedDayData = viewedDay !== null
    ? active?.days.find(d => d.dayNumber === viewedDay) ?? null
    : null;
  const showingPastDay = viewedDayData?.status === "DONE";

  const displayDay = showingPastDay
    ? { dayNumber: viewedDayData!.dayNumber, title: viewedDayData!.title, content: viewedDayData!.content ?? "" }
    : active?.currentDayTitle
    ? { dayNumber: active.currentDayNumber, title: active.currentDayTitle, content: active.currentDayText ?? "" }
    : null;

  const isAvailable = !active?.locked && !active?.isDayCompleted && !active?.isFinished && displayDay && !showingPastDay;

  // Loading
  if (active === undefined) {
    return (
      <div className="min-h-screen bg-[#FFFCF3] px-4 sm:px-6 lg:px-10 py-6 sm:py-10">
        <div className="max-w-5xl mx-auto animate-pulse">
          <div className="h-8 w-52 bg-[#EEE7DC] rounded mb-8" />
          <div className="grid lg:grid-cols-[1fr_1.4fr] gap-5">
            <div className="h-96 bg-[#F6F2EA] rounded-[20px]" />
            <div className="h-96 bg-[#F6F2EA] rounded-[20px]" />
          </div>
        </div>
      </div>
    );
  }

  // No active pass
  if (active === null) {
    return (
      <div className="min-h-screen bg-[#FFFCF3] flex items-center justify-center px-4">
        <div className="text-center bg-white rounded-[20px] px-8 sm:px-12 py-10 border border-[#E8E2D5] max-w-md">
          <div className="w-16 h-16 mx-auto rounded-full bg-[#F5F0E4] flex items-center justify-center mb-4">
            <span className="text-2xl">🎯</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-ManropeBold text-[#4F5338] mb-2">
            Нет активной программы
          </h2>
          <p className="text-sm sm:text-base font-ManropeRegular text-[#636846] mb-6">
            Выберите программу из каталога, чтобы начать
          </p>
          <button
            type="button"
            onClick={() => router.push("/passes/")}
            className="px-8 py-3 rounded-[8px] bg-[#5C6744] text-white text-sm sm:text-base font-ManropeMedium hover:bg-[#4F5938] active:scale-[0.98] transition-all"
          >
            Выбрать программу
          </button>
        </div>
      </div>
    );
  }

  // Finished state
  if (active.isFinished && !showingPastDay) {
    return (
      <div className="min-h-screen bg-[#FFFCF3] flex items-center justify-center px-4">
        <div className="text-center bg-white rounded-[20px] px-8 sm:px-12 py-10 border border-[#E8E2D5] max-w-md">
          <div className="w-16 h-16 mx-auto rounded-full bg-[#EAF9EF] flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-[#1F8B4D]" viewBox="0 0 24 24" fill="none">
              <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" fill="currentColor"/>
            </svg>
          </div>
          <h2 className="text-xl sm:text-2xl font-ManropeBold text-[#4F5338] mb-2">
            Поздравляем!
          </h2>
          <p className="text-sm sm:text-base font-ManropeRegular text-[#636846] mb-4">
            Вы прошли все {active.totalDays} {getDaysWord(active.totalDays)} программы &laquo;{active.title}&raquo;
          </p>
          {active.rewardPromoCode && (
            <div className="inline-block rounded-[10px] bg-[#EAF9EF] border border-[#B8E6C8] px-6 py-3 mb-6">
              <p className="text-xs font-ManropeMedium text-[#1F8B4D] mb-0.5">Ваш промокод:</p>
              <p className="text-lg font-ManropeBold text-[#1F8B4D] tracking-wider">{active.rewardPromoCode}</p>
            </div>
          )}
          <div>
            <button
              type="button"
              onClick={() => router.push("/passes/")}
              className="px-8 py-3 rounded-[8px] bg-[#5C6744] text-white text-sm sm:text-base font-ManropeMedium hover:bg-[#4F5938] active:scale-[0.98] transition-all"
            >
              Выбрать следующую программу
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FFFCF3] px-3 sm:px-6 lg:px-10 py-4 sm:py-6 lg:py-8">
      <div className="max-w-5xl mx-auto">
        {/* Back + Title */}
        <div className="flex items-center gap-3 mb-4 sm:mb-6">
          <button
            type="button"
            onClick={() => router.push("/passes/")}
            className="min-h-11 sm:min-h-0 inline-flex items-center gap-1.5 text-base sm:text-lg font-ManropeMedium text-[#967450] hover:text-[#4F5338] transition-colors shrink-0"
          >
            <svg className="w-5 h-5 sm:w-4 sm:h-4" viewBox="0 0 20 20" fill="none"><path d="M12.5 15L7.5 10L12.5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            Программы
          </button>
        </div>

        {/* Pass card */}
        <div className="bg-white rounded-[12px] sm:rounded-[16px] lg:rounded-[20px] border border-[#E8E2D5] p-4 sm:p-6 lg:p-8 mb-5 sm:mb-7">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6 lg:gap-8">
            <div className="flex items-center gap-3 sm:gap-4 sm:flex-1 min-w-0">
              <div className="w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 rounded-[10px] sm:rounded-[12px] bg-gradient-to-br from-[#D5D96B] to-[#A8AD3F] shrink-0 flex items-center justify-center">
                <span className="text-xl sm:text-2xl lg:text-3xl leading-none">
                  {active.slug === "siyanie-iznutri" ? "✨" : "🧖‍♀️"}
                </span>
              </div>
              <div className="min-w-0">
                <h1 className="text-[clamp(1rem,0.9rem+0.4vw,1.375rem)] font-ManropeBold text-[#4F5338] leading-snug truncate">
                  {active.title}
                </h1>
                {active.description && (
                  <p className="text-xs sm:text-sm font-ManropeRegular text-[#7A7A5A] mt-0.5 truncate">{active.description}</p>
                )}
              </div>
            </div>
            <div className="sm:w-[240px] lg:w-[280px] shrink-0">
              <div className="h-[5px] sm:h-1.5 bg-[#F0EBE1] rounded-full overflow-hidden mb-2">
                <div className="h-full bg-[#5C6744] rounded-full transition-all duration-700" style={{ width: `${active.progressPercent}%` }} />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs sm:text-sm font-ManropeRegular text-[#636846]">
                  {active.completedDaysCount} из {active.totalDays}
                </span>
                <span className="text-xs sm:text-sm font-ManropeBold text-[#5C6744]">{active.progressPercent}%</span>
              </div>
            </div>
          </div>
          <div className="flex items-center justify-between mt-4 pt-3 sm:pt-4 border-t border-[#F0EBE1]">
            <span className="text-xs sm:text-sm font-ManropeRegular text-[#7A7A5A]">
              Осталось {active.daysLeft} {getDaysWord(active.daysLeft)} до получения подарка
            </span>
            <span className="text-lg sm:text-xl">🎁</span>
          </div>
        </div>

        {/* Two columns */}
        <div className="lg:grid lg:gap-6 lg:grid-cols-[1fr_1.4fr] lg:items-start">
          {/* LEFT: day list */}
          <div className="bg-white rounded-[12px] sm:rounded-[16px] lg:rounded-[20px] border border-[#E8E2D5] overflow-hidden">
            <div className="max-h-[60vh] lg:max-h-[70vh] overflow-y-auto">
              {active.days.map((d) => {
                const isActive =
                  (viewedDay === d.dayNumber) ||
                  (viewedDay === null && d.status === "AVAILABLE" && !active.isFinished);

                return (
                  <button
                    key={d.dayNumber}
                    type="button"
                    disabled={d.status === "LOCKED"}
                    onClick={() => {
                      if (d.status === "AVAILABLE") { setViewedDay(null); return; }
                      if (d.status === "DONE") setViewedDay(prev => prev === d.dayNumber ? null : d.dayNumber);
                    }}
                    className={`w-full flex items-center gap-3 px-4 sm:px-5 py-3.5 sm:py-3.5 min-h-12 sm:min-h-0 text-left border-b border-[#F0EBE1] last:border-b-0 transition-colors ${
                      d.status === "LOCKED"
                        ? "text-[#C4BDB0] cursor-default"
                        : isActive
                        ? "bg-[#5C6744]/[0.06]"
                        : "hover:bg-[#FAFAF5] cursor-pointer"
                    }`}
                  >
                    <span className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center shrink-0 text-[11px] sm:text-xs font-ManropeBold ${
                      d.status === "DONE"
                        ? "bg-[#5C6744] text-white"
                        : d.status === "AVAILABLE"
                        ? "bg-[#5C6744]/15 text-[#5C6744] ring-2 ring-[#5C6744]/30"
                        : "bg-[#F0EBE1] text-[#B0AA9D]"
                    }`}>
                      {d.status === "DONE" ? (
                        <svg className="w-3 h-3 sm:w-3.5 sm:h-3.5" viewBox="0 0 16 16" fill="none"><path d="M4 8.5L7 11.5L12 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                      ) : d.dayNumber}
                    </span>
                    <div className="min-w-0 flex-1">
                      <span className={`block text-sm sm:text-[15px] font-ManropeMedium truncate ${
                        d.status === "LOCKED" ? "text-[#C4BDB0]" : isActive ? "text-[#4F5338]" : "text-[#636846]"
                      }`}>
                        День {d.dayNumber}. {d.title}
                      </span>
                    </div>
                    {d.status !== "LOCKED" && (
                      <svg className={`w-5 h-5 sm:w-4 sm:h-4 shrink-0 transition-transform ${isActive ? "text-[#5C6744] rotate-90" : "text-[#C4BDB0]"}`} viewBox="0 0 16 16" fill="none">
                        <path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* RIGHT: day content (fixed on mobile, sticky on desktop) */}
          <div className="
            fixed inset-x-0 bottom-0 z-30
            max-h-[45vh] overflow-y-auto
            bg-white rounded-t-[16px] border-t border-x border-[#E8E2D5]
            shadow-[0_-4px_24px_rgba(0,0,0,0.1)]
            lg:sticky lg:inset-auto lg:top-6 lg:z-auto
            lg:max-h-none lg:overflow-y-visible
            lg:rounded-[20px] lg:border lg:shadow-none
            lg:self-start
          ">
            {displayDay ? (
              <div>
                <div className="px-5 sm:px-6 lg:px-8 py-4 sm:py-5 border-b border-[#F0EBE1]">
                  <h3 className="text-[clamp(1rem,0.9rem+0.4vw,1.25rem)] font-ManropeBold text-[#4F5338]">
                    День {displayDay.dayNumber}. {displayDay.title}
                  </h3>
                  {showingPastDay && (
                    <button
                      type="button"
                      onClick={() => setViewedDay(null)}
                      className="mt-1.5 text-xs sm:text-sm font-ManropeRegular text-[#967450] hover:text-[#4F5338] transition-colors"
                    >
                      ← К текущему дню
                    </button>
                  )}
                </div>

                <div className="px-5 sm:px-6 lg:px-8 py-5 sm:py-6">
                  <p className="text-sm sm:text-base font-ManropeRegular text-[#4F5338] leading-[1.75] whitespace-pre-line">
                    {displayDay.content}
                  </p>
                </div>

                {!showingPastDay && (
                  <div className="px-5 sm:px-6 lg:px-8 py-4 sm:py-5 border-t border-[#F0EBE1]">
                    {countdown ? (
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs sm:text-sm font-ManropeRegular text-[#7A7A5A] mb-1">Следующий день через</p>
                          <p className="text-xl sm:text-2xl font-ManropeBold text-[#5C6744] tabular-nums">{countdown}</p>
                        </div>
                        <span className="px-5 py-2.5 rounded-[8px] bg-[#F5F0E4] text-sm font-ManropeMedium text-[#967450]">Выполнено</span>
                      </div>
                    ) : isAvailable ? (
                      <button
                        type="button"
                        onClick={handleComplete}
                        disabled={completing}
                        className="w-full py-3 sm:py-3.5 rounded-[8px] bg-[#5C6744] text-white text-sm sm:text-base font-ManropeMedium hover:bg-[#4F5938] active:scale-[0.98] transition-all disabled:opacity-60"
                      >
                        {completing ? "Отмечаем..." : "Выполнено"}
                      </button>
                    ) : active.isDayCompleted ? (
                      <div className="flex items-center justify-center gap-2 py-2">
                        <svg className="w-4 h-4 text-[#5C6744]" viewBox="0 0 16 16" fill="none"><path d="M4 8.5L7 11.5L12 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                        <span className="text-sm font-ManropeMedium text-[#5C6744]">День выполнен</span>
                      </div>
                    ) : null}
                  </div>
                )}
              </div>
            ) : (
              <div className="p-6 sm:p-8 lg:p-10 text-center">
                <p className="text-sm sm:text-base font-ManropeRegular text-[#7A7A5A]">
                  Выберите день слева
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Spacer for fixed bottom panel on mobile */}
        <div className="h-[48vh] lg:h-52" />
      </div>
    </div>
  );
}
