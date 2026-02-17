'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Swiper, SwiperSlide } from 'swiper/react'
import { Navigation } from 'swiper/modules'

import 'swiper/css'
import 'swiper/css/navigation'

export default function SliderSectionNews() {
  const router = useRouter()
  const [progress, setProgress] = useState(0)

  const cards = useMemo(
    () => [
      { title: 'Живой\nбаланс', image: '/images/u1.png' },
      { title: 'Новое\nсияние', image: '/images/u1.png' },
      { title: 'Улыбка\nдуши', image: '/images/u1.png' },
      { title: 'Тихая\nсила', image: '/images/u1.png' },
      { title: 'Живой\nбаланс', image: '/images/u1.png' },
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
            320: { slidesPerView: 2.15, spaceBetween: 10 },
            480: { slidesPerView: 2.5, spaceBetween: 14 },
            640: { slidesPerView: 3, spaceBetween: 16 },
            1024: { slidesPerView: 4, spaceBetween: 20 },
            1280: { slidesPerView: 4.1, spaceBetween: 20 },
          }}
          navigation={{
            prevEl: '.nav-slide-news-prev',
            nextEl: '.nav-slide-news-next',
          }}
          onBeforeInit={(sw) => {
            sw.params.navigation.prevEl = '.nav-slide-news-prev'
            sw.params.navigation.nextEl = '.nav-slide-news-next'
          }}
          onInit={(sw) => {
            sw.navigation.init()
            sw.navigation.update()
          }}
          onProgress={(_sw, p) => setProgress(p)}
        >
          {cards.map((card, index) => (
            <SwiperSlide key={index}>
              <div className="relative w-full aspect-[4/4] overflow-hidden rounded-2xl cursor-pointer transition-transform duration-200 hover:scale-[1.02]">
                <Image
                  src={card.image}
                  alt={card.title.replace('\n', ' ')}
                  fill
                  sizes="(max-width: 640px) 48vw, (max-width: 1024px) 33vw, 25vw"
                  className="object-cover"
                  quality={90}
                  priority={index <= 1}
                />
                <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-black/60 to-transparent" />
                <div className="absolute bottom-4 left-4 right-4 text-[clamp(0.875rem,0.7rem+0.7vw,1.25rem)] font-ManropeMedium leading-[1.2] text-white whitespace-pre-line">
                  {card.title}
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
      <div className="w-full max-w-[1920px] px-[2%] mx-auto mt-8 md:mt-10 px-1">
        <h2 className="text-[clamp(1.25rem,1rem+1vw,2.25rem)] font-ManropeBold text-[#2b2b2b] leading-tight">
          Новости клиники
        </h2>
        <p className="mt-3 text-[clamp(0.8125rem,0.7rem+0.5vw,1.125rem)] font-ManropeRegular leading-relaxed text-[#6A7058] max-w-[600px]">
          Мы не просто ведём соцсети — мы создаём пространство, где вы можете читать, вдохновляться, выбирать и чувствовать себя частью чего-то настоящего.
        </p>
        <button
          onClick={() => router.push('/News/')}
          className="mt-5 w-full md:w-auto inline-flex items-center justify-center rounded-xl px-8 py-3.5 border border-[#C4BAA8] text-[clamp(0.8125rem,0.7rem+0.5vw,1.0625rem)] font-ManropeMedium text-[#636846] transition-all duration-300 hover:bg-[#636846] hover:text-white hover:border-[#636846] cursor-pointer"
        >
          Перейти в раздел
        </button>
      </div>
    </section>
  )
}
