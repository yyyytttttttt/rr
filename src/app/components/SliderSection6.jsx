import React from 'react'
import BeforeAfter from '../components/galery/BeforeAfter'

const SliderSection6 = () => {
  const items = [
  {
    id: '1',
    before: { src: '/images/sl51.png', alt: 'До процедуры' },
    after: { src: '/images/sl52.png', alt: 'После процедуры' },
    thumb: { src: '/images/sl51.png', alt: 'Результат 1' },
  },
  {
    id: '2',
    before: { src: '/images/sl100.png', alt: 'До лечения' },
    after: { src: '/images/sl101.png', alt: 'После лечения' },
    thumb: { src: '/images/sl100.png', alt: 'Результат 2' },
  },
  {
    id: '3',
    before: { src: '/images/cr.png', alt: 'До процедуры' },
    after: { src: '/images/cr1.png', alt: 'После процедуры' },
    thumb: { src: '/images/cr.png', alt: 'Результат 3' },
  },
  {
    id: '4',
    before: { src: '/images/us1.png', alt: 'Исходное состояние' },
    after: { src: '/images/us2.png', alt: 'Результат процедуры' },
    thumb: { src: '/images/us1.png', alt: 'Результат 4' },
  },
  {
    id: '5',
    before: { src: '/images/sl1.png', alt: 'До' },
    after: { src: '/images/sl2.png', alt: 'После' },
    thumb: { src: '/images/sl1.png', alt: 'Результат 5' },
  },
  {
    id: '6',
    before: { src: '/images/pr.png', alt: 'До коррекции' },
    after: { src: '/images/pr1.png', alt: 'После коррекции' },
    thumb: { src: '/images/pr.png', alt: 'Результат 6' },
  },
]
  return (
    <div className='relative h-app min-h-0 flex-none w-screen bg-[#FFFCF3] overflow-hidden'>
      <div className="absolute inset-0" />

      {/* Центрированный контейнер */}
      <div className="absolute inset-0 flex items-center justify-center px-0 py-6 sm:px-4 sm:py-8 md:px-6 md:py-10 lg:px-8 lg:py-4%">
        <div className="w-full h-full flex items-center justify-center max-w-[95%] sm:max-w-[90%] md:max-w-[85%] lg:max-w-[80%] xl:max-w-[75%] 2xl:max-w-[84%]">
          <div className="w-full scale-[0.85] sm:scale-90 md:scale-95 lg:scale-100 origin-center">
            <BeforeAfter
              items={items}
              onButtonClick={() => console.log('go to section')}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

export default SliderSection6