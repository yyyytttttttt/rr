'use client'
import { useState, useEffect, useCallback, useRef } from 'react'
import { motion } from 'framer-motion'
import SliderSection from './components/SliderSection'
import LayoutOverlay from './components/LayoutOverlay'

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

  // ✅ Формируем секции заново при изменении isMobile
  const sections = [
    <SliderSection
      key="1"
      ref={(el) => (sliderRefs.current[0] = el)}
      images={isMobile ? ["/images/mobile1.png", "/images/mobile2.png"] : ["/images/sl1.png", "/images/sl2.png"]}
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
    />
  ]

  const texts = [
    {
      tit: "Новая я",
      title: "Ты — центр этого пространства",
      desc: "«Новая Я» — это не просто эстетика и стиль. Это сопровождение, поддержка и услуги, которые помогают выбрать себя заново. Запишись — не для того, чтобы изменить себя, а чтобы наконец-то услышать."
    },
    {
      tit: "услуги",
      title: "Новости клиники",
      desc: "Мы не просто ведём соцсети — мы создаём пространство, где вы можете читать, вдохновляться, выбирать и чувствовать себя частью чего-то настоящего."
    },
    {
      tit: "Контакты",
      title: "Наши услуги",
      desc: "Красота, спокойствие и уверенность — всё начинается с заботы о себе. Выбери то, что откликается именно тебе."
    }
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

  return (
    <div className="overflow-hidden h-screen w-screen relative">
      <motion.div
        animate={{ y: `-${currentPage * 100}vh` }}
        transition={{ duration: 0.6, ease: [0.33, 1, 0.68, 1] }}
        className="flex flex-col"
      >
        {sections}
      </motion.div>

      <LayoutOverlay
        next={() => sliderRefs.current[currentPage]?.slideNext()}
        prev={() => sliderRefs.current[currentPage]?.slidePrev()}
        text={texts[currentPage]}
      />
    </div>
  )
}
