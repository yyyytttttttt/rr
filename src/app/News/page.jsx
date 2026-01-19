'use client'
import React, { useState, useEffect, useMemo } from 'react'
import { motion } from 'framer-motion'
import NewsSlider from '../components/News/newsSection'
import NewsSecondSection  from '../components/News/NewsSecondSection'
import LayoutOverlay3 from '../components/LayoutOverlay3'
import BottomNav from '../components/menus/BottomNav'
import Image from 'next/image'

// мини-хук

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
  

  // ВАЖНО: один цельный массив без повторов и лишних "] />"
  

  const texts = useMemo(() => ([
    { tit: 'Новости' },
   
   
  ]), [])
  

  



  return (
    <LayoutOverlay3 title="Новости" className="">
      <NewsSlider items={items} className="bg-transparent" />
      < NewsSecondSection/>
      <BottomNav></BottomNav>
     
     
      
    </LayoutOverlay3>
  )
}
