'use client'
import React, { memo, useMemo } from 'react'
import SliderSection from '../SliderSection1'
import useIsMobile from './useIsMobile'
import DesktopCard from './DesktopCard'
import MobileBar from './MobileBar'
import { slides } from './slides.data'

function HeroSlider() {
  const isMobile = useIsMobile(480)

  // стабилизируем ссылки: меняем картинки только когда меняется брейкпоинт
  const images = useMemo(() => {
    return slides.map(s => (isMobile ? s.media.mobile : s.media.desktop))
  }, [isMobile])

  // если контент статичен (импорт из файла), делаем один раз
  const overlays = useMemo(() => {
    return slides.map(s => (
      <React.Fragment key={s.id}>
        <DesktopCard pos="right" title={s.title} lines={s.lines} buttons={s.buttons} />
        <MobileBar   title={s.title} text={s.lines} buttons={s.buttons} />
      </React.Fragment>
    ))
  }, [])

  return <SliderSection images={images} overlays={overlays} />
}

export default memo(HeroSlider)
