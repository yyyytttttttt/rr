'use client'

import React, { useMemo, useRef, useState, useCallback, useEffect, memo } from 'react'
import { Swiper, SwiperSlide } from 'swiper/react'
import { Mousewheel, Keyboard } from 'swiper/modules'
import 'swiper/css'

import TopTitle from './components/glav/TopTitle'
import LayoutOverlay from './components/LayoutOverlay'
import { slides } from './components/glav/slides.dataGlav'
import SlideRenderer from './components/glav/SlideRenderer'

const LazySlide = memo(function LazySlide({ slide, shouldRender }) {
  if (!shouldRender) {
    return <div className="h-app w-screen bg-[#FFFCF3]" />
  }
  return <SlideRenderer slide={slide} />
})

const TOTAL = slides.length

export default function FullPageFeed() {
  const texts = useMemo(
    () => [
      'НОВАЯ Я', 'НОВОСТИ', 'ПРОПУСК К ЗДОРОВЬЮ', 'УСЛУГИ',
      'НАША КОМАНДА', 'ГАЛЕРЕЯ', 'ЛИЧНЫЙ КАБИНЕТ',
      'ПРИЛОЖЕНИЕ',
    ],
    []
  )

  const swiperRef = useRef(null)
  const [active, setActive] = useState(0)
  const [rendered, setRendered] = useState(() => new Set([0, 1, 2]))

  // null = ещё не определили, ждём mount
  const [isTouch, setIsTouch] = useState(null)

  useEffect(() => {
    setIsTouch('ontouchstart' in window || navigator.maxTouchPoints > 0)
  }, [])

  const handleSlideChange = useCallback((s) => {
    const idx = s.activeIndex
    setActive(idx)
    setRendered(prev => {
      const next = new Set(prev)
      if (idx > 0) next.add(idx - 1)
      next.add(idx)
      if (idx < TOTAL - 1) next.add(idx + 1)
      return next.size === prev.size ? prev : next
    })
  }, [])

  // Pre-render в idle
  useEffect(() => {
    const sch = typeof requestIdleCallback === 'function'
      ? requestIdleCallback : (cb) => setTimeout(cb, 200)
    const can = typeof cancelIdleCallback === 'function'
      ? cancelIdleCallback : clearTimeout
    const id = sch(() => {
      setRendered(prev => {
        if (prev.size === TOTAL) return prev
        const next = new Set(prev)
        for (let i = 0; i < TOTAL; i++) next.add(i)
        return next
      })
    }, { timeout: 3000 })
    return () => can(id)
  }, [])

  // Ждём определения устройства перед рендером Swiper
  if (isTouch === null) {
    return (
      <div className="relative">
        <div className="h-app w-screen bg-[#FFFCF3]" />
      </div>
    )
  }

  return (
    <div className="relative">
      <TopTitle active={active} texts={texts} />

      <div className="relative w-screen h-app overflow-hidden">
        <Swiper
          key={isTouch ? 'touch' : 'desktop'}
          direction="vertical"
          slidesPerView={1}
          // ── Touch (iOS/Android): нативный scroll-snap, ноль лагов ──
          // ── Desktop: JS-анимация с контролем скорости ──
          cssMode={isTouch}
          {...(!isTouch && {
            speed: 800,
            resistanceRatio: 0.65,
            threshold: 5,
            longSwipesMs: 200,
            longSwipesRatio: 0.2,
            touchAngle: 50,
            followFinger: true,
            allowTouchMove: true,
            touchReleaseOnEdges: true,
            passiveListeners: true,
            touchStartPreventDefault: false,
          })}
          mousewheel={isTouch ? true : {
            forceToAxis: true,
            releaseOnEdges: true,
            sensitivity: 0.8,
          }}
          keyboard={{ enabled: true, onlyInViewport: true }}
          onSwiper={(s) => (swiperRef.current = s)}
          onSlideChange={handleSlideChange}
          modules={[Mousewheel, Keyboard]}
          className="h-full"
        >
          {slides.map((slide, index) => (
            <SwiperSlide key={slide.id} className="!h-auto p-0 m-0">
              <div className="h-app w-screen flex-none relative">
                <LazySlide slide={slide} shouldRender={rendered.has(index)} />
              </div>
            </SwiperSlide>
          ))}
        </Swiper>

        <LayoutOverlay active={active} />
      </div>
    </div>
  )
}
