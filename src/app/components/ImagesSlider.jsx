'use client'
import { Swiper, SwiperSlide } from 'swiper/react'
import { Navigation, A11y } from 'swiper/modules'
import 'swiper/css'
import 'swiper/css/navigation'
import { memo } from 'react'

function ImagesSlider({ images = [] }) {
  return (
    <div className="absolute top-1/2 right-[4%] -translate-y-1/2 w-[45%]">
      <Swiper
        modules={[Navigation, A11y]}
        loop
        spaceBetween={20}
        slidesPerView={2.5}
        breakpoints={{
          640:  { slidesPerView: 1.3, spaceBetween: 28 },
          768:  { slidesPerView: 2,   spaceBetween: 28 },
          1850: { slidesPerView: 2.5, spaceBetween: 32 },
        }}
        navigation={{ nextEl: '.nav-next', prevEl: '.nav-prev' }}
        className="equalize-swiper"
      >
        {images.map((src, i) => (
          <SwiperSlide key={i} className="!h-auto">
            <div className="w-full h-full rounded-[30px] overflow-hidden shadow-lg">
              <img
                src={src}
                alt={`slide-${i}`}
                className="w-full h-full object-cover"
              />
            </div>
          </SwiperSlide>
        ))}
      </Swiper>

      {/* стрелки — как у PassesSlider */}
      <div className="absolute left-4 sm:left-6 bottom-[-15%] 4xl:bottom-[-12%] z-10 flex gap-8">
        <button className="nav-prev transition hover:scale-105" aria-label="Предыдущий">
          <svg xmlns="http://www.w3.org/2000/svg" width="51" height="50" viewBox="0 0 51 50" fill="none">
            <rect x="50.668" y="50" width="50" height="50" rx="25" transform="rotate(-180 50.668 50)" fill="#F7EFE5"/>
            <path d="M19.306 25.0001L28.793 34.4871L27.4466 35.8657L16.5815 25.0001L27.4466 14.1345L28.793 15.5131L19.306 25.0001Z" fill="#967450"/>
          </svg>
        </button>
        <button className="nav-next transition hover:scale-105" aria-label="Следующий">
          <svg xmlns="http://www.w3.org/2000/svg" width="51" height="50" viewBox="0 0 51 50" fill="none">
            <rect x="0.667969" width="50" height="50" rx="25" fill="#F7EFE5"/>
            <path d="M32.0299 24.9999L22.543 15.5129L23.8893 14.1343L34.7544 24.9999L23.8893 35.8655L22.543 34.4869L32.0299 24.9999Z" fill="#967450"/>
          </svg>
        </button>
      </div>

      {/* одинаковая высота слайдов */}
      <style jsx global>{`
        .equalize-swiper .swiper-wrapper { align-items: stretch; }
        .equalize-swiper .swiper-slide { height: auto; display: flex; }
      `}</style>
    </div>
  )
}
export default memo(ImagesSlider)
