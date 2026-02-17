'use client'
import React, { memo, useState } from 'react'
import { Swiper, SwiperSlide } from 'swiper/react'
import { Navigation, A11y } from 'swiper/modules'
import 'swiper/css'
import 'swiper/css/navigation'
import { motion, MotionConfig } from 'framer-motion'

const CARDS = [
  {
    title: 'Что ты получаешь',
    color: 'bg-[#757F64]',
    items: [
      'Доступ к закрытому челленджу',
      'Уникальный контент и ежедневную поддержку',
      'Баллы за каждый выполненный день',
      'Подарок по завершении',
    ]
  },
  {
    title: 'Как использовать',
    color: 'bg-[#CB7A5C]',
    items: [
      'Оформи пропуск в приложении',
      'Начни свой челлендж или подари его другому',
      'Получай задания, выполняй, следи за прогрессом',
      'Заверши и получи бонус',
    ]
  },
  {
    title: 'Кому подойдёт',
    color: 'bg-[#5C757A]',
    items: [
      'Тем, кто хочет попробовать преобразиться с наставником',
      'Тем, кто любит делать подарки со смыслом',
      'Тем, кто хочет ясного и ясного маршрута',
    ]
  },
]

const slideVariants = {
  hidden: { opacity: 0.85, y: 14, scale: 0.985 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.35, ease: [0.25, 1, 0.5, 1], when: 'beforeChildren', staggerChildren: 0.05 }
  }
}

const itemVariants = {
  hidden: { opacity: 0.8, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.25, ease: 'easeOut' } }
}

const SlideCard = memo(function SlideCard({ card, active }) {
  return (
    <motion.article
      variants={slideVariants}
      initial="hidden"
      animate={active ? 'show' : 'hidden'}
      className={`${card.color} text-[#F5F0E4] w-full h-full rounded-[10px] xs:rounded-[30px] shadow-lg
                  px-[6%] py-[12%] flex flex-col will-change-transform translate-z-0`}
    >
      <motion.h3
        variants={itemVariants}
        className="mb-4 font-ManropeBold text-[clamp(1rem,0.8571rem+0.7143vw,2rem)]"
      >
        {card.title}
      </motion.h3>

      <ul className="text-[clamp(0.75rem,0.6429rem+0.5357vw,1.5rem)] font-ManropeRegular">
        {card.items.map((t, j) => (
          <motion.li key={j} variants={itemVariants} className="mb-[2%]">
            {t}
          </motion.li>
        ))}
      </ul>

      <div className="mt-auto" />
    </motion.article>
  )
})

function SliderSection2({ children }) {
  const [active, setActive] = useState(0)

  return (
    <div className="relative h-app min-h-0 flex-none w-screen bg-[#FFFCF3]">
      {/* DesktopCard и MobileBar */}
      <div className="absolute inset-0">
        {children}
      </div>

      {/* слайдер справа */}
      <div className="absolute top-[36%] xs:top-1/2 xs:right-[4%] px-[4%] -translate-y-1/2 w-full xl:px-0 xs:w-[80%] xl:w-[45%]">
        <MotionConfig reducedMotion="user">
          <Swiper
            modules={[Navigation, A11y]}
            navigation={{
              prevEl: '.nav-slide-2-prev',
              nextEl: '.nav-slide-2-next',
            }}
            onBeforeInit={(s) => {
              s.params.navigation.prevEl = '.nav-slide-2-prev'
              s.params.navigation.nextEl = '.nav-slide-2-next'
            }}
            onInit={(s) => s.navigation.update()}
            loop={true}
            resistanceRatio={0.5}
            threshold={6}
            speed={420}
            allowTouchMove
            watchOverflow
            spaceBetween={14}
            slidesPerView={2.2}
            breakpoints={{
              320: { slidesPerView: 1.6, spaceBetween: 8 },
              480: { slidesPerView: 1.5, spaceBetween: 10 },
              768: { slidesPerView: 1.9, spaceBetween: 12 },
              1150: { slidesPerView: 2, spaceBetween: 14 },
            }}
            onSlideChange={(s) => setActive(s.realIndex)}
            className="equalize-swiper will-change-transform"
          >
            {CARDS.map((c, i) => (
              <SwiperSlide key={i} className="!h-auto">
                <SlideCard card={c} active={active % CARDS.length === i} />
              </SwiperSlide>
            ))}
          </Swiper>

        </MotionConfig>
      </div>
    </div>
  )
}

export default memo(SliderSection2)
