"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import ChangePasswordForm from "../../components/profile/changeProfilePassword";
import toast from "react-hot-toast";
import { signOut } from "next-auth/react";

type Props = {
  doctorId: string;
  doctorName: string;
  doctorEmail: string;
  doctorImage: string;
  doctorTitle?: string | null;
  bufferMin?: number;
  slotDurationMin?: number;
  minLeadMin?: number;
  tzid: string;
};

export default function SettingsPanel({
  doctorId,
  doctorName,
  doctorEmail,
  doctorImage,
  doctorTitle,
  bufferMin,
  slotDurationMin,
  minLeadMin,
  tzid,
}: Props) {
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await signOut({ callbackUrl: "/" });
    } catch (error) {
      console.error("Logout error:", error);
      toast.error("Ошибка при выходе");
    }
  };

  return (
    <div className="min-h-screen bg-[#FFFCF3] relative overflow-hidden">
      {/* Водяной знак β */}
      <div className="pointer-events-none absolute right-[clamp(-5rem,-8.4615rem+15.3846vw,10rem)] top-[clamp(2rem,0rem+8.8889vw,10rem)] z-0 hidden lg:block">
        <svg
          viewBox="0 0 600 800"
          className="h-[clamp(20rem,25.3846rem+20.5128vw,50rem)] w-auto opacity-[0.15]"
          aria-hidden="true"
        >
          <g fill="none" stroke="#EEE7DC" strokeWidth="12">
            <path d="M300,60 C100,60 40,200 40,400 s60,340 260,340 260-140 260-340 S500,60 300,60z" />
            <path d="M390,210c65,25 105,65 105,120 0,80-85,130-165,130 100,12 170,70 170,150 0,95-95,170-220,170" />
          </g>
          <circle cx="365" cy="395" r="22" fill="#EEE7DC" />
        </svg>
      </div>

      <div className="relative z-10 max-w-full sm:max-w-[600px] md:max-w-[700px] lg:max-w-[clamp(35rem,32.6923rem+10.2564vw,45rem)] px-4 py-6 sm:py-8">
        

        {/* Карточка профиля */}
        <div className="rounded-[12px] sm:rounded-[16px] xl:rounded-[clamp(1rem,0.8846rem+0.5128vw,1.5rem)] border border-[#EEE7DC] bg-white p-4 sm:p-6 xl:p-[clamp(1.5rem,1.1538rem+1.5385vw,3rem)] mb-4 sm:mb-6 xl:mb-[clamp(1.5rem,1.2692rem+1.0256vw,2.5rem)]">
          <div className="mb-4 sm:mb-6 xl:mb-[clamp(1.25rem,1.0192rem+1.0256vw,2.25rem)] flex items-center gap-3 sm:gap-4 xl:gap-[clamp(0.75rem,0.6346rem+0.5128vw,1.25rem)]">
            <div className="relative flex-shrink-0">
              {doctorImage ? (
                <Image
                  src={doctorImage}
                  alt="avatar"
                  width={64}
                  height={64}
                  className="w-14 h-14 sm:w-16 sm:h-16 xl:h-[clamp(3.5rem,3.2692rem+1.0256vw,4.5rem)] xl:w-[clamp(3.5rem,3.2692rem+1.0256vw,4.5rem)] rounded-full object-cover border-2 border-white"
                />
              ) : (
                <div className="w-14 h-14 sm:w-16 sm:h-16 xl:h-[clamp(3.5rem,3.2692rem+1.0256vw,4.5rem)] xl:w-[clamp(3.5rem,3.2692rem+1.0256vw,4.5rem)] rounded-full bg-[#F5F0E4] flex items-center justify-center border-2 border-white">
                  <svg className="w-6 h-6 sm:w-8 sm:h-8 text-[#967450]" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                  </svg>
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-Manrope-SemiBold text-base sm:text-lg xl:text-[clamp(1rem,0.8846rem+0.5128vw,1.5rem)] text-[#4F5338] truncate">{doctorName}</div>
              {doctorTitle && (
                <div className="text-sm sm:text-base xl:text-[clamp(0.875rem,0.8077rem+0.2985vw,1.125rem)] text-[#636846] truncate mb-0.5">{doctorTitle}</div>
              )}
              <div className="text-sm sm:text-base xl:text-[clamp(0.875rem,0.8077rem+0.2985vw,1.125rem)] text-[#636846] truncate">{doctorEmail}</div>
            </div>
          </div>

          <div className="space-y-3 sm:space-y-4 xl:space-y-[clamp(1rem,0.8846rem+0.5128vw,1.5rem)]">
            <div className="flex items-center justify-between p-3 sm:p-4 bg-[#F5F0E4] rounded-[8px] sm:rounded-[10px]">
              <span className="text-sm sm:text-base xl:text-[clamp(0.875rem,0.8077rem+0.2885vw,1.125rem)] text-[#636846] font-ManropeRegular">
                Длительность слота
              </span>
              <span className="text-sm sm:text-base xl:text-[clamp(1rem,0.9423rem+0.2564vw,1.25rem)] text-[#4F5338] font-Manrope-SemiBold">
                {slotDurationMin || 30} мин
              </span>
            </div>

            <div className="flex items-center justify-between p-3 sm:p-4 bg-[#F5F0E4] rounded-[8px] sm:rounded-[10px]">
              <span className="text-sm sm:text-base xl:text-[clamp(0.875rem,0.8077rem+0.2885vw,1.125rem)] text-[#636846] font-ManropeRegular">
                Буфер между приёмами
              </span>
              <span className="text-sm sm:text-base xl:text-[clamp(1rem,0.9423rem+0.2564vw,1.25rem)] text-[#4F5338] font-Manrope-SemiBold">
                {bufferMin || 15} мин
              </span>
            </div>

            <div className="flex items-center justify-between p-3 sm:p-4 bg-[#F5F0E4] rounded-[8px] sm:rounded-[10px]">
              <span className="text-sm sm:text-base xl:text-[clamp(0.875rem,0.8077rem+0.2885vw,1.125rem)] text-[#636846] font-ManropeRegular">
                Мин. предупреждение
              </span>
              <span className="text-sm sm:text-base xl:text-[clamp(1rem,0.9423rem+0.2564vw,1.25rem)] text-[#4F5338] font-Manrope-SemiBold">
                {minLeadMin || 60} мин
              </span>
            </div>

            <div className="flex items-center justify-between p-3 sm:p-4 bg-[#F5F0E4] rounded-[8px] sm:rounded-[10px]">
              <span className="text-sm sm:text-base xl:text-[clamp(0.875rem,0.8077rem+0.2885vw,1.125rem)] text-[#636846] font-ManropeRegular">
                Часовой пояс
              </span>
              <span className="text-sm sm:text-base xl:text-[clamp(1rem,0.9423rem+0.2564vw,1.25rem)] text-[#4F5338] font-Manrope-SemiBold">
                {tzid || "UTC"}
              </span>
            </div>
          </div>

          <p className="mt-3 sm:mt-4 xl:mt-[clamp(1rem,0.8846rem+0.5128vw,1.5rem)] text-xs sm:text-sm xl:text-[clamp(0.875rem,0.8077rem+0.2885vw,1.125rem)] text-[#636846] font-ManropeRegular">
            Для изменения настроек приёма обратитесь к администратору системы.
          </p>
        </div>

        {/* Смена пароля */}
        <div className="rounded-[12px] sm:rounded-[16px] xl:rounded-[clamp(1rem,0.8846rem+0.5128vw,1.5rem)] border border-[#EEE7DC] bg-white p-4 sm:p-6 xl:p-[clamp(1.5rem,1.1538rem+1.5385vw,3rem)] mb-4 sm:mb-6 xl:mb-[clamp(1.5rem,1.2692rem+1.0256vw,2.5rem)]">
          <h2 className="mb-3 sm:mb-4 xl:mb-[clamp(1rem,0.8846rem+0.5128vw,1.5rem)] text-base sm:text-lg xl:text-[clamp(1.125rem,1.0385rem+0.3846vw,1.5rem)] font-Manrope-SemiBold text-[#4F5338]">Смена пароля</h2>
          <ChangePasswordForm />
        </div>

        {/* Низ страницы */}
        <div className="space-y-2 sm:space-y-3 xl:space-y-[clamp(0.75rem,0.6346rem+0.5128vw,1.25rem)]">
          <button
            onClick={handleLogout}
            className="text-sm sm:text-base xl:text-[clamp(0.875rem,0.8077rem+0.2985vw,1.125rem)] font-ManropeMedium text-[#CF5E5E] hover:underline transition"
          >
            Выйти
          </button>
        </div>
      </div>
      <div className="h-24 sm:h-32 md:h-40 xl:h-[clamp(8rem,6.1538rem+8.2051vw,16rem)]" />
    </div>
  );
}
