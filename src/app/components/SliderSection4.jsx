'use client'

import { useMemo, useRef } from 'react'
import Image from 'next/image'
import { Swiper, SwiperSlide } from 'swiper/react'
import { Pagination, Navigation } from 'swiper/modules'

import 'swiper/css'
import 'swiper/css/pagination'
import 'swiper/css/navigation'

export default function ProjectsSlider() {
  const prevRef = useRef(null)
  const nextRef = useRef(null)

  const projects = useMemo(
    () => [
      { title: 'Инъекционная косметология', image: '/images/us1.png' },
      { title: 'Трихология', image: '/images/us2.png' },
      { title: 'Чистки лица', image: '/images/us3.png' },
      { title: 'Массажная терапия', image: '/images/us2.png' },
      { title: 'Эстетические процедуры', image: '/images/us1.png' },
    ],
    []
  )

  return (
    <section className="relative z-10 w-full h-app flex items-center justify-center px-4">
      {/* Заголовок */}
     

      {/* Стрелки */}
      <button
        ref={prevRef}
        aria-label="Предыдущий слайд"
        className="absolute z-50 top-1/2 left-4 md:left-8 -translate-y-1/2 bg-[#967450] hover:bg-[#7d5f42] transition p-2 md:p-3 rounded-full shadow-xl"
      >
        <svg width="20" height="20" fill="white" viewBox="0 0 24 24">
          <path d="M15 18l-6-6 6-6" />
        </svg>
      </button>

      <button
        ref={nextRef}
        aria-label="Следующий слайд"
        className="absolute z-50 top-1/2 right-4 md:right-8 -translate-y-1/2 bg-[#967450] hover:bg-[#7d5f42] transition p-2 md:p-3 rounded-full shadow-xl"
      >
        <svg width="20" height="20" fill="white" viewBox="0 0 24 24">
          <path d="M9 6l6 6-6 6" />
        </svg>
      </button>

      {/* Слайдер */}
      <Swiper
        className="projects-swiper overflow-visible w-full max-w-[1920px]"
        modules={[Pagination, Navigation]}
        loop
        centeredSlides
        watchSlidesProgress
        speed={650}
        spaceBetween={20}
        slidesPerView={1.15}
        breakpoints={{
          320: { slidesPerView: 1, spaceBetween: 6 },
          480: { slidesPerView: 1.25, spaceBetween: 20 },
          768: { slidesPerView: 2, spaceBetween: 24 },
          1024: { slidesPerView: 3, spaceBetween: 12 },
        }}
        pagination={{
          el: '.projects-pagination',
          clickable: true,
          renderBullet: (index, className) =>
            `<span class="${className} projects-bullet"></span>`,
        }}
        onBeforeInit={(sw) => {
          sw.params.navigation = {
            prevEl: prevRef.current,
            nextEl: nextRef.current,
            disabledClass: 'opacity-40 pointer-events-none',
          }
        }}
        onInit={(sw) => {
          sw.navigation.init()
          sw.navigation.update()
        }}
      >
        {projects.map((proj, index) => (
          <SwiperSlide key={index} className="!h-auto">
            <article className="projects-card group relative overflow-hidden shadow-xl mx-auto rounded-3xl transition-all duration-300">
              {/* Адаптивная высота без fixed: через aspect-ratio */}
              <div className="relative w-full aspect-5/4">
                <Image
                  src={proj.image}
                  alt={proj.title}
                  fill
                  sizes="(max-width: 480px) 92vw, (max-width: 1024px) 48vw, 32vw"
                  quality={100}
                  className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                  priority={index === 0}
                />
              </div>

              {/* Оверлей */}
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-black/30 to-black/70" />

              {/* Подпись */}
              <div className="absolute bottom-5 left-4 right-4 z-20">
                <div className="px-4 py-2  text-white font-ManropeSemiBold text-start text-[clamp(0.875rem,0.6154rem+1.1538vw,2rem)] tracking-tight ">
                  {proj.title}
                </div>
              </div>
            </article>
          </SwiperSlide>
        ))}
      </Swiper>

      {/* Пагинация */}
     

      {/* Стили */}
      <style jsx global>{`
        .projects-swiper .swiper-slide {
          transition: all 0.4s cubic-bezier(0.25, 1, 0.5, 1);
          opacity: 0.5;
          transform: scale(0.85);
        }
        .projects-swiper .swiper-slide-active {
          opacity: 1;
          transform: scale(1);
          z-index: 10;
        }
        .projects-swiper .swiper-slide-prev,
        .projects-swiper .swiper-slide-next {
          opacity: 0.7;
          transform: scale(0.9);
        }
        .projects-bullet {
          width: 8px;
          height: 8px;
          background: #967450;
          opacity: 0.3;
          border-radius: 50%;
          transition: all 0.3s;
          cursor: pointer;
        }
        .projects-bullet.swiper-pagination-bullet-active {
          width: 24px;
          opacity: 1;
          background: #967450;
          border-radius: 4px;
        }
        .projects-card {
          backface-visibility: hidden;
          perspective: 1000px;
        }
      `}</style>
    </section>
  )
}
