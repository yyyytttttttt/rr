'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { BeforeAfterHero } from '../components/galery/BeforeAfter'

const BEFORE = { src: '/images/sl51.png', alt: 'До процедуры' }
const AFTER = { src: '/images/sl52.png', alt: 'После процедуры' }

export default function SliderSection6() {
  const router = useRouter()

  return (
    <div className="relative h-app min-h-0 flex-none w-screen bg-[#FFFCF3] overflow-hidden">
      <div className="absolute inset-0 flex items-center justify-center px-4 sm:px-6 md:px-10 lg:px-16">
        <div className="w-full max-w-[1400px]">

          <div className="flex flex-col md:grid md:grid-cols-[0.6fr_1.4fr] md:gap-12 lg:gap-16 md:items-center">

            {/* Image — top on mobile, right on desktop */}
            <div className="order-1 md:order-2">
              <BeforeAfterHero
                before={BEFORE}
                after={AFTER}
                initial={50}
              />
            </div>

            {/* Text — below on mobile, left on desktop */}
            <div className="order-2 md:order-1 mt-10 md:mt-0">
              <h2 className="text-[clamp(1.25rem,1rem+1vw,2.5rem)] font-ManropeBold text-[#4F5338] leading-tight">
                Галерея наших работ
              </h2>
              <p className="mt-4 text-[clamp(0.8125rem,0.7rem+0.5vw,1.125rem)] font-ManropeRegular leading-relaxed text-[#636846]">
                Видео результаты процедур, выполненных нашими специалистами. Мы гордимся доверием наших клиентов и с радостью делимся их преображениями.
              </p>
              <button
                onClick={() => router.push('/galery/')}
                className="mt-6 inline-flex items-center justify-center rounded-lg px-8 py-3.5 bg-[#F5F0E4] text-[#967450] font-ManropeRegular text-[clamp(0.8125rem,0.7rem+0.5vw,1.0625rem)] transition-all duration-300 hover:bg-[#EDE5D5] cursor-pointer w-full md:w-auto"
              >
                Перейти в раздел
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
