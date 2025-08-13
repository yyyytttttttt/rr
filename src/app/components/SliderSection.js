'use client'
import { useImperativeHandle, forwardRef, useRef } from 'react'
import { Swiper, SwiperSlide } from 'swiper/react'
import 'swiper/css'

const isVideo = (src) => /\.(mp4|webm|ogg)$/i.test(src)

const SliderSection = forwardRef(({ images }, ref) => {
  const swiperRef = useRef(null)

  useImperativeHandle(ref, () => ({
    slideNext: () => swiperRef.current?.slideNext(),
    slidePrev: () => swiperRef.current?.slidePrev(),
  }))

  // Автоплей только у активного слайда (важно при loop)
  const handleSlideChange = (swiper) => {
    // Поставить на паузу ВСЕ видео на всех слайдах (включая клоны)
    swiper.el.querySelectorAll('video').forEach(v => {
      v.pause()
      v.currentTime = 0
    })
    // Запустить видео на активном
    const active = swiper.slides[swiper.activeIndex]
    if (!active) return
    active.querySelectorAll('video').forEach(v => {
      v.muted = true            // для автоплея на мобилках
      v.playsInline = true      // для iOS
      v.play().catch(() => {})  // игнорируем блокировку автоплея
    })
  }

  return (
    <div className="h-screen w-screen">
      <Swiper
        onSwiper={(swiper) => {
          swiperRef.current = swiper
          handleSlideChange(swiper) // запустить видео на первом активном
        }}
        onSlideChange={handleSlideChange}
        spaceBetween={50}
        speed={700}
        loop
        slidesPerView={1}
        className="h-full w-full"
      >
        {images.map((src, idx) => (
          <SwiperSlide key={idx}>
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
                  alt={`Slide ${idx}`}
                  loading="lazy"
                  className="absolute inset-0 h-full w-full object-cover"
                />
              )}
            </div>
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  )
})

export default SliderSection
