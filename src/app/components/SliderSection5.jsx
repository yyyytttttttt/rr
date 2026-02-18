'use client'
import { useMemo, useRef } from 'react'
import Image from 'next/image'
import React from 'react'
import { Swiper, SwiperSlide } from 'swiper/react'
import { Pagination, Navigation } from 'swiper/modules'
import { useRouter } from 'next/navigation'
import 'swiper/css'
import 'swiper/css/pagination'
import 'swiper/css/navigation'

const SliderSection5 = () => {
  const router = useRouter()
    const projects = useMemo(
    () => [
      { title: 'Инъекционная косметология', subTitile:'Врач-косметолог,',subTitile1:'дерматовенеролог, трихолог', image: '/images/us10.png' },
      { title: 'Инъекционная косметология', subTitile:'Врач-косметолог,',subTitile1:'дерматовенеролог, трихолог', image: '/images/us10.png' },
      { title: 'Инъекционная косметология', subTitile:'Врач-косметолог,',subTitile1:'дерматовенеролог, трихолог', image: '/images/us10.png' },
      { title: 'Инъекционная косметология', subTitile:'Врач-косметолог,',subTitile1:'дерматовенеролог, трихолог', image: '/images/us10.png' },
      { title: 'Инъекционная косметология', subTitile:'Врач-косметолог,',subTitile1:'дерматовенеролог, трихолог', image: '/images/us10.png' },
      { title: 'Инъекционная косметология', subTitile:'Врач-косметолог,',subTitile1:'дерматовенеролог, трихолог', image: '/images/us10.png' },
      { title: 'Инъекционная косметология', subTitile:'Врач-косметолог,',subTitile1:'дерматовенеролог, трихолог', image: '/images/us10.png' },
      { title: 'Инъекционная косметология', subTitile:'Врач-косметолог,',subTitile1:'дерматовенеролог, трихолог', image: '/images/us10.png' },
      { title: 'Инъекционная косметология', subTitile:'Врач-косметолог,',subTitile1:'дерматовенеролог, трихолог', image: '/images/us10.png' },
      { title: 'Инъекционная косметология', subTitile:'Врач-косметолог,',subTitile1:'дерматовенеролог, трихолог', image: '/images/us10.png' },
    ],
    []
  )
  return (
    <div className=' relative z-10 w-full h-app flex flex-col items-center justify-center px-4'>
         <Swiper
        className="  w-full mb-4  "
        modules={[Pagination, Navigation]}
        loop
        grabCursor={true}
        centeredSlides
        watchSlidesProgress
        speed={650}
        spaceBetween={20}
        slidesPerView={5}
        breakpoints={{
          320: { slidesPerView: 1.1, spaceBetween: 6 },
          480: { slidesPerView: 1.25, spaceBetween: 20 },
          768: { slidesPerView: 2, spaceBetween: 24 },
          1220: { slidesPerView: 3, spaceBetween: 12 },
          1836: { slidesPerView: 4, spaceBetween: 20 },
        }}
        pagination={{
          el: '.projects-pagination',
          clickable: true,
          renderBullet: (index, className) =>
            `<span class="${className} projects-bullet"></span>`,
        }}
        navigation={{
          prevEl: '.nav-slide-4-prev',
          nextEl: '.nav-slide-4-next',
        }}
        onBeforeInit={(sw) => {
          sw.params.navigation.prevEl = '.nav-slide-4-prev'
          sw.params.navigation.nextEl = '.nav-slide-4-next'
        }}
        onInit={(sw) => {
          sw.navigation.init()
          sw.navigation.update()
        }}
      >
        {projects.map((proj, index) => (
          <SwiperSlide key={index} className="!h-auto pb-2 xs:pb-0">
            <article className=" relative overflow-hidden shadow-xl  mx-auto rounded-3xl transition-all duration-300">
              {/* Адаптивная высота без fixed: через aspect-ratio */}
              <div className="relative w-full aspect-5/4">
                <Image
                  src={proj.image}
                  alt={proj.title}
                  fill
                  sizes="(max-width: 480px) 92vw, (max-width: 1024px) 48vw, 32vw"
                  quality={100}
                  className="object-cover transition-transform duration-500 "
                  priority={index === 0}
                />
              </div>

              {/* Оверлей */}
              <div className="pointer-events-none absolute inset-0  from-transparent via-black/30 to-black/70" />

              {/* Подпись */}
              <div className=" z-20">
                <div className="px-6 py-[8%]  flex flex-col  text-[#636846]  text-start  ">
                  <div className=''>
                      <div className='font-ManropeBold text-[clamp(1rem,0.7692rem+1.0256vw,2rem)]'>{proj.title}</div>
                      <div className='font-ManropeRegular text-[clamp(0.75rem,0.5769rem+0.7692vw,1.5rem)]'>
                          <div >{proj.subTitile}</div>
                          <div >{proj.subTitile1}</div>
                      </div>
                  </div>
                </div>
              </div>
              <div className='w-full'>
                  <div className='z-20 absolute top-4 left-2'>
                    <p className='text-[#967450] bg-[#FFFCF3] px-4 py-2 text-[clamp(0.6875rem,0.5577rem+0.5769vw,1.25rem)]'>5 лет опыта</p>
                  </div>
                  <div className='w-[7%] z-20 absolute top-4 right-2'>
                      <div className=' w-full h-auto'>
                        <svg className='w-full h-auto' xmlns="http://www.w3.org/2000/svg" width="52" height="52" viewBox="0 0 52 52" fill="none">
                        <rect width="52" height="52" rx="26" fill="#F7EFE5"/>
                        <path d="M20 32L32 20M32 20H22.25M32 20V29.75" stroke="#967450" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </div>
                  </div>
              </div>
            </article>
          </SwiperSlide>
        ))}
      </Swiper>
      <div className='w-full flex justify-center'>
        <button onClick={() => router.push('/Team/')}  className='text-white  bg-[#636846] mt-4 font-ManropeRegular text-[clamp(0.75rem,0.6346rem+0.5128vw,1.25rem)] cursor-pointer transition-all duration-500 hover:scale-105 px-6 py-3 rounded-[5px]'>
            Перейти в раздел
        </button>

      </div>
    </div>
  )
}

export default SliderSection5
