"use client";

import { useRouter } from "next/navigation";

type Props = {
  userId: string;
  tzid: string;
};

export default function GiftsPanel({}: Props) {
  const router = useRouter();

  const goToBooking = () => {
    router.replace("/profile?view=booking", { scroll: false });
  };

  return (
    <div className="flex items-center justify-center min-h-[clamp(25rem,20rem+20vw,40rem)] bg-[#FFFCF3]">
      <div className="text-center space-y-[clamp(0.5rem,calc(0.333rem+0.833vw),1rem)] rounded-[20px] bg-white px-[8%] py-[4%]">
        <h2 className="text-[clamp(1.5rem,1.2692rem+1.0256vw,2.5rem)] font-ManropeBold text-[#4F5338] ">
          Раздел подарочных сертификатов пуст
        </h2>
        <p className="text-[clamp(1rem,0.9231rem+0.3419vw,1.25rem)] font-ManropeRegular text-[#636846] ">
          Пока недоступны. Загляните позже — мы обновим раздел, как только они появятся
        </p>
        <button
          onClick={goToBooking}
          className="inline-flex cursor-pointer items-center justify-center rounded-[clamp(0.5rem,0.4423rem+0.2564vw,0.75rem)] bg-[#F5F0E4] px-[clamp(2rem,1.6538rem+1.5385vw,3.5rem)] py-[clamp(0.75rem,0.6346rem+0.5128vw,1.25rem)] text-[clamp(1rem,0.9423rem+0.2564vw,1.25rem)] font-ManropeRegular text-[#967450] hover:bg-[#4c503b] duration-500 transition-colors"
        >
          Записаться
        </button>
      </div>
    </div>
  );
}
