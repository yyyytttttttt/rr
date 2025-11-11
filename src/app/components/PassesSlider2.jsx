'use client'
import { useState } from 'react'
import { Swiper, SwiperSlide } from 'swiper/react'
import { Navigation, A11y } from 'swiper/modules'
import Image from 'next/image'
import { motion } from 'framer-motion'
import 'swiper/css'
import 'swiper/css/navigation'

const IMAGES = [
  { src: '/images/pass1.jpg', alt: 'Промо 1' },
  { src: '/images/pass2.jpg', alt: 'Промо 2' },
  { src: '/images/pass3.jpg', alt: 'Промо 3' },
  { src: '/images/pass4.jpg', alt: 'Промо 4' },
]

// анимации
const slide = {
  hidden: { opacity: 0, y: 16, scale: 0.98 },
  show: {
    opacity: 1, y: 0, scale: 1,
    transition: { duration: 0.45, ease: [0.25,1,0.5,1] }
  }
}
const imageIn = {
  hidden: { opacity: 0, scale: 1.03 },
  show:   { opacity: 1, scale: 1, transition: { duration: 0.6, ease: [0.25,1,0.5,1] } }
}

export default function PassesSlider2() {
  const [active, setActive] = useState(0)

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
        observer
        observeParents
        observeSlideChildren
        onInit={(s) => {
          setActive(s.realIndex)
          requestAnimationFrame(() => s.update())
        }}
        onSlideChange={(s) => setActive(s.realIndex)}
        className="equalize-swiper"
      >
        {IMAGES.map((img, i) => (
          <SwiperSlide key={i} className="!h-auto">
            {/* контейнер с пропорцией — оставлен; только обёртки motion */}
            <motion.div
              variants={slide}
              initial="hidden"
              animate={active % IMAGES.length === i ? 'show' : 'hidden'}
              className="w-full h-full rounded-[30px] overflow-hidden"
            >
              <motion.div className="relative w-full aspect-[4/3] sm:aspect-[3/2] lg:aspect-[16/9]" variants={imageIn}>
                <Image
                  src={img.src}
                  alt={img.alt}
                  fill
                  sizes="(min-width: 1280px) 35vw, (min-width: 768px) 45vw, 80vw"
                  className="object-cover"
                  priority={i === 0}
                />
              </motion.div>
            </motion.div>
          </SwiperSlide>
        ))}
      </Swiper>

      {/* стрелки — лёгкий hover/tap */}
      <div className="absolute left-4 sm:left-6 bottom-[-15%] 4xl:bottom-[-12%] z-10 flex gap-8">
        <motion.button
          whileHover={{ scale: 1.05, y: -2 }}
          whileTap={{ scale: 0.96 }}
          className="nav-prev transition hover:scale-105"
          aria-label="Предыдущий"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="51" height="50" viewBox="0 0 51 50" fill="none">
            <rect x="50.668" y="50" width="50" height="50" rx="25" transform="rotate(-180 50.668 50)" fill="#F7EFE5"/>
            <path d="M19.306 25.0001L28.793 34.4871L27.4466 35.8657L16.5815 25.0001L27.4466 14.1345L28.793 15.5131L19.306 25.0001Z" fill="#967450"/>
          </svg>
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.05, y: -2 }}
          whileTap={{ scale: 0.96 }}
          className="nav-next transition hover:scale-105"
          aria-label="Следующий"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="51" height="50" viewBox="0 0 51 50" fill="none">
            <rect x="0.667969" width="50" height="50" rx="25" fill="#F7EFE5"/>
            <path d="M32.0299 24.9999L22.543 15.5129L23.8893 14.1343L34.7544 24.9999L23.8893 35.8655L22.543 34.4869L32.0299 24.9999Z" fill="#967450"/>
          </svg>
        </motion.button>
      </div>

      {/* equal height + запрет растягивания слайдов */}
      <style jsx global>{`
        .equalize-swiper .swiper-wrapper { align-items: stretch; }
        .equalize-swiper .swiper-slide {
          height: auto;
          display: flex;
          flex: 0 0 auto; /* важно: не растягивать, чтобы влезало 2.5 */
        }
      `}</style>
    </div>
  )
}
