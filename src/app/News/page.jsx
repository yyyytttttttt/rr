'use client'
import React, { useState, useEffect, useMemo } from 'react'
import { motion } from 'framer-motion'
import NewsSlider from '../components/newsSection'

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
const items = [
    {
    tag: 'Психология / Поддержка',
    time: '2 мин чтения',
    title: ['Встреча с психологом — ',
            'теперь онлайн'
    ],
    excerpt: [
        'Не всегда просто найти время на заботу',
        'о себе. Поэтому теперь итоговая встреча',
        'с психологом из программы “Улыбка души” ',
        'доступна в онлайн-формате.'
    ],
    cta: 'Узнать больше',
    href: '/blog/psy-online',
    image: '/images/card-psy.png',
    },
  {
    tag: 'Психология / Поддержка',
    time: '2 мин чтения',
    title: ['Программа «Живой баланс» —',
            'теперь с подарочной упаковкой'
    ],
    excerpt: [
        'Пропуск к здоровью можно подарить близким ',
        '— с пожеланием, именем и красивой цифровой',
        'упаковкой. В знак настоящего внимания ',
        'и поддержки.'
    ],
    cta: 'Узнать больше',
    href: '/blog/psy-online',
    image: '/images/ns.png',
    },
   {
    tag: 'Тело / Расслабление',
    time: '2 мин чтения',
    title: ['Новая программа:',
            '«Заново в теле» уже доступна'
    ],
    excerpt: [
        'Встречайте новинку — маршрут',
        '“Заново в теле”. 28 дней для мягкого',
        'расслабления, снятия зажимов',
        'расслабления, снятия зажимов',
        'Финальная точка — полноценный',
        'профессиональный массаж.'
    ],
    cta: 'Узнать больше',
    href: '/blog/psy-online',
    image: '/images/ns2.png',
    },
    {
    tag: 'Забота / Подарки',
    time: '2 мин чтения',
    title: ['Добавлена функция',
            '«Подарить пропуск»'
    ],
    excerpt: [
        'Теперь любой пропуск к здоровью',
        'можно подарить.',
        'Выбирайте пропуск с персональным ',
        'пожеланием для самых близких.',
       
    ],
    cta: 'Узнать больше',
    href: '/blog/psy-online',
    image: '/images/ns3.png',
    },
]

export default function FullPageScroll() {
  const isMobile = useIsMobile(480)

  // ВАЖНО: один цельный массив без повторов и лишних "] />"
  const sections = useMemo(() => ([
    

   
    <NewsSlider items={items} className="bg-transparent" />
    
  ]), [isMobile])

  const texts = useMemo(() => ([
    { tit: 'Новости' },
   
   
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
