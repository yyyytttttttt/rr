'use client'
import React, { useState, useEffect, useMemo } from 'react'
import { motion } from 'framer-motion'

import StaticSection3 from '../components/SliderSection3'
import LayoutOverlay2 from '../components/LayoutOverlay2'
import { usePagedScroll } from '../hooks/usePagedScroll'
import Image from 'next/image'

// мини-хук
function useIsMobile(maxWidth = 480) {
  const [isMobile, setIsMobile] = useState(false)
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth <= maxWidth)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [maxWidth])
  return isMobile
}

export default function FullPageScroll() {
  const isMobile = useIsMobile(480)

  // ВАЖНО: один цельный массив без повторов и лишних "] />"
  const sections = useMemo(() => ([
    

    <StaticSection3 key="2" src="">
         <div>
             <div className='absolute top-1/2 left-[12%] -translate-y-1/2 rounded-[20px]
             
                                '>
                     <p className='text-[#636846] text-[clamp(0.875rem,0.55rem+1.625vw,2.5rem)] font-[Manrope-Bold] mb-4 flex flex-col'>
              <span>Мы — не просто сервис.</span>
              <span>Мы пространство для восстановления</span>
                     </p>
                     <p className='text-[clamp(0.75rem,0.65rem+0.5vw,1.25rem)] font-[Manrope-Regular] flex flex-col mb-4 text-[#636846]'>
              <span>«Новая Я» — это место, где технологии и забота работают вместе.</span>
              <span>Здесь нет давления и стандартов, которым нужно соответствовать.</span>
              <span>и потребностями.</span>
              <span>Мы создаём маршруты, которые помогают вернуться к себе —</span>
              <span>через уход, внимание, осознанность и поддержку.</span>
              <span>Каждый путь в «Новой Я» — это возможность услышать себя,</span>
              <span>почувствовать тело, восстановить ритмы, не меняя себя — а принимая.</span>
                     </p>
                     <div className='flex gap-4'>
             
              <div className=' flex'>
                                <div className='flex items-center gap-4'>
                                    
                                        <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48" fill="none">
                                                        <path d="M27 3.375H21C17.9179 3.37847 14.9631 4.60436 12.7837 6.78372C10.6044 8.96308 9.37847 11.9179 9.375 15V33C9.37847 36.0821 10.6044 39.0369 12.7837 41.2163C14.9631 43.3956 17.9179 44.6215 21 44.625H27C30.0821 44.6215 33.0369 43.3956 35.2163 41.2163C37.3956 39.0369 38.6215 36.0821 38.625 33V15C38.6215 11.9179 37.3956 8.96308 35.2163 6.78372C33.0369 4.60436 30.0821 3.37847 27 3.375ZM36.375 33C36.372 35.4855 35.3833 37.8683 33.6258 39.6258C31.8683 41.3833 29.4855 42.372 27 42.375H21C18.5145 42.372 16.1317 41.3833 14.3742 39.6258C12.6167 37.8683 11.628 35.4855 11.625 33V15C11.628 12.5145 12.6167 10.1317 14.3742 8.37416C16.1317 6.61665 18.5145 5.62798 21 5.625H27C29.4855 5.62798 31.8683 6.61665 33.6258 8.37416C35.3833 10.1317 36.372 12.5145 36.375 15V33ZM25.125 12V21C25.125 21.2984 25.0065 21.5845 24.7955 21.7955C24.5845 22.0065 24.2984 22.125 24 22.125C23.7016 22.125 23.4155 22.0065 23.2045 21.7955C22.9935 21.5845 22.875 21.2984 22.875 21V12C22.875 11.7016 22.9935 11.4155 23.2045 11.2045C23.4155 10.9935 23.7016 10.875 24 10.875C24.2984 10.875 24.5845 10.9935 24.7955 11.2045C25.0065 11.4155 25.125 11.7016 25.125 12Z" fill="#636846"/>
                                                        </svg>
                                                        <div>
                                    
                                        <p className='text-[#636846] font'>Cкролл вниз</p>
                                </div>
             
                    </div>
              </div>
        </div>
        
    </div>
      <div className='absolute w-[20%]    right-[12%] top-1/2 -translate-y-1/2 '>
                        <Image
                                     src="/images/lo.svg"
                                     alt="Меню"
                                     width={80}
                                     height={80}
                                      className="w-full h-auto"
                                   />
                    </div>
                 
</div>

      
    </StaticSection3>,

    <StaticSection3 key="3" src=""> 
     
             <div className=' absolute w-[78%] 4xl:w-[60%]  top-1/2  -translate-x-1/2 left-1/2   -translate-y-1/2 '>
                    <div className='grid grid-cols-4 gap-4 w-full'>
                        <div className='bg-[#F5F0E4] w-full px-[14%] py-[10%]  rounded-[20px]'>
                                                        <p className="
                              font-ManropeBold text-[#967450]
                              text-[clamp(1rem,0.9rem+0.5vw,1.5rem)]
                              bg-[#F4EDD7]
                              w-[clamp(2rem,1.6rem+1.2vw,2.75rem)]
                              aspect-square
                              rounded-full
                              grid place-items-center
                              leading-none
                              mb-[20%]
                            ">
                              1
                            </p>
                            <p className='flex flex-col gap-2'>
                                <span className='font-ManropeBold  text-[#967450] text-[clamp(1.125rem,0.9818rem+0.6364vw,2rem)]'>Простота</span>
                                <p className='text-[clamp(0.875rem,0.7727rem+0.4545vw,1.5rem)]  font-ManropeRegular text-[#636846] flex flex-col'>
                                    <span>Всё, что мы делаем — </span>
                                    <span>понятно, удобно</span>
                                    <span>и безопасно</span>
                                </p>
                            </p>

                        </div>
                         <div className='bg-[#F5F0E4] w-full px-[14%] py-[10%]  rounded-[20px]'>
                             <p className="
                              font-ManropeBold text-[#967450]
                              text-[clamp(1rem,0.9rem+0.5vw,1.5rem)]
                              bg-[#F4EDD7]
                              w-[clamp(2rem,1.6rem+1.2vw,2.75rem)]
                              aspect-square
                              rounded-full
                              grid place-items-center
                              leading-none
                              mb-[20%]
                            ">
                              2
                            </p>
                            <p className='flex flex-col gap-2'>
                                <span className='font-ManropeBold  text-[#967450] text-[clamp(1.125rem,0.9818rem+0.6364vw,2rem)]'>Поддержка</span>
                                <p className='text-[clamp(0.875rem,0.7727rem+0.4545vw,1.5rem)]  font-ManropeRegular text-[#636846] flex flex-col'>
                                    <span>Каждый маршрут</span>
                                    <span>сопровождается</span>
                                    <span>заботой — от первых</span>
                                    <span>шагов до финального </span>
                                    <span>результата</span>
                                </p>
                            </p>

                        </div>
                         <div className='bg-[#F5F0E4] w-full px-[14%] py-[10%]  rounded-[20px]'>
                            <p className="
                              font-ManropeBold text-[#967450]
                              text-[clamp(1rem,0.9rem+0.5vw,1.5rem)]
                              bg-[#F4EDD7]
                              w-[clamp(2rem,1.6rem+1.2vw,2.75rem)]
                              aspect-square
                              rounded-full
                              grid place-items-center
                              leading-none
                              mb-[20%]
                            ">
                              3
                            </p>
                            <p className='flex flex-col gap-2'>
                                <span className='font-ManropeBold  text-[#967450] text-[clamp(1.125rem,0.9818rem+0.6364vw,2rem)]'>Мягкость</span>
                                <p className='text-[clamp(0.875rem,0.7727rem+0.4545vw,1.5rem)]  font-ManropeRegular text-[#636846] flex flex-col'>
                                    <span>Мы не торопим, </span>
                                    <span>не сравниваем</span>
                                    <span>и не давим</span>
                                  
                                </p>
                            </p>

                        </div>
                          <div className='bg-[#F5F0E4] w-full px-[14%] py-[10%]  rounded-[20px]'>
                             <p className="
                              font-ManropeBold text-[#967450]
                              text-[clamp(1rem,0.9rem+0.5vw,1.5rem)]
                              bg-[#F4EDD7]
                              w-[clamp(2rem,1.6rem+1.2vw,2.75rem)]
                              aspect-square
                              rounded-full
                              grid place-items-center
                              leading-none
                              mb-[20%]
                            ">
                              4
                            </p>
                            <p className='flex flex-col gap-2'>
                                <span className='font-ManropeBold  text-[#967450] text-[clamp(1.125rem,0.9818rem+0.6364vw,2rem)]'>Осознанность</span>
                                <p className='text-[clamp(0.875rem,0.7727rem+0.4545vw,1.5rem)]  font-ManropeRegular text-[#636846] flex flex-col'>
                                    <span>Наши программы  </span>
                                    <span>выстроены так,</span>
                                    <span>чтобы вести клиента</span>
                                    <span>к качественным и  </span>
                                    <span>устойчивым переменам</span>
                                  
                                </p>
                            </p>

                        </div>


                    </div>
                    
                </div>

    </StaticSection3>,


    <StaticSection3 key="3" src=""> 
     
             <div className=' absolute w-[88%] 4xl:w-[70%]  top-1/2  -translate-x-1/2 left-1/2   -translate-y-1/2 '>
                    <div className='grid grid-cols-2 gap-4 w-full'>
                        <div className='bg-[#757F64] w-full px-[14%] py-[5%] flex flex-col justify-center   rounded-[20px]'>
                                                        
                            <p className='flex flex-col gap-2'>
                                <span className='font-ManropeBold  text-[#F5F0E4] text-[clamp(0.875rem,0.7727rem+0.4545vw,1.5rem)]'>Уникальные 28-дневные маршруты</span>
                                <p className='text-[clamp(0.875rem,0.7727rem+0.4545vw,1.5rem)]  font-ManropeRegular text-[#F5F0E4] flex flex-col'>
                                    <span>Каждая программа — это продуманный путь </span>
                                    <span>с ежедневными заданиями, поддержкой</span>
                                    <span>и мягкой динамикой</span>
                                </p>
                            </p>

                        </div>
                          <div className='bg-[#CB7A5C] w-full px-[14%] py-[5%] flex flex-col justify-center   rounded-[20px]'>
                                                        
                            <p className='flex flex-col gap-2'>
                                <span className='font-ManropeBold  text-[#F5F0E4] text-[clamp(0.875rem,0.7727rem+0.4545vw,1.5rem)]'> Финальные процедуры</span>
                                <p className='text-[clamp(0.875rem,0.7727rem+0.4545vw,1.5rem)]  font-ManropeRegular text-[#F5F0E4] flex flex-col'>
                                    <span>КВ конце каждого маршрута — реальная услуга: массаж, </span>
                                    <span>уход или консультация</span>
                                   
                                </p>
                            </p>

                        </div>
                        <div className='bg-[#F5F0E4] w-full px-[14%] py-[5%] flex flex-col justify-center   rounded-[20px]'>
                                                        
                            <p className='flex flex-col gap-2'>
                                <span className='font-ManropeBold  text-[#636846] text-[clamp(0.875rem,0.7727rem+0.4545vw,1.5rem)]'>Возможность подарить заботу другим</span>
                                <p className='text-[clamp(0.875rem,0.7727rem+0.4545vw,1.5rem)]  font-ManropeRegular text-[#636846] flex flex-col'>
                                    <span>Любой маршрут можно оформить как подарок — </span>
                                    <span>красиво, просто и с душевным посылом</span>
                                    
                                </p>
                            </p>

                        </div>
                           <div className='bg-[#5C757A] w-full px-[14%] py-[5%] flex flex-col justify-center   rounded-[20px]'>
                                                        
                            <p className='flex flex-col gap-2'>
                                <span className='font-ManropeBold  text-[#F5F0E4] text-[clamp(0.875rem,0.7727rem+0.4545vw,1.5rem)]'> Команда специалистов</span>
                                <p className='text-[clamp(0.875rem,0.7727rem+0.4545vw,1.5rem)]  font-ManropeRegular text-[#F5F0E4] flex flex-col'>
                                    <span>В нашей команде работают специалисты в уходе,</span>
                                    <span>теле и психологии. Каждый из них является экспертом</span>
                                    <span>в своей области</span>
                                    
                                </p>
                            </p>

                        </div>


                    </div>
                    
                </div>

    </StaticSection3>,

    <StaticSection3 key="6" src="/images/sl50.png">
      <div className='absolute top-1/2 left-[10%] -translate-y-1/2 rounded-[20px]
                            
                           py-[2%] px-[2%]'>
        <p className='text-[#636846] text-[clamp(0.875rem,0.55rem+1.625vw,2.5rem)] font-[Manrope-Bold] mb-4 flex flex-col'>
          <span>Всё начинается</span>
          <span>с разрешения быть собой</span>
          
        </p>
        <p className='text-[clamp(0.75rem,0.65rem+0.5vw,1.25rem)] font-[Manrope-Regular] flex flex-col mb-4 text-[#636846]'>
          <span>Мы не обещаем идеальное тело или вечную </span>
          <span>молодость. Мы создаём пространство,</span>
          <span>где можно выбрать себя — без спешки,</span>
          <span>без стресса, по-настоящему.</span>
          
         
          
          
        </p>
        <div className='flex gap-4'>
          
          <button className='rounded-[5px] bg-[#636846] text-white px-[6%] py-[3%] font-[Manrope-Regular] text-[clamp(0.75rem,0.65rem+0.5vw,1.25rem)]'>
            Перейти к услугам
          </button>
          
        </div>
      </div>
    </StaticSection3>,

    
  ]), [isMobile])

  const texts = useMemo(() => ([
    { tit: 'О НАС' },
    { tit: 'Наш подход' },
    { tit: 'Что нас отличает' },
    { tit: 'И главное' },
   
  ]), [])

  const {
    currentPage,
    containerRef,
    next, prev, goTo,
    motionAnimate,
    motionTransition,
  } = usePagedScroll({
    pageCount: sections.length,
    axis: 'y',
    duration: 600,
    touchThreshold: 50,
    keyboard: true,
    blockWhileAnimating: true,
    mobileMaxWidth: 480,
    mobile: {
      axis: 'y',
      duration: 600,
      touchThreshold: 50,
      keyboard: false,
    },
    shouldCaptureEvent: (e) => !e.target.closest('[data-scroll-lock="off"]'),
  })

  const overlayProps = {
    next,
    prev,
    goTo,
    currentPage,
    totalPages: sections.length,
    text: texts[currentPage],
  }

  return (
    <div ref={containerRef} className="overflow-hidden h-screen w-screen relative">
      <motion.div
        animate={motionAnimate}
        transition={motionTransition}
        className="flex flex-col"
      >
        {sections}
      </motion.div>

      <LayoutOverlay2 {...overlayProps} />
    </div>
  )
}
