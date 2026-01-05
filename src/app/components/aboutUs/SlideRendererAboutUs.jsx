'use client'

import React from 'react'
import FirstBlock from './FirstBlock'
import ApproachCards from './ApproachCards'
import WhatMakesUsDifferent from './WhatMakesUsDifferent'
import Block3 from './Block3'

function SlideRendererAboutUs({ slide }) {
  // Рендерим компоненты по типу
  if (slide.type === 'component') {
    if (slide.component === 'FirstBlock') return <FirstBlock />
    if (slide.component === 'ApproachCards') return <ApproachCards />
    if (slide.component === 'WhatMakesUsDifferent') return <WhatMakesUsDifferent />
    if (slide.component === 'Block3') return <Block3 />

    return null
  }

  return null
}

export default React.memo(SlideRendererAboutUs)
