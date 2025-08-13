'use client'
import { useState, useEffect, useCallback, useRef } from 'react'
import { motion } from 'framer-motion'
import SliderSection from './components/SliderSection'
import LayoutOverlay from './components/LayoutOverlay'
import Propusk from './components/propusk'

export default function FullPageScroll() {
  const [currentPage, setCurrentPage] = useState(0)
  const [isAnimating, setIsAnimating] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const sliderRefs = useRef([])

  // ✅ Проверяем реальную ширину экрана
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 480)
    if (typeof window !== 'undefined') {
      checkMobile()
      window.addEventListener('resize', checkMobile)
      return () => window.removeEventListener('resize', checkMobile)
    }
  }, [])
  const overlayPlan = ['layout', 'layout', 'layout', 'propusk','propusk','propusk','propusk']

  // ✅ Формируем секции заново при изменении isMobile
  const sections = [
    <SliderSection
      key="1"
      ref={(el) => (sliderRefs.current[0] = el)}
      images={isMobile 
    ? ["/images/mobile1.mp4", "/images/mobile2.png"] 
    : ["/video/sl2.mp4","/video/ad.mp4", "/images/sl20.png"]
}
    />,
    <SliderSection
      key="2"
      ref={(el) => (sliderRefs.current[1] = el)}
      images={isMobile ? ["/images/mobile3.png", "/images/mobile4.png"] : ["/images/sl3.png", "/images/sl4.png"]}
    />,
    <SliderSection
      key="3"
      ref={(el) => (sliderRefs.current[2] = el)}
      images={isMobile ? ["/images/mobile5.png", "/images/mobile6.png"] : ["/images/sl5.png", "/images/sl6.png"]}
    />,
    <SliderSection
      key="4"
      ref={(el) => (sliderRefs.current[3] = el)}
      images={isMobile ? ["/images/mobile5.png", "/images/mobile6.png"] : ["/images/sl13.png", "/images/sl13.png"]}
    />,
    <SliderSection
      key="5"
      ref={(el) => (sliderRefs.current[4] = el)}
      images={isMobile ? ["/images/mobile5.png", "/images/mobile6.png"] : ["/images/sl14.png", "/images/sl14.png"]}
    />,
    <SliderSection
      key="6"
      ref={(el) => (sliderRefs.current[5] = el)}
      images={isMobile ? ["/images/mobile5.png", "/images/mobile6.png"] : ["/images/sl15.png", "/images/sl15.png"]}
    />,
    <SliderSection
      key="7"
      ref={(el) => (sliderRefs.current[6] = el)}
      images={isMobile ? ["/images/mobile5.png", "/images/mobile6.png"] : ["/images/sl16.png", "/images/sl16.png"]}
    />,
    
  ]

  const texts = [
  {
    tit: "Новая я",
    title: "Ты — центр этого пространства",
    desc: "«Новая Я» — это не просто эстетика и стиль, Это сопровождение, поддержка и услуги,которые помогают выбрать себя заново. Запишись — не для того, чтобы изменить себя, а чтобы наконец-то услышать.",
    buttons: [
      { label: "Выбрать услугу", bg: "#636846", text: "#F5F0E4" },
      { label: "Написать в чат", bg: "#F7EFE5", text: "#967450" },
      
    ]
  },
  {
    tit: "услуги",
    title: "Наши услуги",
    desc: "Красота, спокойствие и уверенность — всё начинается с заботы о себе. Выбери то, что откликается именно тебе.",
    buttons: [
      { label: "Выбрать услугу", bg: "#636846", text: "#F7EFE5" },
      { label: "Написать в чат", bg: "#F7EFE5", text: "#967450" },
      

    ]
  },
  {
    tit: "Контакты",
    title: "Контакты — одним касанием",
    desc: "Мы не просто ведём соцсети — мы создаём пространство, где вы можете читать, вдохновляться, выбирать и чувствовать себя частью чего-то настоящего. ",
    buttons: [
      { label: "Перейти в раздел", bg: "#F7EFE5", text: "#967450" },
      
    ]
  },
  {
    tit: "пропуск к здоровью",
    title: "Глубокое увлажнение",
    desc: "8 дней простых шагов, чтобы подготовить твою кожу к глубокому увлажнению. Ты очищаешь, настраиваешь ритм и вводишь мягкий уход. В конце пути профессиональная увлажняющая маска сработает вдвойне эффективнее.Первые 20 участников получают челлендж и маску бесплатно.Далее участие по beauty-пропуску (3 000 ₽), который включает всю программу и финальную процедуру маски.",
    buttons: [
      { label: "Начать бесплатно", bg: "#636846", text: "#FFFFFF" },
      { label: "Купить", bg: "#E1EE93", text: "#636846" },
      { label: "Узнать больше", border: "#636846", text: "#636846" }
    ]
  },
  {
    tit: "пропуск к здоровью",
    title: "Новое сияние ",
    desc: "28 дней ежедневной заботы о себе, чтобы твоя кожа сияла чистотой и лёгкостью. Даже если лень — простые шаги помогут оставаться свежей. А в конце мы подарим профессиональную чистку лица, усиливающую весь пройденный путь. Первые 20 участников получают челлендж и чистку лица бесплатно. Далее участие по beauty-пропуску (3 000 ₽), который включает весь путь и финальную процедуру.",
    buttons: [
      { label: "Начать бесплатно", bg: "#684646", text: "#FFFFFF" },
      { label: "Купить", bg: "#EE9393", text: "#636846" },
      { label: "Узнать больше", border: "#636846", text: "#636846" }
    ]
  },
  {
    tit: "пропуск к здоровью",
    title: "Улыбка души",
    desc: "Когда ты обретаешь внутренний баланс — это видят все вокруг. Тебя ждут простые ежедневные шаги, чтобы снять напряжение, услышать себя и приблизиться к гармонии с собой и миром. Это ежедневная забота о себе. Первые 28 участников получат челлендж и консультацию психолога бесплатно. Далее участие по beauty-пропуску (3 000 ₽), который включает всю программу и итоговую встречу с психологом.",
    buttons: [
      { label: "Начать бесплатно", bg: "#465568", text: "#FFFFFF" },
      { label: "Купить", bg: "#B0CCED", text: "#636846" },
      { label: "Узнать больше", border: "#636846", text: "#636846" }
    ]
  },
  {
    tit: "пропуск к здоровью",
    title: "Заново в теле",
    desc: "28 дней мягких ежедневных действий, чтобы снять зажимы, вернуть телу чувствительность и подготовиться к глубокому расслаблению. Каждое задание поможет усилить эффект финального массажа, делая его максимально эффективным. Первые 28 участников получают челлендж и массаж бесплатно. Далее участие по beauty-пропуску (3 000 ₽), который включает всю программу и полноценный массаж после её завершения.",
    buttons: [
      { label: "Начать бесплатно", bg: "#967450", text: "#FFFFFF" },
      { label: "Купить", bg: "#F5F0E4", text: "#636846" },
      { label: "Узнать больше", border: "#636846", text: "#636846" }
    ]
  },
]


  const nextPage = useCallback(() => {
    if (!isAnimating && currentPage < sections.length - 1) {
      setIsAnimating(true)
      setCurrentPage(currentPage + 1)
    }
  }, [currentPage, isAnimating, sections.length])

  const prevPage = useCallback(() => {
    if (!isAnimating && currentPage > 0) {
      setIsAnimating(true)
      setCurrentPage(currentPage - 1)
    }
  }, [currentPage, isAnimating])

  useEffect(() => {
    let startY = 0
    const handleWheel = (e) => {
      if (isAnimating) return
      if (e.deltaY > 0) nextPage()
      else prevPage()
    }
    const onTouchStart = (e) => startY = e.touches[0].clientY
    const onTouchEnd = (e) => {
      if (isAnimating) return
      const endY = e.changedTouches[0].clientY
      if (startY - endY > 50) nextPage()
      if (endY - startY > 50) prevPage()
    }
    window.addEventListener('wheel', handleWheel, { passive: true })
    window.addEventListener('touchstart', onTouchStart)
    window.addEventListener('touchend', onTouchEnd)
    return () => {
      window.removeEventListener('wheel', handleWheel)
      window.removeEventListener('touchstart', onTouchStart)
      window.removeEventListener('touchend', onTouchEnd)
    }
  }, [nextPage, prevPage, isAnimating])

  useEffect(() => {
    if (!isAnimating) return
    const timer = setTimeout(() => setIsAnimating(false), 600)
    return () => clearTimeout(timer)
  }, [isAnimating])
  const overlayType = overlayPlan[currentPage] || 'none'
  const overlayProps = {
    next: () => sliderRefs.current[currentPage]?.slideNext?.(),
    prev: () => sliderRefs.current[currentPage]?.slidePrev?.(),
    text: texts[currentPage],
  }
  return (
    <div className="overflow-hidden h-screen w-screen relative">
      <motion.div
        animate={{ y: `-${currentPage * 100}vh` }}
        transition={{ duration: 0.6, ease: [0.33, 1, 0.68, 1] }}
        className="flex flex-col"
      >
        {sections}
      </motion.div>

      {/* Рендерим один из оверлеев в зависимости от плана */}
      {overlayType === 'layout' && <LayoutOverlay {...overlayProps} />}
      {overlayType === 'propusk' && <Propusk {...overlayProps} />}
      {/* если нужен слайд без оверлея — поставь 'none' в overlayPlan */}
    </div>
  )
}
