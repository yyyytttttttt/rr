'use client'

import React, { useMemo, useRef, useState } from 'react'
import { Swiper, SwiperSlide } from 'swiper/react'
import { Mousewheel, Keyboard } from 'swiper/modules'
import 'swiper/css'

import TopTitle from './components/glav/TopTitle'
import LayoutOverlay from './components/LayoutOverlay'
import { slides } from './components/glav/slides.dataGlav'
import SlideRenderer from './components/glav/SlideRenderer'
import { useSession } from 'next-auth/react'
import Navigation from './components/Navigation'

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

  return (
    <div className="relative">
      <TopTitle active={active} texts={texts} />

      {/* ФИКС: высота экрана вместо h-full */}
      <div className="relative w-screen h-app overflow-hidden overscroll-none touch-pan-y">
        <Swiper
          direction="vertical"
          slidesPerView={1}
          speed={1000}
          resistanceRatio={0.5}
          threshold={6}
          longSwipesMs={220}
          longSwipesRatio={0.1}
          touchAngle={45}
          followFinger
          allowTouchMove
          mousewheel={{ forceToAxis: true, releaseOnEdges: true }}
          keyboard={{ enabled: true, onlyInViewport: true }}
          onSwiper={(s) => (swiperRef.current = s)}
          onSlideChange={(s) => setActive(s.activeIndex)}
          modules={[Mousewheel, Keyboard]}
          className="h-full will-change-transform"
        >
          {slides.map((slide) => (
            <SwiperSlide key={slide.id} className="!h-auto p-0 m-0">
              <div className="h-app w-screen flex-none relative will-change-transform translate-z-0">
                <SlideRenderer slide={slide} />
              </div>
            </SwiperSlide>
          ))}
        </Swiper>

        <LayoutOverlay active={active} />

        <style jsx global>{`
          .translate-z-0 { transform: translateZ(0); }
          .swiper, .swiper-wrapper, .swiper-slide { backface-visibility: hidden; }
          html, body { overscroll-behavior: none; }
        `}</style>
      </div>
    </div>
  )
}
