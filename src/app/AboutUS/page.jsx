'use client'
import React, { useState, useEffect, useMemo } from 'react'
import { motion } from 'framer-motion'

import StaticSection3 from '../components/SliderSection3'
import LayoutOverlay2 from '../components/LayoutOverlay2'
import { usePagedScroll } from '../hooks/usePagedScroll'
import Image from 'next/image'
import Cart from '../components/aboutUs/Cart'
import Cart2 from '../components/aboutUs/cart2'
import SliderCart from '../components/aboutUs/SliderCart'
import FirstBlock from '../components/aboutUs/FirstBlock'
import Block3 from '../components/aboutUs/Block3'

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
    

    <FirstBlock></FirstBlock>,
    <SliderCart></SliderCart>,

   


    <StaticSection3 key="3" src=""> 
     
             <div className=' absolute flex w-full px-[4%]  xs:px-[8%]  h-[100dvh] items-center   justify-center  '>
                    <div className='grid grid-cols-1 md:grid-cols-2 gap-4 w-full'>
                    
                      <Cart2 bg="#757F64" title="Уникальные 28-дневные маршруты">
                        <>
                          <span>Каждая программа — это продуманный путь</span>
                          <span>с ежедневными заданиями, поддержкой</span>
                          <span>и мягкой динамикой</span>
                        </>
                      </Cart2>
                    
                  
                      <Cart2 bg="#CB7A5C" title=" Финальные процедуры">
                        <>
                          <span>В конце каждого маршрута — реальная услуга: </span>
                          <span>массаж, уход или консультация</span>
                      
                        </>
                      </Cart2>
                    
                         <Cart2 bg="#F5F0E4" text='#636846' title="Возможность подарить заботу другим">
                      <>
                        <span>Любой маршрут можно оформить как подарок — </span>
                        <span>красиво, просто и с душевным посылом</span>
                       
                      </>
                    </Cart2>
                    <Cart2 bg="#5C757A" title="Команда специалистов">
                      <>
                        <span>В нашей команде работают специалисты</span>
                        <span>в уходе,теле и психологии. Каждый из них является</span>
                        <span>экспертом в своей области</span>
                        
                      </>
                    </Cart2>


                    </div>
                    
                </div>

    </StaticSection3>,

    <Block3 ></Block3>

    
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
    <div ref={containerRef} className="overflow-hidden h-[100svh] w-screen relative">
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
