'use client'
import { useRef, useState, memo } from 'react'
import { Swiper, SwiperSlide } from 'swiper/react'
import { Navigation, A11y } from 'swiper/modules'
import 'swiper/css'
import 'swiper/css/navigation'
import { motion, MotionConfig } from 'framer-motion'

/* ---------- данные ---------- */
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
  { title: 'Контент и бонусы', color: 'bg-[#5C757A]', text: 'text-[#F5F0E4]', items: [
    'Темы на выбор',
    'Ежедневные напоминания',
    'Поддержка кураторов',
    'Ясные инструкции',
  ]},
  { title: 'Что это такое', color: 'bg-[#F5F0E4]', text: 'text-[#636846]', items: [
    'Это электронный пропуск, который открывает доступ к эксклюзивному 28-дневному челленджу.',
    'Каждый день ты получаешь персональные задания, вдохновляющие советы и поддержку.',
    'А в финале — приятный подарок в знак благодарности за заботу о себе.',
  ]},
]

/* ---------- анимации (один раз) ---------- */
const slideVariants = {
  hidden: { opacity: 0.85, y: 14, scale: 0.985 },
  show: {
    opacity: 1, y: 0, scale: 1,
    transition: { duration: 0.35, ease: [0.25, 1, 0.5, 1] as any, when: 'beforeChildren', staggerChildren: 0.05 }
  }
}
const itemVariants = {
  hidden: { opacity: 0.8, y: 12 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.25, ease: 'easeOut' } }
}

/* ---------- карточка (мемо) ---------- */
const SlideCard = memo(function SlideCard({ card, active }) {
  return (
    <motion.article
      variants={slideVariants}
      initial="hidden"
      animate={active ? 'show' : 'hidden'}
      className={`${card.color} ${card.text} w-full h-full rounded-[10px] xs:rounded-[30px] shadow-lg
                  px-[6%] py-[6%] flex flex-col will-change-transform translate-z-0`}
    >
      <motion.h3 variants={itemVariants}
        className="mb-4 font-[Manrope-Bold] text-[clamp(1rem,0.8571rem+0.7143vw,2rem)]">
        {card.title}
      </motion.h3>

      <ul className="text-[clamp(0.75rem,0.6429rem+0.5357vw,1.5rem)] font-ManropeRegular">
        {card.items.map((t, j) => (
          <motion.li key={j} variants={itemVariants} className="mb-[2%]">{t}</motion.li>
        ))}
      </ul>

      <div className="mt-auto" />
    </motion.article>
  )
})

function PassesSlider() {
  const [active, setActive] = useState(0)
  const prevRef = useRef(null)
  const nextRef = useRef(null)

  return (
    <div className="absolute top-[36%] xs:top-1/2   xs:right-[4%] px-[4%] -translate-y-1/2 w-full xs:px-0 xs:w-[45%]">
      {/* framer-motion глобальные настройки (без излишеств) */}
      <MotionConfig reducedMotion="user">
        <Swiper
          modules={[Navigation, A11y]}
          onBeforeInit={(s) => {
            // навигация через refs, чтобы не искать элементы в DOM
            s.params.navigation.prevEl = prevRef.current
            s.params.navigation.nextEl = nextRef.current
          }}
          navigation={{ prevEl: prevRef.current, nextEl: nextRef.current }}
          onInit={(s) => s.navigation.update()}
          // производительность
          loop={true}               // вместо loop (без клонов)
          resistanceRatio={0.5}
          threshold={6}                       // игнорируем мелкие дрожания
          speed={420}
          allowTouchMove
          watchOverflow
          preloadImages={false}
          lazyPreloadPrevNext={1}
          spaceBetween={14}
          slidesPerView={2.2}
          breakpoints={{
            320:  { slidesPerView: 1.6, spaceBetween: 8 },
            480:  { slidesPerView: 1.5,  spaceBetween: 10 },
            768:  { slidesPerView: 1.9,  spaceBetween: 12 },
            1150: { slidesPerView: 2.2,  spaceBetween: 14 },
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

        {/* стрелки (refs) */}
        <div className="absolute left-4 sm:left-6 bottom-[-15%] 4xl:bottom-[-12%] z-10 flex gap-8">
          <button ref={prevRef} className="transition hover:scale-105" aria-label="Предыдущий">
            <svg className="w-[30px] h-[30px] xs:h-auto xs:w-auto" viewBox="0 0 51 50" fill="none">
              <rect x="50.668" y="50" width="50" height="50" rx="25" transform="rotate(-180 50.668 50)" fill="#F7EFE5"/>
              <path d="M19.306 25L28.793 34.4871L27.4466 35.8657L16.5815 25L27.4466 14.1345L28.793 15.5131L19.306 25Z" fill="#967450"/>
            </svg>
          </button>

          <button ref={nextRef} className="transition hover:scale-105" aria-label="Следующий">
            <svg className="w-[30px] h-[30px] xs:h-auto xs:w-auto" viewBox="0 0 51 50" fill="none">
              <rect width="50" height="50" rx="25" fill="#F7EFE5"/>
              <path d="M32.03 25L22.543 15.5129L23.8893 14.1343L34.7544 25L23.8893 35.8655L22.543 34.4869L32.03 25Z" fill="#967450"/>
            </svg>
          </button>
        </div>
      </MotionConfig>

      {/* выравнивание высоты карточек */}
      <style jsx global>{`
        .equalize-swiper .swiper-wrapper { align-items: stretch; }
        .equalize-swiper .swiper-slide { height: auto; display: flex; }
        .translate-z-0 { transform: translateZ(0); }
      `}</style>
    </div>
  )
}

export default memo(PassesSlider)
