import React, { memo } from 'react'
import PassesSlider from './PassesSlider'
import ImagesSlider from './ImagesSlider' // новый компонент ниже
import Image from 'next/image'
import StaticNav from './menus/StaticNav'
import { useVh100 } from '../hooks/useVh100'
// mode: 'cards' | 'images'
function SliderSection2 ({ mode = 'cards', images = [], children }) {
  const vh100 = useVh100()
  return (
    <div  className="relative  h-app min-h-0 flex-none w-screen bg-[#FFFCF3]">
      {/* твой оверлей сверху (если блокирует свайп — добавь pointer-events-none) */}
      <div className="absolute inset-0">
        {children}
      </div>

      {/* выбор контента */}
      {mode === 'cards' ? (
        <PassesSlider />
      ) : (
        <ImagesSlider images={images} />
      )}
     
    </div>
  )
}

export default memo(SliderSection2)
