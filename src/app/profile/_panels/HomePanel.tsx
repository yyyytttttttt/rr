"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect, useCallback } from "react";
import toast from "react-hot-toast";

type Props = {
  userId: string;
  tzid: string;
  userName: string;
  userEmail: string;
  userImage: string | null;
  userPhone?: string | null;
  userBirthDate?: string | null;
};

type BirthdayStatus = {
  hasBirthDate: boolean;
  daysUntil: number | null;
  isBirthday: boolean;
  claimed: boolean;
  promoCode: { code: string; validUntil: string | null; discountPercent: number | null } | null;
};

export default function HomePanel({ userName, userEmail, userImage, userPhone }: Props) {
  const router = useRouter();
  const [bdayStatus, setBdayStatus] = useState<BirthdayStatus | null>(null);
  const [bdayLoading, setBdayLoading] = useState(true);
  const [claiming, setClaiming] = useState(false);
  const [copied, setCopied] = useState(false);

  const firstName = userName?.split(' ')[0] || 'Гость';

  const goToBooking = () => {
    router.replace("/profile?view=booking", { scroll: false });
  };

  const goToSettings = () => {
    router.replace("/profile?view=settings", { scroll: false });
  };

  // Fetch birthday status
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/birthday-bonus/status');
        if (!res.ok) throw new Error();
        const data = await res.json();
        if (!cancelled) setBdayStatus(data);
      } catch {
        // Silently fail — card will show a fallback
      } finally {
        if (!cancelled) setBdayLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const handleClaim = useCallback(async () => {
    setClaiming(true);
    try {
      const res = await fetch('/api/birthday-bonus/claim', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || 'Не удалось получить бонус');
        return;
      }
      toast.success(data.message || 'Промокод активирован!');
      setBdayStatus((prev) =>
        prev
          ? {
              ...prev,
              claimed: true,
              promoCode: {
                code: data.promoCode,
                validUntil: data.validUntil,
                discountPercent: data.discountPercent,
              },
            }
          : prev,
      );
    } catch {
      toast.error('Ошибка сети');
    } finally {
      setClaiming(false);
    }
  }, []);

  const handleCopyPromo = useCallback(async (code: string) => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(code);
      } else {
        const ta = document.createElement('textarea');
        ta.value = code;
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.focus();
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
      }
      setCopied(true);
      toast.success('Промокод скопирован!');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Не удалось скопировать');
    }
  }, []);

  const handleShare = useCallback(async () => {
    const url = `${window.location.origin}/business-card`;
    if (navigator.share) {
      try {
        await navigator.share({ title: 'Электронная визитка', url });
      } catch {
        // User cancelled share — ignore
      }
    } else {
      try {
        await navigator.clipboard.writeText(url);
        toast.success('Ссылка скопирована');
      } catch {
        toast.error('Не удалось скопировать ссылку');
      }
    }
  }, []);

  // Birthday progress bar calculation
  const bdayProgress = bdayStatus?.hasBirthDate && bdayStatus.daysUntil != null
    ? ((365 - bdayStatus.daysUntil) / 365) * 100
    : 0;

  return (
    <div className="min-h-screen bg-[#FFFCF3] px-3 sm:px-4 md:px-6 lg:px-8 xl:px-[clamp(1rem,0.5385rem+2.0513vw,3rem)] py-4 sm:py-6 md:py-8 xl:py-[clamp(2rem,1.7692rem+1.0256vw,3rem)]">
      {/* Заголовок */}
      <h1 className="text-[clamp(1.25rem,1rem+1vw,2.5rem)] sm:text-[clamp(1.5rem,1.2692rem+1.0256vw,2.5rem)] font-ManropeBold text-[#4F5338] mb-6 sm:mb-8 xl:mb-[clamp(2rem,1.5385rem+2.0513vw,4rem)]">
        {firstName}, добро пожаловать в личный кабинет
      </h1>

      {/* Сетка карточек */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 xl:gap-[clamp(1.5rem,1.1538rem+1.5385vw,3rem)] mb-6 sm:mb-8 xl:mb-[clamp(2rem,1.5385rem+2.0513vw,4rem)]">

        {/* Карточка "Профиль" */}
        <div className="bg-white rounded-[16px] sm:rounded-[20px] p-4 sm:p-6 xl:p-[clamp(1.5rem,1.2692rem+1.0256vw,2.5rem)] border border-[#E8E2D5]">
          <h2 className="text-[clamp(1.125rem,1rem+0.5vw,1.75rem)] sm:text-[clamp(1.25rem,1.1346rem+0.5128vw,1.75rem)] font-Manrope-SemiBold text-[#4F5338] mb-4 sm:mb-6 xl:mb-[clamp(1.5rem,1.2692rem+1.0256vw,2.5rem)]">
            Профиль
          </h2>

          <div className="flex items-center gap-3 sm:gap-4 xl:gap-[clamp(1rem,0.8846rem+0.5128vw,1.5rem)] mb-4 sm:mb-6 xl:mb-[clamp(1.5rem,1.2692rem+1.0256vw,2.5rem)]">
            {/* Аватар */}
            <div className="relative flex-shrink-0">
              {userImage ? (
                <img
                  src={userImage}
                  alt={userName || 'User'}
                  className="w-14 h-14 sm:w-16 sm:h-16 xl:w-[clamp(3.5rem,3.1538rem+1.5385vw,5rem)] xl:h-[clamp(3.5rem,3.1538rem+1.5385vw,5rem)] rounded-full object-cover bg-[#F5F0E4]"
                />
              ) : (
                <div className="w-14 h-14 sm:w-16 sm:h-16 xl:w-[clamp(3.5rem,3.1538rem+1.5385vw,5rem)] xl:h-[clamp(3.5rem,3.1538rem+1.5385vw,5rem)] rounded-full bg-[#F5F0E4] flex items-center justify-center">
                  <svg className="w-6 h-6 sm:w-7 sm:h-7 xl:w-8 xl:h-8 text-[#967450]" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                  </svg>
                </div>
              )}
              <button className="absolute bottom-0 right-0 w-6 h-6 sm:w-7 sm:h-7 xl:w-8 xl:h-8 bg-[#5C6744] rounded-full flex items-center justify-center text-white text-lg sm:text-xl hover:bg-[#4F5938] transition-colors">
                +
              </button>
            </div>

            {/* Информация */}
            <div className="flex-1 min-w-0">
              <h3 className="text-base sm:text-lg xl:text-[clamp(1.125rem,1.0096rem+0.5128vw,1.625rem)] font-ManropeMedium text-[#4F5338] mb-0.5 sm:mb-1 truncate">
                {userName || 'Гость'}
              </h3>
              <p className="text-sm sm:text-base xl:text-[clamp(0.875rem,0.8077rem+0.2885vw,1.125rem)] font-ManropeRegular text-[#636846] truncate">
                {userPhone || userEmail}
              </p>
            </div>
          </div>

          <button
            onClick={goToSettings}
            className="text-sm sm:text-base xl:text-[clamp(0.875rem,0.8077rem+0.2885vw,1.125rem)] font-ManropeRegular text-[#967450] hover:text-[#7A5D3E] transition-colors"
          >
            Изменить профиль
          </button>
        </div>

        {/* Карточка "Записаться на приём" */}
        <div className="bg-white rounded-[16px] sm:rounded-[20px] p-4 sm:p-6 xl:p-[clamp(1.5rem,1.2692rem+1.0256vw,2.5rem)] border border-[#E8E2D5] relative overflow-hidden">
          <div className="relative z-10">
            <h2 className="text-[clamp(1.125rem,1rem+0.5vw,1.75rem)] sm:text-[clamp(1.25rem,1.1346rem+0.5128vw,1.75rem)] font-Manrope-SemiBold text-[#4F5338] mb-2 sm:mb-[clamp(0.5rem,0.3846rem+0.5128vw,1rem)]">
              Записаться на приём
            </h2>
            <p className="text-sm sm:text-base xl:text-[clamp(0.875rem,0.8077rem+0.2885vw,1.125rem)] font-ManropeRegular text-[#636846] mb-4 sm:mb-6 xl:mb-[clamp(1.5rem,1.2692rem+1.0256vw,2.5rem)] max-w-full sm:max-w-[20rem]">
              Быстрая запись на процедуры в удобный для вас слот
            </p>
            <button
              onClick={goToBooking}
              className="inline-flex cursor-pointer items-center justify-center rounded-[8px] sm:rounded-[clamp(0.5rem,0.4423rem+0.2564vw,0.75rem)] bg-[#5C6744] px-6 sm:px-8 xl:px-[clamp(2rem,1.6538rem+1.5385vw,3.5rem)] py-2.5 sm:py-3 xl:py-[clamp(0.75rem,0.6346rem+0.5128vw,1.25rem)] text-sm sm:text-base xl:text-[clamp(1rem,0.9423rem+0.2564vw,1.25rem)] font-ManropeRegular text-white hover:bg-[#4F5938] transition-colors duration-300"
            >
              Записаться
            </button>
          </div>
          {/* Декоративное изображение (заглушка) */}
          <div className="absolute right-0 bottom-0 w-1/3 sm:w-1/2 h-full opacity-20 pointer-events-none">
            <svg viewBox="0 0 200 200" className="w-full h-full">
              <circle cx="150" cy="100" r="80" fill="#5C6744" opacity="0.1"/>
            </svg>
          </div>
        </div>

        {/* Карточка "Бонус на день рождения" */}
        <div className="bg-white rounded-[16px] sm:rounded-[20px] p-4 sm:p-6 xl:p-[clamp(1.5rem,1.2692rem+1.0256vw,2.5rem)] border border-[#E8E2D5]">
          <h2 className="text-[clamp(1.125rem,1rem+0.5vw,1.75rem)] sm:text-[clamp(1.25rem,1.1346rem+0.5128vw,1.75rem)] font-Manrope-SemiBold text-[#4F5338] mb-4 sm:mb-6 xl:mb-[clamp(1.5rem,1.2692rem+1.0256vw,2.5rem)]">
            Бонус на день рождения
          </h2>

          {bdayLoading ? (
            <div className="animate-pulse space-y-3">
              <div className="h-2 bg-[#F5F0E4] rounded-full" />
              <div className="h-4 bg-[#F5F0E4] rounded w-2/3" />
              <div className="h-4 bg-[#F5F0E4] rounded w-1/2" />
            </div>
          ) : !bdayStatus?.hasBirthDate ? (
            /* No birth date set */
            <>
              <p className="text-sm sm:text-base xl:text-[clamp(1rem,0.9423rem+0.2564vw,1.25rem)] font-ManropeRegular text-[#4F5338] mb-3 sm:mb-4">
                Укажите дату рождения в настройках профиля, чтобы получить скидку 5% в ваш день рождения
              </p>
              <button
                onClick={goToSettings}
                className="rounded-[8px] sm:rounded-[clamp(0.5rem,0.4423rem+0.2564vw,0.75rem)] bg-[#5C6744] text-white text-xs sm:text-sm xl:text-[clamp(0.875rem,0.7885rem+0.3846vw,1.125rem)] py-2 sm:py-2.5 xl:py-[clamp(0.625rem,0.5096rem+0.5128vw,1.125rem)] px-3 sm:px-4 xl:px-[clamp(1rem,0.7692rem+1.0256vw,2rem)] font-ManropeRegular hover:bg-[#4F5938] transition-colors"
              >
                Настройки профиля
              </button>
            </>
          ) : bdayStatus.claimed && bdayStatus.promoCode ? (
            /* Already claimed — show promo code with copy button */
            <>
              <div className="bg-[#F5F0E4] rounded-[10px] sm:rounded-[12px] p-3 sm:p-4 mb-3 sm:mb-4">
                <p className="text-xs sm:text-sm font-ManropeRegular text-[#636846] mb-1.5">Ваш промокод:</p>
                <p className="text-lg sm:text-xl font-ManropeBold text-[#4F5338] tracking-wide mb-2">
                  {bdayStatus.promoCode.code}
                </p>
                <p className="text-xs sm:text-sm font-ManropeRegular text-[#636846] mb-3">
                  Скидка {bdayStatus.promoCode.discountPercent}%
                  {bdayStatus.promoCode.validUntil && (
                    <> &middot; до {new Date(bdayStatus.promoCode.validUntil).toLocaleDateString('ru-RU')}</>
                  )}
                </p>
                <button
                  type="button"
                  onClick={() => handleCopyPromo(bdayStatus.promoCode!.code)}
                  className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-[8px] text-sm font-ManropeMedium transition-all duration-200 active:scale-[0.97] ${
                    copied
                      ? 'bg-[#1F8B4D] text-white'
                      : 'bg-[#5C6744] text-white hover:bg-[#4F5938]'
                  }`}
                >
                  {copied ? (
                    <>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                      </svg>
                      Скопировано!
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                      </svg>
                      Скопировать промокод
                    </>
                  )}
                </button>
              </div>
              <p className="text-xs sm:text-sm font-ManropeRegular text-[#636846]">
                Используйте промокод при записи на приём
              </p>
            </>
          ) : (
            /* Normal state — show countdown */
            <>
              {/* Прогресс бар */}
              <div className="relative w-full h-1.5 sm:h-2 bg-[#F5F0E4] rounded-full mb-3 sm:mb-4 xl:mb-[clamp(1rem,0.8846rem+0.5128vw,1.5rem)] overflow-hidden">
                <div
                  className="absolute left-0 top-0 h-full bg-[#967450] rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, Math.max(0, bdayProgress))}%` }}
                />
              </div>

              <div className="flex items-start justify-between mb-3 sm:mb-4 xl:mb-[clamp(1rem,0.8846rem+0.5128vw,1.5rem)]">
                <p className="text-sm sm:text-base xl:text-[clamp(1rem,0.9423rem+0.2564vw,1.25rem)] font-ManropeRegular text-[#4F5338]">
                  {bdayStatus.isBirthday
                    ? 'С днём рождения! Получите скидку 5%'
                    : (
                      <>
                        Осталось {bdayStatus.daysUntil} {getDaysWord(bdayStatus.daysUntil ?? 0)}<br />
                        до получения подарка
                      </>
                    )}
                </p>
                <span className="text-2xl sm:text-3xl xl:text-4xl">{bdayStatus.isBirthday ? '🎉' : '🎁'}</span>
              </div>

              <p className="text-xs sm:text-sm xl:text-[clamp(0.75rem,0.6923rem+0.2564vw,1rem)] font-ManropeRegular text-[#636846] mb-3 sm:mb-4 xl:mb-[clamp(1rem,0.8846rem+0.5128vw,1.5rem)]">
                {bdayStatus.isBirthday
                  ? 'Нажмите «Получить», чтобы активировать промокод на скидку 5%'
                  : 'Кнопка «Получить» активируется в ваш день рождения*'}
              </p>

              <div className="grid grid-cols-2 gap-2 sm:gap-3 xl:gap-[clamp(0.75rem,0.6346rem+0.5128vw,1.25rem)]">
                <button
                  disabled={!bdayStatus.isBirthday || claiming}
                  onClick={handleClaim}
                  className={`rounded-[8px] sm:rounded-[clamp(0.5rem,0.4423rem+0.2564vw,0.75rem)] text-xs sm:text-sm xl:text-[clamp(0.875rem,0.7885rem+0.3846vw,1.125rem)] py-2 sm:py-2.5 xl:py-[clamp(0.625rem,0.5096rem+0.5128vw,1.125rem)] px-3 sm:px-4 xl:px-[clamp(1rem,0.7692rem+1.0256vw,2rem)] font-ManropeRegular transition-colors ${
                    bdayStatus.isBirthday
                      ? 'bg-[#5C6744] text-white hover:bg-[#4F5938] cursor-pointer'
                      : 'bg-[#EDE3D4] text-[#9A8F7D] cursor-not-allowed'
                  }`}
                >
                  {claiming ? 'Получаем...' : 'Получить'}
                </button>
                <button
                  className="rounded-[8px] sm:rounded-[clamp(0.5rem,0.4423rem+0.2564vw,0.75rem)] bg-[#F5F0E4] text-[#967450] text-xs sm:text-sm xl:text-[clamp(0.875rem,0.7885rem+0.3846vw,1.125rem)] py-2 sm:py-2.5 xl:py-[clamp(0.625rem,0.5096rem+0.5128vw,1.125rem)] px-3 sm:px-4 xl:px-[clamp(1rem,0.7692rem+1.0256vw,2rem)] font-ManropeRegular hover:bg-[#E8E2D5] transition-colors"
                >
                  Узнать подробнее
                </button>
              </div>
            </>
          )}
        </div>

        {/* Карточка "Электронная визитка" */}
        <div className="bg-white rounded-[16px] sm:rounded-[20px] p-4 sm:p-6 xl:p-[clamp(1.5rem,1.2692rem+1.0256vw,2.5rem)] border border-[#E8E2D5]">
          <h2 className="text-[clamp(1.125rem,1rem+0.5vw,1.75rem)] sm:text-[clamp(1.25rem,1.1346rem+0.5128vw,1.75rem)] font-Manrope-SemiBold text-[#4F5338] mb-2 sm:mb-[clamp(0.75rem,0.6346rem+0.5128vw,1.25rem)]">
            Электронная визитка
          </h2>

          <p className="text-sm sm:text-base xl:text-[clamp(0.875rem,0.8077rem+0.2885vw,1.125rem)] font-ManropeRegular text-[#636846] mb-4 sm:mb-6 xl:mb-[clamp(1.5rem,1.2692rem+1.0256vw,2.5rem)]">
            Мы сделали электронную визитку, которую удобно сохранить и легко отправить
          </p>

          {/* Мини-превью визитки */}
          <div className="bg-[#F5F0E4] rounded-[10px] sm:rounded-[12px] h-32 sm:h-40 xl:h-[clamp(8rem,6rem+8vw,12rem)] mb-4 sm:mb-6 xl:mb-[clamp(1.5rem,1.2692rem+1.0256vw,2.5rem)] flex flex-col items-center justify-center gap-1">
            <span className="text-base sm:text-lg xl:text-xl font-Manrope-SemiBold text-[#4F5338]">
              Новая Я
            </span>
            <span className="text-xs sm:text-sm font-ManropeRegular text-[#967450]">
              Клиника эстетической медицины
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 sm:gap-3 xl:gap-[clamp(0.75rem,0.6346rem+0.5128vw,1.25rem)]">
            <button
              onClick={() => router.push('/business-card')}
              className="rounded-[8px] sm:rounded-[clamp(0.5rem,0.4423rem+0.2564vw,0.75rem)] bg-[#5C6744] text-white text-xs sm:text-sm xl:text-[clamp(0.875rem,0.7885rem+0.3846vw,1.125rem)] py-2 sm:py-2.5 xl:py-[clamp(0.625rem,0.5096rem+0.5128vw,1.125rem)] px-3 sm:px-4 xl:px-[clamp(1rem,0.7692rem+1.0256vw,2rem)] font-ManropeRegular hover:bg-[#4F5938] transition-colors"
            >
              Скачать
            </button>
            <button
              onClick={handleShare}
              className="rounded-[8px] sm:rounded-[clamp(0.5rem,0.4423rem+0.2564vw,0.75rem)] bg-[#F5F0E4] text-[#967450] text-xs sm:text-sm xl:text-[clamp(0.875rem,0.7885rem+0.3846vw,1.125rem)] py-2 sm:py-2.5 xl:py-[clamp(0.625rem,0.5096rem+0.5128vw,1.125rem)] px-3 sm:px-4 xl:px-[clamp(1rem,0.7692rem+1.0256vw,2rem)] font-ManropeRegular hover:bg-[#E8E2D5] transition-colors"
            >
              Поделиться
            </button>
          </div>
        </div>
      </div>

      {/* Отступ снизу */}
      <div className="h-[clamp(4rem,3rem+4vw,8rem)]" />
    </div>
  );
}

/** Russian plural for "день/дня/дней" */
function getDaysWord(n: number): string {
  const abs = Math.abs(n) % 100;
  const lastDigit = abs % 10;
  if (abs >= 11 && abs <= 19) return 'дней';
  if (lastDigit === 1) return 'день';
  if (lastDigit >= 2 && lastDigit <= 4) return 'дня';
  return 'дней';
}
