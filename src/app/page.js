'use client'
import React, { useState, useEffect, useMemo } from 'react'
import { motion } from 'framer-motion'
import SliderSection from './components/SliderSection1'
import SliderSection2 from './components/SliderSection2'
import StaticSection3 from './components/SliderSection3'
import LayoutOverlay from './components/LayoutOverlay'
import { usePagedScroll } from './hooks/usePagedScroll'
import Image from 'next/image'
import Fsection from './components/glav/Fsection'
import HeroSlider from './components/Hero/HeroSlider'
import DesktopCard from './components/Hero/DesktopCard'
import MobileBar from './components/Hero/MobileBar'

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

  // формируем секции (важно: зависимость от isMobile!)
  const sections = useMemo(() => ([
      <Fsection/>,
     <StaticSection3  images={{
    default: '/images/sl2.png',   // < 480px и fallback
    xs:      '/images/hero-480.jpg',      // >= 480px
    oneK:    '/images/hero-1000.jpg',     // >= 1000px
    fourXL:  '/images/sl2.png'      // >= 1930px
  }}>
         <DesktopCard pos="left"
          title="Новости клиники"
          lines={[
            'Мы не просто ведём соцсети —',
            'мы создаём пространство, где вы',
            'можете читать, вдохновляться,',
            'выбирать и чувствовать себя',
            'частью чего-то настоящего.',
          ]}
          buttons={[{label:'Перейти в раздел', variant:'ghost'}]}
          ></DesktopCard>
         <MobileBar 
          title="Новости клиники"
          text={[
            'Мы не просто ведём соцсети — мы создаём ',
            'пространство, где вы можете читать, вдохновляться, ',
            'выбирать и чувствовать себя частью чего-то ',
            'настоящего.',
            
          ]}
          buttons={[{label:'Перейти в раздел', variant:'ghost'}]}
          ></MobileBar>
          
      </StaticSection3>,
    <StaticSection3 src="/images/sl3.png">
        <DesktopCard pos="left"
          title="Наши услуги"
          lines={[
            'Красота, спокойствие и уверенность —',
            'всё начинается с заботы о себе.',
            'Выбери то, что откликается именно тебе.',
            
          ]}
          buttons={[{label:'Выбрать услугу', variant:'ghost'},{label:'Написать в чат' , variant:'primary'}]}
          ></DesktopCard>
         <MobileBar 
          title="Наши услуги"
          text={[
            'Красота, спокойствие и уверенность —',
            'всё начинается с заботы о себе.',
            'Выбери то, что откликается именно тебе.',
            
          ]}
          buttons={[{label:'Выбрать услугу', variant:'ghost'},{label:'Написать в чат' , variant:'primary'}]}
          ></MobileBar>
      </StaticSection3>,
     
      
     
      
      
    <SliderSection2>
     <DesktopCard pos="left"
          title={[
            'Ты — центр',
            'этого пространства'

          ]}
          lines={[
            '«Новая Я» — это не просто эстетика и стиль',
            'Это сопровождение, поддержка и услуги,',
            'которые помогают выбрать себя заново.',
            'Запишись — не для того, чтобы изменить себя,',
            'а чтобы наконец-то услышать.'
            
          ]}
          buttons={[{label:'Выбрать услугу', variant:'ghost'},{label:'Написать в чат' , variant:'primary'}]}
          ></DesktopCard>
         <MobileBar 
          title={[
            'Ты — центр',
            'этого пространства'

          ]}
          text={[
            '«Новая Я» — это не просто эстетика и стиль',
            'Это сопровождение, поддержка и услуги,',
            'которые помогают выбрать себя заново.',
            'Запишись — не для того, чтобы изменить себя,',
            'а чтобы наконец-то услышать.'
            
          ]}
          buttons={[{label:'Выбрать услугу', variant:'ghost'},{label:'Написать в чат' , variant:'primary'}]}
          ></MobileBar>
    </SliderSection2>,
    <StaticSection3 src="/images/sl60.png">
        <DesktopCard pos="left"
          title={[
            'Контакты и адрес —',
            'в одном месте'

          ]}
          lines={[
            'Мы сделали электронную визитку,',
            'которую удобно сохранить',
            'и легко отправить. ',
          
            
          ]}
          buttons={[{label:'Скачать', variant:'primary'},{label:'Перейти в раздел' , variant:'ghost'}, ]}
          ></DesktopCard>
         <MobileBar 
           title={[
            'Контакты и адрес —',
            'в одном месте'

          ]}
          text={[
            'Мы сделали электронную визитку,',
            'которую удобно сохранить',
            'и легко отправить. ',
          
            
          ]}
          buttons={[{label:'Скачать', variant:'primary'},{label:'Перейти в раздел' , variant:'ghost'}, ]}
          ></MobileBar>
      </StaticSection3>,
      <StaticSection3 src="/images/sl6.png">
          <DesktopCard pos="left"
          title={[
            'Пространство осознанности',
            'и внутренней силы'

          ]}
          lines={[
            '–Онлайн-семинары с практикующими психологами',
            '–Вдохновляющие подкасты о жизни, принятии и гармонии',
            '–Разборы лучших книг по психологии ',
          
            
          ]}
          buttons={[{label:'Перейти в раздел' , variant:'ghost'}, ]}
          ></DesktopCard>
         <MobileBar 
           title={[
            'Пространство осознанности и внутренней силы',
            

          ]}
          text={[
            '–Онлайн-семинары с практикующими психологами',
            '–Вдохновляющие подкасты о жизни, принятии и гармонии',
            '–Разборы лучших книг по психологии    ',
          
            
          ]}
          buttons={[,{label:'Перейти в раздел' , variant:'ghost'}, ]}
          ></MobileBar>
      </StaticSection3>,
      <StaticSection3 src="/images/sl7.png">
          <DesktopCard pos="left"
          title={[
            'Личный кабинет,',
            'который работает за вас'

          ]}
          lines={[
            'Запись на приём, история процедур, персональные',
            'рекомендации, напоминания и дневник —   ',
            'всё в одном месте. На сайте и в приложении.',
            'Всегда под рукой.'
          
            
          ]}
          buttons={[{label:'Перейти в раздел' , variant:'ghost'}, ]}
          ></DesktopCard>
         <MobileBar 
            title={[
            'Личный кабинет,',
            'который работает за вас'

          ]}
          text={[
            'Запись на приём, история процедур, персональные',
            'рекомендации, напоминания и дневник —   ',
            'всё в одном месте. На сайте и в приложении.',
            'Всегда под рукой.'
          
            
          ]}
          buttons={[{label:'Перейти в раздел' , variant:'ghost'}, ]}
          ></MobileBar>
      </StaticSection3>,
      
   
   
    <StaticSection3 src="/images/sl4.png">
        <DesktopCard pos="left"
          title={[
            'Наши специалисты',
            

          ]}
          lines={[
            'Вы можете выбрать подходящую услугу',
            'и записаться на прием с возможностью ',
            'оплаты онлайн. Просто и быстро.',
            
          
            
          ]}
          buttons={[{label:'Выбрать специалиста' , variant:'ghost'}, ]}
          ></DesktopCard>
         <MobileBar 
             title={[
            'Наши специалисты',
            

          ]}
          text={[
            'Вы можете выбрать подходящую услугу',
            'и записаться на прием с возможностью ',
            'оплаты онлайн. Просто и быстро.',
            
          
            
          ]}
          buttons={[{label:'Выбрать специалиста' , variant:'ghost'}, ]}
          ></MobileBar>
      </StaticSection3>,
    <StaticSection3 src="/images/sl11.png" >
        <DesktopCard pos="left"
          title={[
            'Теперь доступна ',
            'онлайн-оплата!'
            

          ]}
          lines={[
            'Оплачивайте услуги прямо через приложение',
            'или сайт — быстро, безопасно и удобно.  ',
            'Поддерживаются все популярные способы:',
            'карта, СБП и другие.',
            'Выбирайте то, что подходит вам!'

            
          
            
          ]}
          buttons={[{label:'Записаться на прием' , variant:'ghost'}, ]}
          ></DesktopCard>
         <MobileBar 
             title={[
            'Теперь доступна ',
            'онлайн-оплата!'
            

          ]}
          text={[
            'Оплачивайте услуги прямо через приложение',
            'или сайт — быстро, безопасно и удобно.  ',
            'Поддерживаются все популярные способы:',
            'карта, СБП и другие.',
            'Выбирайте то, что подходит вам!'

            
          
            
          ]}
          buttons={[{label:'Записаться на прием' , variant:'ghost'}, ]}
          ></MobileBar>
      </StaticSection3>,
    
  ]), [isMobile])
    
   
 

  const texts = useMemo(() => ([
    { tit: "Новая я" },
    { tit: "новости" },
    { tit: "услуги" },
    { tit: "пропуск к здоровью" },
    {tit: "Контакты"},
    { tit: "Факультет психологии" },
    { tit: "Личный кабинет" },
    { tit: "галерея" },
    { tit: "приложение" },
    { tit: "специалисты" },
    { tit: "онлайн-оплата" },
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

  // >>> вот здесь НЕТ slideNext/slidePrev <<<
  const overlayProps = {
    next,                 // листаем страницу вперёд
    prev,                 // листаем страницу назад
    goTo,                 // перейти к конкретной странице
    currentPage,
    totalPages: sections.length,
    text: texts[currentPage],
  }

  return (
    <div ref={containerRef} className="overflow-hidden h-[100dvh] w-screen relative">
      <motion.div
        animate={motionAnimate}
        transition={motionTransition}
        className="flex flex-col"
      >
        {sections}
      </motion.div>

      <LayoutOverlay {...overlayProps} />
    </div>
  )
}
