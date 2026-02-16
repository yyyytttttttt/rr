"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

type CatalogState = "ACTIVE" | "AVAILABLE_TO_START" | "LOCKED" | "COMPLETED";

type CatalogItem = {
  slug: string;
  title: string;
  description: string | null;
  totalDays: number;
  rewardText: string | null;
  state: CatalogState;
  canStart: boolean;
  progressPercent?: number;
  completedDaysCount?: number;
  daysLeft?: number;
};

const EMOJIS: Record<string, string> = {
  "zhivoy-balans": "🧖‍♀️",
  "siyanie-iznutri": "✨",
};

function getDaysWord(n: number): string {
  const abs = Math.abs(n) % 100;
  const d = abs % 10;
  if (abs >= 11 && abs <= 19) return "дней";
  if (d === 1) return "день";
  if (d >= 2 && d <= 4) return "дня";
  return "дней";
}

export default function PassesCatalogClient() {
  const router = useRouter();
  const [passes, setPasses] = useState<CatalogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState<string | null>(null);
  const [confirmSlug, setConfirmSlug] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/passes/catalog");
        if (res.ok) {
          const data = await res.json();
          setPasses(data.passes || []);
        }
      } catch {
        toast.error("Не удалось загрузить программы");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleStart = useCallback(async (slug: string) => {
    setConfirmSlug(null);
    setStarting(slug);
    try {
      const res = await fetch("/api/passes/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug }),
      });
      if (res.ok) {
        toast.success("Программа запущена!");
        router.push("/passes/active/");
      } else {
        const err = await res.json().catch(() => null);
        if (err?.error === "PASS_ALREADY_ACTIVE") {
          toast.error("У вас уже есть активная программа");
        } else if (err?.error === "PASS_ALREADY_COMPLETED") {
          toast.error("Вы уже прошли эту программу");
        } else {
          toast.error(err?.message || "Не удалось начать программу");
        }
      }
    } catch {
      toast.error("Ошибка соединения");
    } finally {
      setStarting(null);
    }
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FFFCF3] px-4 sm:px-6 lg:px-10 py-6 sm:py-10">
        <div className="max-w-4xl mx-auto animate-pulse">
          <div className="h-8 w-64 bg-[#EEE7DC] rounded mb-8" />
          <div className="grid sm:grid-cols-2 gap-5">
            <div className="h-72 bg-[#F6F2EA] rounded-[20px]" />
            <div className="h-72 bg-[#F6F2EA] rounded-[20px]" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FFFCF3] px-4 sm:px-6 lg:px-10 py-6 sm:py-10">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-[clamp(1.25rem,1rem+1vw,2rem)] font-ManropeBold text-[#4F5338] mb-2">
          Программы здоровья
        </h1>
        <p className="text-sm sm:text-base font-ManropeRegular text-[#636846] mb-6 sm:mb-8">
          Выберите программу ежедневных заданий и получите скидку по завершении
        </p>

        <div className="grid sm:grid-cols-2 gap-4 sm:gap-5 lg:gap-6">
          {passes.map((p) => (
            <div
              key={p.slug}
              className={`bg-white rounded-[16px] sm:rounded-[20px] border overflow-hidden transition-shadow ${
                p.state === "ACTIVE"
                  ? "border-[#5C6744] shadow-[0_0_0_1px_#5C6744]"
                  : "border-[#E8E2D5] hover:shadow-md"
              }`}
            >
              {/* Header gradient */}
              <div className={`px-5 sm:px-6 py-5 sm:py-6 ${
                p.state === "COMPLETED"
                  ? "bg-gradient-to-br from-[#E8E2D5] to-[#F5F0E4]"
                  : p.slug === "siyanie-iznutri"
                  ? "bg-gradient-to-br from-[#F0E6D4] to-[#FCF5EB]"
                  : "bg-gradient-to-br from-[#E5E8C8] to-[#F4F6E8]"
              }`}>
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-2xl sm:text-3xl">
                      {EMOJIS[p.slug] || "🎯"}
                    </span>
                    <h2 className="text-lg sm:text-xl font-ManropeBold text-[#4F5338] mt-2">
                      {p.title}
                    </h2>
                  </div>
                  <span className="text-xs sm:text-sm font-ManropeMedium text-[#636846] bg-white/60 px-2.5 py-1 rounded-full">
                    {p.totalDays} {getDaysWord(p.totalDays)}
                  </span>
                </div>
              </div>

              {/* Body */}
              <div className="px-5 sm:px-6 py-4 sm:py-5">
                {p.description && (
                  <p className="text-sm font-ManropeRegular text-[#636846] leading-relaxed mb-4">
                    {p.description}
                  </p>
                )}

                {/* Reward info */}
                {p.rewardText && (
                  <div className="flex items-center gap-2 mb-4 text-xs sm:text-sm font-ManropeMedium text-[#967450]">
                    <span>🎁</span>
                    <span>{p.rewardText}</span>
                  </div>
                )}

                {/* Progress (for active/completed) */}
                {p.progressPercent !== undefined && p.completedDaysCount !== undefined && (
                  <div className="mb-4">
                    <div className="h-1.5 bg-[#F0EBE1] rounded-full overflow-hidden mb-1.5">
                      <div
                        className={`h-full rounded-full transition-all duration-700 ${
                          p.state === "COMPLETED" ? "bg-[#1F8B4D]" : "bg-[#5C6744]"
                        }`}
                        style={{ width: `${p.progressPercent}%` }}
                      />
                    </div>
                    <span className="text-xs font-ManropeRegular text-[#7A7A5A]">
                      {p.completedDaysCount} из {p.totalDays} ({p.progressPercent}%)
                    </span>
                  </div>
                )}

                {/* Action */}
                {p.state === "AVAILABLE_TO_START" && (
                  <button
                    type="button"
                    onClick={() => setConfirmSlug(p.slug)}
                    disabled={!!starting}
                    className="w-full py-3 rounded-[8px] bg-[#5C6744] text-white text-sm sm:text-base font-ManropeMedium hover:bg-[#4F5938] active:scale-[0.98] transition-all disabled:opacity-60"
                  >
                    {starting === p.slug ? "Запускаем..." : "Начать программу"}
                  </button>
                )}

                {p.state === "ACTIVE" && (
                  <button
                    type="button"
                    onClick={() => router.push("/passes/active/")}
                    className="w-full py-3 rounded-[8px] bg-[#5C6744] text-white text-sm sm:text-base font-ManropeMedium hover:bg-[#4F5938] active:scale-[0.98] transition-all"
                  >
                    Открыть
                  </button>
                )}

                {p.state === "LOCKED" && (
                  <div className="w-full py-3 rounded-[8px] bg-[#F5F0E4] text-center">
                    <span className="text-sm font-ManropeMedium text-[#967450]">
                      Доступно после завершения текущей программы
                    </span>
                  </div>
                )}

                {p.state === "COMPLETED" && (
                  <div className="w-full py-3 rounded-[8px] bg-[#EAF9EF] text-center">
                    <span className="text-sm font-ManropeMedium text-[#1F8B4D]">
                      Завершено
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Back link */}
        <div className="mt-6 text-center">
          <button
            type="button"
            onClick={() => router.push("/profile/?view=healthpasses")}
            className="min-h-11 sm:min-h-0 inline-flex items-center gap-1.5 text-base sm:text-lg font-ManropeMedium text-[#967450] hover:text-[#4F5338] transition-colors"
          >
            <svg className="w-5 h-5 sm:w-4 sm:h-4" viewBox="0 0 20 20" fill="none"><path d="M12.5 15L7.5 10L12.5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            Вернуться в личный кабинет
          </button>
        </div>
      </div>

      {/* ── Confirm modal ── */}
      {confirmSlug && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white rounded-[16px] sm:rounded-[20px] p-6 sm:p-8 max-w-md w-full shadow-2xl">
            <h3 className="text-lg sm:text-xl font-ManropeBold text-[#4F5338] mb-3">
              Начать программу?
            </h3>
            <p className="text-sm sm:text-base font-ManropeRegular text-[#636846] mb-6 leading-relaxed">
              После старта переключиться на другую программу нельзя, пока не завершите текущую. Каждый день открывается через 24 часа.
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setConfirmSlug(null)}
                className="flex-1 py-2.5 rounded-[8px] bg-[#F5F0E4] text-sm font-ManropeMedium text-[#967450] hover:bg-[#E8E2D5] transition-colors"
              >
                Отмена
              </button>
              <button
                type="button"
                onClick={() => handleStart(confirmSlug)}
                disabled={!!starting}
                className="flex-1 py-2.5 rounded-[8px] bg-[#5C6744] text-white text-sm font-ManropeMedium hover:bg-[#4F5938] transition-colors disabled:opacity-60"
              >
                {starting ? "Запускаем..." : "Начать"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
