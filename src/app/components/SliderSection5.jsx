'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Swiper, SwiperSlide } from 'swiper/react'
import { Navigation } from 'swiper/modules'

import 'swiper/css'
import 'swiper/css/navigation'

const SliderSection5 = () => {
  const router = useRouter()
  const [progress, setProgress] = useState(0)

  const specialists = useMemo(
    () => [
      { name: 'Екатерина Иванова', role: 'Врач-косметолог,\nдерматовенеролог', experience: '5 лет опыта', image: '/images/fot.png' },
      { name: 'Анна Петрова', role: 'Врач-косметолог,\nтрихолог', experience: '8 лет опыта', image: '/images/fot.png' },
      { name: 'Мария Сидорова', role: 'Дерматовенеролог,\nкосметолог', experience: '6 лет опыта', image: '/images/fot.png' },
      { name: 'Ольга Козлова', role: 'Врач-косметолог,\nдерматолог', experience: '10 лет опыта', image: '/images/fot.png' },
      { name: 'Наталья Волкова', role: 'Трихолог,\nкосметолог', experience: '4 года опыта', image: '/images/fot.png' },
      { name: 'Елена Морозова', role: 'Врач-косметолог,\nдерматовенеролог', experience: '7 лет опыта', image: '/images/fot.png' },
    ],
    []
  )

  return (
    <section className="relative z-10 w-full h-app flex flex-col justify-center px-4 sm:px-6">
      {/* Slider area */}
      <div className="w-full max-w-[1920px] px-[2%] mx-auto">
        <Swiper
          className="w-full"
          modules={[Navigation]}
          speed={500}
          spaceBetween={12}
          slidesPerView={2}
          breakpoints={{
            320: { slidesPerView: 1.4, spaceBetween: 10 },
            480: { slidesPerView: 2, spaceBetween: 14 },
            640: { slidesPerView: 2.5, spaceBetween: 16 },
            1024: { slidesPerView: 3.5, spaceBetween: 20 },
            1280: { slidesPerView: 4, spaceBetween: 20 },
            1500: { slidesPerView: 4.2, spaceBetween: 22 },
          }}
          navigation={{
            prevEl: '.nav-slide-5-prev',
            nextEl: '.nav-slide-5-next',
          }}
          onBeforeInit={(sw) => {
            sw.params.navigation.prevEl = '.nav-slide-5-prev'
            sw.params.navigation.nextEl = '.nav-slide-5-next'
          }}
          onInit={(sw) => {
            sw.navigation.init()
            sw.navigation.update()
          }}
          onProgress={(_sw, p) => setProgress(p)}
        >
          {specialists.map((spec, index) => (
            <SwiperSlide key={index}>
              <div className="relative w-full aspect-[3/4] overflow-hidden rounded-2xl cursor-pointer transition-transform duration-200 hover:scale-[1.02]">
                <Image
                  src={spec.image}
                  alt={spec.name}
                  fill
                  sizes="(max-width: 640px) 70vw, (max-width: 1024px) 40vw, 25vw"
                  className="object-cover"
                  quality={90}
                  priority={index <= 1}
                />
                {/* Experience badge */}
                <div className="absolute top-3 left-3 z-10">
                  <span className="inline-block bg-[#FFFCF3]/90 backdrop-blur-sm text-[#967450] px-3 py-1.5 rounded-lg text-[clamp(0.6875rem,0.6rem+0.4vw,0.875rem)] font-ManropeMedium">
                    {spec.experience}
                  </span>
                </div>
                {/* Gradient overlay */}
                <div className="absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
                {/* Text */}
                <div className="absolute bottom-4 left-4 right-4 z-10">
                  <div className="text-[clamp(0.9375rem,0.8rem+0.6vw,1.25rem)] font-ManropeBold leading-tight text-white">
                    {spec.name}
                  </div>
                  <div className="mt-1 text-[clamp(0.75rem,0.65rem+0.45vw,0.9375rem)] font-ManropeRegular leading-snug text-white/80 whitespace-pre-line">
                    {spec.role}
                  </div>
                </div>
              </div>
            </SwiperSlide>
          ))}
        </Swiper>

        {/* Progress bar */}
        <div className="mt-5">
          <div className="relative h-[4px] w-full rounded-full bg-[#D9D4C9]">
            <div
              className="absolute top-0 h-[4px] rounded-full bg-[#636846] transition-all duration-300"
              style={{ width: '40%', left: `${progress * 60}%` }}
            />
          </div>
        </div>
      </div>

      {/* Text block below slider */}
      <div className="w-full max-w-[1920px] px-[2%] mx-auto mt-4 md:mt-5">
        <h2 className="text-[clamp(1.25rem,1rem+1vw,2.25rem)] font-ManropeBold text-[#2b2b2b] leading-tight">
          Наши специалисты
        </h2>
        <p className="mt-3 text-[clamp(0.8125rem,0.7rem+0.5vw,1.125rem)] font-ManropeRegular leading-relaxed text-[#6A7058] max-w-[600px]">
          Команда профессионалов с многолетним опытом, которые помогут вам подобрать индивидуальный подход к красоте и здоровью.
        </p>
        <button
          onClick={() => router.push('/Team/')}
          className="mt-5 w-full md:w-auto inline-flex items-center justify-center rounded-xl px-8 py-3.5 border border-[#C4BAA8] text-[clamp(0.8125rem,0.7rem+0.5vw,1.0625rem)] font-ManropeMedium text-[#636846] transition-all duration-300 hover:bg-[#636846] hover:text-white hover:border-[#636846] cursor-pointer"
        >
          Перейти в раздел
        </button>
      </div>
    </section>
  )
}

export default SliderSection5
