'use client'
import SliderSection from '../SliderSection1'
import useIsMobile from './useIsMobile'
import DesktopCard from './DesktopCard'
import MobileBar from './MobileBar'
import { slides } from './slides.data'

export default function HeroSlider() {
  const isMobile = useIsMobile(480)

  const images = slides.map(s => isMobile ? s.media.mobile : s.media.desktop)
  const overlays = slides.map((s, i) => (
    <>
      <DesktopCard pos='right' title={s.title} lines={s.lines} buttons={s.buttons} />
      <MobileBar   title={s.title} text={s.lines} buttons={s.buttons} />
    </>
  ))

  return <SliderSection images={images} overlays={overlays} />
}
