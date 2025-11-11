'use client'

import React from 'react'
import StaticSection3 from '../SliderSection3'
import DesktopCard from '../Hero/DesktopCard'
import MobileBar from '../Hero/MobileBar'
import Fsection from './Fsection'
import SliderSection2 from '../SliderSection2'
import { DescProps, mobileBarType, Slide } from '../../types/GlavProps'

function SlideRenderer({ slide }:{slide:Slide}) {

  if (slide.type === 'component') {
    if (slide.component === 'Fsection') return <Fsection />
    return null
  }

  
  if (slide.type === 'slider2') {
    const d = slide.desktop
    const m = slide.mobile
    return (
      <SliderSection2>
        <DesktopCard pos={d.pos} title={d.title} lines={d.lines} buttons={d.buttons} />
        <MobileBar title={m.title} text={m.text} buttons={m.buttons} />
      </SliderSection2>
    )
  }

  
  const d = slide.desktop
  const m = slide.mobile
  return (
    <StaticSection3 src={slide.src} images={slide.images}>
      <DesktopCard pos={d.pos} title={d.title} lines={d.lines} buttons={d.buttons} />
      <MobileBar title={m.title} text={m.text} buttons={m.buttons} />
    </StaticSection3>
  )
}



export default React.memo(SlideRenderer)
