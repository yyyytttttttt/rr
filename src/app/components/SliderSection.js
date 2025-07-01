'use client'
import { useImperativeHandle, forwardRef, useRef } from 'react'
import { Swiper, SwiperSlide } from 'swiper/react'
import 'swiper/css'

const SliderSection = forwardRef(({ images }, ref) => {
  const swiperRef = useRef(null)

  useImperativeHandle(ref, () => ({
    slideNext: () => swiperRef.current?.slideNext(),
    slidePrev: () => swiperRef.current?.slidePrev(),
  }))

  return (
    <div className="h-screen w-screen">
      <Swiper
        onSwiper={(swiper) => (swiperRef.current = swiper)}
        spaceBetween={50}
        speed={700}
        loop={true}
        
        slidesPerView={1}
        className="h-full w-full"
      >
        {images.map((src, idx) => (
          <SwiperSlide key={idx}>
            <img 
              src={src}
              alt={`Slide ${idx}`}
              className="h-full w-full object-cover"
            />
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  )
})

export default SliderSection
