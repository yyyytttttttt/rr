'use client'
import { useMemo, useRef, useState } from 'react'
import Image from 'next/image'
import { Swiper, SwiperSlide } from 'swiper/react'
import { Pagination, Keyboard, Autoplay, A11y } from 'swiper/modules'
import { motion } from 'framer-motion'   // ← добавили

import 'swiper/css'
import 'swiper/css/pagination'

const slide = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { delayChildren: 0.12, staggerChildren: 0.06 }
  }
}
const fadeUp = {
  hidden: { opacity: 0, y: 14 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.25,1,0.5,1] } }
}
const line = {
  hidden: { opacity: 0, y: 12 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.8 } }
}
const imageIn = {
  hidden: { opacity: 0, scale: 1.03 },
  show:   { opacity: 1, scale: 1, transition: { duration: 0.7, ease: [0.25,1,0.8,1] } }
}

export default function NewsSwiper({
  items = [],
  autoplayMs = 6000,
  className = '',
}) {
  const swiperRef = useRef(null)
  const [playing, setPlaying] = useState(Boolean(autoplayMs))
  const [active, setActive] = useState(0)          // ← текущий слайд для анимаций

  const autoplay = useMemo(
    () => (autoplayMs ? { delay: autoplayMs, disableOnInteraction: false } : false),
    [autoplayMs]
  )

  if (!items.length) return null

  // Управление снизу (оставлено на будущее)
  const goPrev  = () => swiperRef.current?.slidePrev()
  const goNext  = () => swiperRef.current?.slideNext()
  const goFirst = () => swiperRef.current?.slideTo(0)
  const goLast  = () => swiperRef.current?.slideTo(items.length - 1)
  const toggleAutoplay = () => {
    const s = swiperRef.current
    if (!s?.autoplay) return
    if (s.autoplay.running) { s.autoplay.stop(); setPlaying(false) }
    else { s.autoplay.start(); setPlaying(true) }
  }

  return (
    <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[88%] mx-auto rounded-[16px] overflow-hidden bg-[#F4EDD7] ${className}`}>
      <Swiper
        modules={[Pagination, Keyboard, Autoplay, A11y]}
        slidesPerView={1}
        speed={550}
        keyboard={{ enabled: true }}
        autoplay={autoplay}
        pagination={{ clickable: true }}
        onSwiper={(s) => (swiperRef.current = s)}
        onInit={(s) => setActive(s.activeIndex)}                 // ← фикс начальной анимации
        onSlideChange={(s) => setActive(s.activeIndex)}          // ← триггер анимаций при смене
        className="newsSwiper"
      >
        {items.map((it, i) => (
          <SwiperSlide key={i} aria-roledescription="slide" aria-label={`${i + 1} из ${items.length}`}>
            {/* article просто стал motion.article — верстка та же */}
            <motion.article
              className="grid grid-cols-1 md:grid-cols-2 "
              variants={slide}
              initial="hidden"
              animate={active === i ? 'show' : 'hidden'}
            >
              {/* левая колонка */}
              <motion.div className="flex flex-col justify-center" variants={fadeUp}>
                <motion.div className="flex items-center gap-4 mb-4 text-[#636846]" variants={fadeUp}>
                  {it.tag && (
                    <span className="px-[2%] py-1 rounded-[7px] text-[20px] font-ManropeRegular border border-[#636846]">
                      {it.tag}
                    </span>
                  )}
                  {it.time && <span className="rounded-[7px] text-[20px] font-ManropeRegular">{it.time}</span>}
                </motion.div>

                {Array.isArray(it.title) ? (
                  <div className="text-[#636846] text-[clamp(0.875rem,0.55rem+1.625vw,2.5rem)] font-[Manrope-Bold] mb-4 flex flex-col">
                    {it.title.map((lineText, k) => (
                      <motion.span key={k} className="block" variants={line}>{lineText}</motion.span>
                    ))}
                  </div>
                ) : (
                  <motion.p className="text-[#7b5d44]/90 mb-5 max-w-[48ch] whitespace-pre-line" variants={fadeUp}>
                    {it.title}
                  </motion.p>
                )}

                {Array.isArray(it.excerpt) ? (
                  <div className="text-[#636846] mb-5 font-ManropeRegular text-[24px]">
                    {it.excerpt.map((lineText, k) => (
                      <motion.span key={k} className="block" variants={line}>{lineText}</motion.span>
                    ))}
                  </div>
                ) : (
                  <motion.p className="text-[#7b5d44]/90 mb-5 max-w-[48ch] whitespace-pre-line" variants={fadeUp}>
                    {it.excerpt}
                  </motion.p>
                )}

                {it.cta && (
                  <motion.a
                    href={it.href || '#'}
                    className="inline-flex w-fit items-center justify-center rounded-[5px] bg-[#7B5D44] text-[#F7EFE5] px-[5%] py-3 text-[20px] font-[Manrope-Regular] duration-700  hover:opacity-90 transition"
                    whileHover={{ scale: 1.03, y: -1 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {it.cta}
                  </motion.a>
                )}
              </motion.div>

              {/* правая колонка — мягкий zoom-in картинки */}
              <motion.div className="rounded-[16px] overflow-hidden bg-[#633F39]/10 ring-1 ring-black/5" variants={fadeUp}>
                <motion.div className="relative w-full pt-[56.25%]" variants={imageIn}>
                  {it.image ? (
                    <Image
                      src={it.image}
                      alt={it.title || 'изображение'}
                      fill
                      sizes="(max-width: 768px) 100vw, 50vw"
                      className="object-cover"
                      priority={i === 0}
                    />
                  ) : (
                    <div className="absolute inset-0 bg-[#6f4b45]" />
                  )}
                </motion.div>
              </motion.div>
            </motion.article>
          </SwiperSlide>
        ))}
      </Swiper>

      {/* стили пагинации — без изменений */}
      <style jsx global>{`
        .newsSwiper .swiper-pagination {
          right: 2%;
          left: auto;
          width: auto;
          bottom: 0.5%;
        }
        .newsSwiper .swiper-pagination-bullet {
          width: 16px; height: 16px; background: #c8a989;
          opacity: 1; border-radius: 9999px;
          transition: width 0.25s ease;
          margin: 0 4px !important;
        }
        .newsSwiper .swiper-pagination-bullet-active {
          width: 24px; background: #967450;
        }
      `}</style>
    </div>
  )
}
