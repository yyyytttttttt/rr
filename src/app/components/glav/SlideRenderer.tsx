'use client'

import React from 'react'
import StaticSection3 from '../SliderSection3'
import DesktopCard from '../Hero/DesktopCard'
import MobileBar from '../Hero/MobileBar'
import Fsection from './Fsection'
import SliderSection2 from '../SliderSection2'
import SliderSection4 from '../SliderSection4'
import SliderSection5 from "../SliderSection5"
import SliderSection6 from '../SliderSection6'

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

  if (slide.type === 'slider4') {
    return <SliderSection4 />
  }
  if (slide.type === 'slider5') {
    return <SliderSection5 />
  }
  if (slide.type === 'slider6') {
    const d = slide.desktop
    const m = slide.mobile
    return (
    <SliderSection6>
      

    </SliderSection6>
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
