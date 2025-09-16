import React from 'react'
import PassesSlider from './PassesSlider'
import ImagesSlider from './ImagesSlider' // новый компонент ниже
import Image from 'next/image'
import StaticNav from './menus/StaticNav'
// mode: 'cards' | 'images'
const SliderSection2 = ({ mode = 'cards', images = [], children }) => {
  return (
    <div className="relative h-[100svh] flex-none w-screen bg-[#FFFCF3]">
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
     <StaticNav></StaticNav>
    </div>
  )
}

export default SliderSection2
