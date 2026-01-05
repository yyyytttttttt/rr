'use client'
import React from 'react'
import Image from 'next/image'
import StaticSection3 from '../SliderSection3'

export default function Block3() {
  return (
    <StaticSection3 src="">
      <div className="absolute inset-0 h-[100dvh] bg-[#F5F0E4] flex items-center justify-center px-[4%] xs:px-[8%]">
        <div className="w-full max-w-[1400px] flex flex-col 1k:flex-row gap-8 1k:gap-12 items-center">
          {/* Изображение слева */}
          <div className="w-full 1k:w-1/2 order-2 1k:order-1">
            <div className="relative w-full aspect-[4/3] rounded-[20px] overflow-hidden">
              <Image
                src="/images/sl101.png"
                alt="Новая Я"
                fill
                className="object-cover"
                priority
              />
            </div>
          </div>

          {/* Текст справа */}
          <div className="w-full 1k:w-1/2 order-1 1k:order-2 flex flex-col gap-6">
            <h2 className="text-[#636846] text-[clamp(1.5rem,1rem+2vw,2.5rem)] font-ManropeBold leading-[1.2]">
              Всё начинается с разрешения быть собой
            </h2>

            <p className="text-[#636846] text-[clamp(0.875rem,0.75rem+0.5vw,1.125rem)] font-ManropeRegular leading-[1.6] opacity-80">
              Мы не обещаем идеальное тело или вечную молодость.
              Мы создаём пространство, где можно выбрать себя —
              без спешки, без стресса, по-настоящему.
            </p>

            <button className="rounded-[5px] bg-[#636846] text-white px-4 sm:px-8 py-2 sm:py-4 font-ManropeRegular text-[clamp(0.875rem,0.75rem+0.5vw,1.125rem)] transition-all duration-300 hover:bg-[#757F64] hover:scale-[1.02] active:scale-[0.98] w-fit">
              Перейти к услугам
            </button>
          </div>
        </div>
      </div>
    </StaticSection3>
  )
}
