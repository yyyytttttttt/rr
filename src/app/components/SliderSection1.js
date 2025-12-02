'use client'
import { memo, useEffect } from 'react'
import { Swiper, SwiperSlide } from 'swiper/react'
import { Navigation } from 'swiper/modules'
import 'swiper/css'
import 'swiper/css/navigation'

const isVideo = (src) => /\.(mp4|webm|ogg)$/i.test(src)

function SliderSection({ images = [], overlays = [] }) {
  const pauseAllVideos = (rootEl) => {
    if (!rootEl) return
    rootEl.querySelectorAll('video').forEach(v => {
      try { v.pause() } catch {}
    })
  }

  const playActiveVideos = (s) => {
    const active = s?.slides?.[s.activeIndex]
    if (!active) return
    active.querySelectorAll('video').forEach(v => {
      try { v.muted = true; v.play().catch(() => {}) } catch {}
    })
  }

  // Подстраховка: ставим/снимаем паузу при смене видимости вкладки
  useEffect(() => {
    const onVis = () => {
      const vids = document.querySelectorAll('.slider-root video')
      vids.forEach(v => {
        try { document.hidden ? v.pause() : null } catch {}
      })
    }
    document.addEventListener('visibilitychange', onVis)
    return () => document.removeEventListener('visibilitychange', onVis)
  }, [])

  return (
    <div className="slider-root relative h-app min-h-0 flex-none overflow-hidden w-screen">
      <Swiper
        modules={[Navigation]}
        navigation={{
          nextEl: '.swiper-button-custom-next-2',
          prevEl: '.swiper-button-custom-prev-2',
        }}
        onBeforeInit={(s) => {
          s.params.navigation.prevEl = '.swiper-button-custom-prev-2'
          s.params.navigation.nextEl = '.swiper-button-custom-next-2'
        }}
        onInit={(s) => { pauseAllVideos(s.el); playActiveVideos(s) }}
        onSlideChange={(s) => { pauseAllVideos(s.el); playActiveVideos(s) }}

        // плавность и отсутствие "миганий"
        loopAdditionalSlides={2}
        watchSlidesProgress
        spaceBetween={0}
        speed={500}
        slidesPerView={1}
        className="h-full w-full"
      >
        {images.map((src, idx) => (
          <SwiperSlide key={src || idx}>
            <div className="relative h-full w-full">
              {isVideo(src) ? (
                <video
                  className="absolute inset-0 h-full w-full object-cover"
                  muted
                  playsInline
                  loop
                  preload="metadata"
                >
                  <source
                    src={src}
                    type={
                      src.toLowerCase().endsWith('.webm')
                        ? 'video/webm'
                        : src.toLowerCase().endsWith('.ogg')
                        ? 'video/ogg'
                        : 'video/mp4'
                    }
                  />
                </video>
              ) : (
                <img
                  src={src}
                  alt={`Slide ${idx + 1}`}
                  // для первого слайда ускоряем появление, остальные — пусть браузер решает
                  loading={idx === 0 ? 'eager' : 'lazy'}
                  className="absolute inset-0 h-full w-full object-cover"
                />
              )}

              {overlays?.[idx] && (
                <div className="absolute inset-0 z-10 pointer-events-none will-change-transform">
                  {overlays[idx]}
                </div>
              )}
            </div>
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  )
}

export default memo(SliderSection)
