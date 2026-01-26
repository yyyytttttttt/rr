'use client'

import React, { useMemo, useRef, useState, useCallback, memo } from 'react'
import { Swiper, SwiperSlide } from 'swiper/react'
import { Mousewheel, Keyboard } from 'swiper/modules'
import 'swiper/css'

import TopTitle from './components/glav/TopTitle'
import LayoutOverlay from './components/LayoutOverlay'
import { slides } from './components/glav/slides.dataGlav'
import SlideRenderer from './components/glav/SlideRenderer'

// Ленивый слайд — рендерит контент только если рядом с активным
const LazySlide = memo(function LazySlide({ slide, index, activeIndex }) {
  // Рендерим только текущий слайд и соседние
  const isNear = Math.abs(index - activeIndex) <= 1

  if (!isNear) {
    return <div className="h-app w-screen bg-[#FFFCF3]" />
  }

  return <SlideRenderer slide={slide} />
})

export default function FullPageSwiper() {
  const texts = useMemo(
    () => [
      'Новая я', 'новости', 'пропуск к здоровью', 'услуги',
      'Наша команда', 'галерея', 'Личный кабинет',
      'Контакты', 'приложение', 'специалисты', 'онлайн-оплата',
    ],
    []
  )

  const swiperRef = useRef(null)
  const [active, setActive] = useState(0)

  const handleSlideChange = useCallback((s) => {
    setActive(s.activeIndex)
  }, [])

  return (
    <div className="relative">
      <TopTitle active={active} texts={texts} />

      <div className="relative w-screen h-app overflow-hidden overscroll-none touch-pan-y">
        <Swiper
          direction="vertical"
          slidesPerView={1}
          speed={800}
          resistanceRatio={0.85}
          threshold={5}
          longSwipesMs={150}
          longSwipesRatio={0.15}
          touchAngle={50}
          followFinger={true}
          allowTouchMove={true}
          touchReleaseOnEdges={true}
          passiveListeners={true}
          touchStartPreventDefault={false}
          mousewheel={{
            forceToAxis: true,
            releaseOnEdges: true,
          }}
          keyboard={{ enabled: true, onlyInViewport: true }}
          onSwiper={(s) => (swiperRef.current = s)}
          onSlideChange={handleSlideChange}
          modules={[Mousewheel, Keyboard]}
          className="h-full"
        >
          {slides.map((slide, index) => (
            <SwiperSlide key={`${slide.id}-${index}`} className="!h-auto p-0 m-0">
              <div className="h-app w-screen flex-none relative">
                <LazySlide slide={slide} index={index} activeIndex={active} />
              </div>
            </SwiperSlide>
          ))}
        </Swiper>

        <LayoutOverlay active={active} />

        <style jsx global>{`
          .swiper, .swiper-wrapper, .swiper-slide {
            -webkit-backface-visibility: hidden;
            backface-visibility: hidden;
          }
          html, body {
            overscroll-behavior: none;
          }
        `}</style>
      </div>
    </div>
  )
} 