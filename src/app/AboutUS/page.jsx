'use client'

import React, { useMemo, useRef, useState } from 'react'
import { Swiper, SwiperSlide } from 'swiper/react'
import { Mousewheel, Keyboard } from 'swiper/modules'
import 'swiper/css'

import LayoutOverlay2 from '../components/LayoutOverlay2'
import { aboutUsSlides } from '../components/aboutUs/slides.dataAboutUs'
import SlideRendererAboutUs from '../components/aboutUs/SlideRendererAboutUs'

export default function AboutUsPage() {
  const texts = useMemo(
    () => [
      { tit: 'О НАС' },
      { tit: 'Наш подход' },
      { tit: 'Что нас отличает' },
      { tit: 'И главное' },
    ],
    []
  )

  const swiperRef = useRef(null)
  const [active, setActive] = useState(0)

  const overlayProps = {
    next: () => swiperRef.current?.slideNext(),
    prev: () => swiperRef.current?.slidePrev(),
    goTo: (index) => swiperRef.current?.slideTo(index),
    currentPage: active,
    totalPages: aboutUsSlides.length,
    text: texts[active],
  }

  return (
    <div className="relative">
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
          {aboutUsSlides.map((slide) => (
            <SwiperSlide key={slide.id} className="!h-auto p-0 m-0">
              <div className="h-app w-screen flex-none relative will-change-transform translate-z-0">
                <SlideRendererAboutUs slide={slide} />
              </div>
            </SwiperSlide>
          ))}
        </Swiper>

        <LayoutOverlay2 {...overlayProps} />

        <style jsx global>{`
          .translate-z-0 { transform: translateZ(0); }
          .swiper, .swiper-wrapper, .swiper-slide { backface-visibility: hidden; }
          html, body { overscroll-behavior: none; }
        `}</style>
      </div>
    </div>
  )
}
