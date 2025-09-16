'use client'
import { Swiper, SwiperSlide } from 'swiper/react'
import { Navigation, A11y } from 'swiper/modules'
import 'swiper/css'
import 'swiper/css/navigation'
import { useState } from 'react'
import { motion } from 'framer-motion'

const CARDS = [
  { title: 'Что ты получаешь', color: 'bg-[#757F64]', text: 'text-[#F5F0E4]', items: [
    'Доступ к закрытому челленджу',
    'Уникальный контент и ежедневную поддержку',
    'Баллы за каждый выполненный день',
    'Подарок по завершении',
  ]},
  { title: 'Как использовать', color: 'bg-[#CB7A5C]', text: 'text-[#F5F0E4]', items: [
    'Оформи пропуск в приложении',
    'Начни челлендж или подари другу',
    'Выполняй задания, следи за прогрессом',
    'Заверши и получи бонус',
  ]},
  { title: 'Контент и бонусы', color: 'bg-[#5C757A]' ,text: 'text-[#F5F0E4]',  items: [
    'Темы на выбор',
    'Ежедневные напоминания',
    'Поддержка кураторов',
    'Ясные инструкции',
  ]},
  { title: 'Что это такое', color: 'bg-[#F5F0E4]', text: 'text-[#636846]', items: [
    'Это электронный пропуск, который открывает доступ к эксклюзивному  28-дневному челленджу. ',
    'Каждый день ты получаешь персональные задания, вдохновляющие советы и поддержку. ',
    'А в финале — приятный подарок в знак благодарности за заботу о себе.',
  ]},
]

// анимационные пресеты
const slide = {
  hidden: { opacity: 0.8, y: 18, scale: 0.98 },
  show: {
    opacity: 1, y: 0, scale: 1,
    transition: { duration: 0.45, ease: [0.25,1,0.5,1], staggerChildren: 0.06, when: 'beforeChildren' }
  }
}
const item = {
  hidden: { opacity: 0.8, y: 25 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.32, ease: 'easeOut' } }
}

export default function PassesSlider() {
  const [active, setActive] = useState(0)

  return (
    <div className="absolute top-[30%] xs:top-1/2 right-[4%] -translate-y-1/2 w-[70%] xs:w-[45%]">
      <Swiper
        modules={[Navigation, A11y]}
        loop
        spaceBetween={20}
        slidesPerView={2.5}
        breakpoints={{
          320:  { slidesPerView: 1.1, spaceBetween: 2 },
          768:  { slidesPerView: 2,   spaceBetween: 4},
          1150: { slidesPerView: 2, spaceBetween: 8 },
        }}
        navigation={{ nextEl: '.nav-next', prevEl: '.nav-prev' }}
        onInit={(s) => setActive(s.realIndex)}
        onSlideChange={(s) => setActive(s.realIndex)}
        className="equalize-swiper"
      >
        {CARDS.map((c, i) => (
          <SwiperSlide key={i} className="!h-auto">
            {/* article заменили на motion.article, классы/вёрстка сохранены */}
            <motion.article
              variants={slide}
              initial="hidden"
              animate={active % CARDS.length === i ? 'show' : 'hidden'}
              className={`${c.color} w-full h-full rounded-[10px] xs:rounded-[30px] shadow-lg ${c.text} px-[6%] py-[6%] flex flex-col`}
            >
              <motion.h3
                variants={item}
                className="mb-4 font-[Manrope-Bold] text-[clamp(1rem,0.8571rem+0.7143vw,2rem)]"
              >
                {c.title}
              </motion.h3>

              <ul className={`${c.text} text-[clamp(0.75rem,0.6429rem+0.5357vw,1.5rem)] font-ManropeRegular`}>
                {c.items.map((t, j) => (
                  <motion.li key={j} variants={item} className="mb-[2%]">
                    {t}
                  </motion.li>
                ))}
              </ul>

              <div className="mt-auto" />
            </motion.article>
          </SwiperSlide>
        ))}
      </Swiper>

      {/* стрелки — добавил лёгкий hover/tap, разметку не меняю */}
      <div className="absolute left-4 sm:left-6 bottom-[-15%]   4xl:bottom-[-12%] z-10 flex gap-8">
        <motion.button
          whileHover={{ scale: 1.05, y: -2 }}
          whileTap={{ scale: 0.96 }}
          className="nav-prev transition hover:scale-105"
          aria-label="Предыдущий"
        >
          <div className='w-[100%]'>
            <svg className='w-[30px] h-[30px] xs:h-auto xs:w-auto' xmlns="http://www.w3.org/2000/svg" width="51" height="50" viewBox="0 0 51 50" fill="none">
              <rect x="50.668" y="50" width="50" height="50" rx="25" transform="rotate(-180 50.668 50)" fill="#F7EFE5"/>
              <path d="M19.306 25.0001L28.793 34.4871L27.4466 35.8657L16.5815 25.0001L27.4466 14.1345L28.793 15.5131L19.306 25.0001Z" fill="#967450"/>
            </svg>
          </div>
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.05, y: -2 }}
          whileTap={{ scale: 0.96 }}
          className="nav-next transition hover:scale-105"
          aria-label="Следующий"
        >
          <svg className='w-[30px] h-[30px] xs:h-auto xs:w-auto' xmlns="http://www.w3.org/2000/svg" width="51" height="50" viewBox="0 0 51 50" fill="none">
            <rect x="0.667969" width="50" height="50" rx="25" fill="#F7EFE5"/>
            <path d="M32.0299 24.9999L22.543 15.5129L23.8893 14.1343L34.7544 24.9999L23.8893 35.8655L22.543 34.4869L32.0299 24.9999Z" fill="#967450"/>
          </svg>
        </motion.button>
      </div>

      {/* equal height для слайдов — как было */}
      <style jsx global>{`
        .equalize-swiper .swiper-wrapper { align-items: stretch; }
        .equalize-swiper .swiper-slide { height: auto; display: flex; }
      `}</style>
    </div>
  )
}
