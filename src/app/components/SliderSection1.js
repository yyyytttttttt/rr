'use client'
import { Swiper, SwiperSlide } from 'swiper/react'
import 'swiper/css'
import { Navigation } from 'swiper/modules';
import 'swiper/css/navigation';
import { useState } from 'react'
import Image from 'next/image'

const isVideo = (src) => /\.(mp4|webm|ogg)$/i.test(src)

export default function SliderSection({ images = [], overlays = [] }) {
 

  const pauseAllVideos = (rootEl) => {
    if (!rootEl) return
    rootEl.querySelectorAll('video').forEach((v) => {
      try { v.pause(); v.currentTime = 0 } catch {}
    })
  }

  const playActiveVideos = (s) => {
    const active = s?.slides?.[s.activeIndex]
    if (!active) return
    active.querySelectorAll('video').forEach((v) => {
      try { v.muted = true; v.play().catch(() => {}) } catch {}
    })
  }

  const handleInit = (s) => {
    pauseAllVideos(s.el)
    playActiveVideos(s)
  }

  const handleChange = (s) => {
    pauseAllVideos(s.el)
    playActiveVideos(s)
  }

  

  return  (
    <div className="relative h-screen w-screen">
      <Swiper
        modules={[Navigation]}
        // ВАЖНО: сохраняем инстанс и инициализируем
        navigation={{
          nextEl: '.swiper-button-custom-next-2',
          prevEl: '.swiper-button-custom-prev-2',
        }}                 // оставить пустым
        onBeforeInit={(s) => {          // 👈 привязать селекторы ДО инициализации
          s.params.navigation.prevEl = '.swiper-button-custom-prev-2'
          s.params.navigation.nextEl = '.swiper-button-custom-next-2'
        }}
        onInit={(s) => {                // твоя логика запуска видео на первом слайде
          pauseAllVideos(s.el)
          playActiveVideos(s)
        }}
        
        
        onSlideChange={handleChange}
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
                  alt={`Slide ${idx + 1}`}
                  loading="lazy"
                  className="absolute inset-0 h-full w-full object-cover"
                />
              )}

              {overlays?.[idx] && (
                <div className="pointer-events-none absolute inset-0">
                  {overlays[idx]}
                </div>
              )}
            </div>
          </SwiperSlide>
        ))}
      </Swiper>
      {/* Bottom Nav */}
            <div className="absolute max-w-[1410px] mx-auto bottom-12 left-1/2 transform -translate-x-1/2 w-3/4 flex items-center justify-between bg-[#e5dccb] px-2 py-1 rounded-full z-50">
              <button className=" swiper-button-custom-prev-2
           w-[5.4%] sm:w-[3.2%] cursor-pointer
          transition-all duration-700 ease-[cubic-bezier(0.25,1,0.5,1)]
          hover:scale-110 hover:opacity-95 active:scale-95
          before:content-[''] before:absolute before:inset-0 
          before:rounded-full before:bg-gradient-to-r 
          before:from-[#967450]/40 before:to-[#967450]/10
          before:blur-lg before:opacity-0 hover:before:opacity-100 
          before:transition-all before:duration-700
        " >
                <svg className='h-auto w-full' xmlns="http://www.w3.org/2000/svg" width="50" height="50" viewBox="0 0 50 50" fill="none">
              <rect x="50" y="50" width="50" height="50" rx="25" transform="rotate(-180 50 50)" fill="#F4EDD7"/>
              <path d="M18.349 25.0001L27.8359 34.4871L26.4896 35.8657L15.6245 25.0001L26.4896 14.1345L27.8359 15.5131L18.349 25.0001Z" fill="#967450"/>
              </svg>
              </button>
              <div className="w-[80%] sm:w-[50%] flex justify-between">
               <button
        className="
          relative w-[10%] sm:w-[7.4%] cursor-pointer
          transition-all duration-700 ease-[cubic-bezier(0.25,1,0.5,1)]
          hover:scale-110 hover:opacity-95 active:scale-95
          before:content-[''] before:absolute before:inset-0 
          before:rounded-xl before:bg-gradient-to-r 
          before:from-[#A77C66]/40 before:to-[#A77C66]/10
          before:blur-lg before:opacity-0 hover:before:opacity-100 
          before:transition-all before:duration-700
        "
      >
        <svg 
          className="relative z-10 w-full h-auto 
            drop-shadow-[0_0_6px_#A77C6680] 
            hover:drop-shadow-[0_0_12px_#A77C66]"
          xmlns="http://www.w3.org/2000/svg" 
          width="61" 
          height="60" 
          viewBox="0 0 61 60" 
          fill="none"
        >
          <path 
            d="M16.3643 27.6396L30.5067 13.4972L44.6491 27.6396V41.782C44.6491 44.1391 42.2921 46.4961 39.935 46.4961H21.0785C18.7214 46.4961 16.3643 44.1391 16.3643 41.782V27.6396Z" 
            stroke="#A77C66" 
            strokeWidth="1.7428" 
            strokeLinejoin="round"
          />
        </svg>
      </button>
                <button  className="
          relative w-[10%] sm:w-[7.4%] cursor-pointer
          transition-all duration-700 ease-[cubic-bezier(0.25,1,0.5,1)]
          hover:scale-110 hover:opacity-95 active:scale-95
          before:content-[''] before:absolute before:inset-0 
          before:rounded-xl before:bg-gradient-to-r 
          before:from-[#A77C66]/40 before:to-[#A77C66]/10
          before:blur-lg before:opacity-0 hover:before:opacity-100 
          before:transition-all before:duration-700
        ">
                  <svg className="relative z-10 w-full h-auto 
            drop-shadow-[0_0_6px_#A77C6680] 
            hover:drop-shadow-[0_0_12px_#A77C66]" xmlns="http://www.w3.org/2000/svg" width="61" height="60" viewBox="0 0 61 60" fill="none">
                    <path d="M10.5408 16.6905H27.1778L30.5052 21.3489H50.4697V43.3098H10.5408V16.6905Z" stroke="#A77C66" stroke-width="1.7428" stroke-linejoin="round"/>
                    </svg>
      
                </button>
               <button
        className="
          relative w-[10%] sm:w-[7.4%] flex-shrink-0 scale-[1.5] cursor-pointer
          transition-all duration-700 ease-[cubic-bezier(0.25,1,0.5,1)]
          hover:scale-[1.65] hover:opacity-95 active:scale-[1.4]
          before:content-[''] before:absolute before:inset-0
          before:rounded-full before:bg-gradient-to-r 
          before:from-[#A77C66]/40 before:to-[#A77C66]/10
          before:blur-lg before:opacity-0 hover:before:opacity-100
          before:transition-all before:duration-700
        "
      >
        <Image 
          src="/images/pl.svg" 
          alt="Зв" 
          width={60} 
          height={60}
          className="relative z-10 drop-shadow-[0_0_6px_#A77C6680] hover:drop-shadow-[0_0_12px_#A77C66]"
        />
      </button>
                <button  className="
          relative w-[10%] sm:w-[7.4%] cursor-pointer
          transition-all duration-700 ease-[cubic-bezier(0.25,1,0.5,1)]
          hover:scale-110 hover:opacity-95 active:scale-95
          before:content-[''] before:absolute before:inset-0 
          before:rounded-xl before:bg-gradient-to-r 
          before:from-[#A77C66]/40 before:to-[#A77C66]/10
          before:blur-lg before:opacity-0 hover:before:opacity-100 
          before:transition-all before:duration-700
        ">
                  <svg className="relative z-10 w-full h-auto 
            drop-shadow-[0_0_6px_#A77C6680] 
            hover:drop-shadow-[0_0_12px_#A77C66]" xmlns="http://www.w3.org/2000/svg" width="61" height="60" viewBox="0 0 61 60" fill="none">
                    <path d="M30.5004 29.9999C36.7136 29.9999 41.7504 24.9631 41.7504 18.7499C41.7504 12.5367 36.7136 7.49994 30.5004 7.49994C24.2872 7.49994 19.2504 12.5367 19.2504 18.7499C19.2504 24.9631 24.2872 29.9999 30.5004 29.9999Z" stroke="#A77C66" stroke-width="1.74598"/>
                    <path d="M15.4998 48.7498C15.4998 40.4651 22.2151 33.7498 30.4998 33.7498C38.7844 33.7498 45.4998 40.4651 45.4998 48.7498" stroke="#A77C66" stroke-width="1.74598" stroke-linecap="round"/>
                    </svg>
              </button>
                <button  className=" 
          relative w-[10%] sm:w-[7.4%] cursor-pointer
          transition-all duration-700 ease-[cubic-bezier(0.25,1,0.5,1)]
          hover:scale-110 hover:opacity-95 active:scale-95
          before:content-[''] before:absolute before:inset-0 
          before:rounded-xl before:bg-gradient-to-r 
          before:from-[#A77C66]/40 before:to-[#A77C66]/10
          before:blur-lg before:opacity-0 hover:before:opacity-100 
          before:transition-all before:duration-700
        ">
                  <svg className="relative z-10 w-full h-auto 
            drop-shadow-[0_0_6px_#A77C6680] 
            hover:drop-shadow-[0_0_12px_#A77C66]" xmlns="http://www.w3.org/2000/svg" width="61" height="60" viewBox="0 0 61 60" fill="none">
                <path d="M13.547 18.7947H48.3624C50.1031 18.7947 51.2636 19.9552 51.2636 21.696V39.1037C51.2636 40.8445 50.1031 42.005 48.3624 42.005H28.0534L22.2509 47.8075V42.005H13.547C11.8063 42.005 10.6458 40.8445 10.6458 39.1037V21.696C10.6458 19.9552 11.8063 18.7947 13.547 18.7947Z" stroke="#A77C66" stroke-width="1.7428" stroke-linejoin="round"/>
                </svg>
                </button>
              </div>
              <button
        className=" swiper-button-custom-next-2
          relative w-[5.4%] sm:w-[3.2%] cursor-pointer
          transition-all duration-700 ease-[cubic-bezier(0.25,1,0.5,1)]
          hover:scale-110 hover:opacity-95 active:scale-95
          before:content-[''] before:absolute before:inset-0 
          before:rounded-full before:bg-gradient-to-r 
          before:from-[#967450]/40 before:to-[#967450]/10
          before:blur-lg before:opacity-0 hover:before:opacity-100 
          before:transition-all before:duration-700
        "
        
      >
        <svg className='h-auto w-full' xmlns="http://www.w3.org/2000/svg" width="50" height="50" viewBox="0 0 50 50" fill="none">
<rect width="50" height="50" rx="25" fill="#F4EDD7"/>
<path d="M31.651 24.9998L22.1641 15.5128L23.5104 14.1342L34.3755 24.9998L23.5104 35.8654L22.1641 34.4868L31.651 24.9998Z" fill="#967450"/>
</svg>
      </button>
            </div>
    </div>
  )
}
