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
    <div className='relative h-app min-h-0 flex-none w-screen bg-[#FFFCF3]'>
      <div className="absolute inset-0" />

      {/* Центрированный контейнер */}
      <div className="absolute inset-0 flex items-center justify-center px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 py-8 md:py-12">
        <div className="w-full max-w-[90%] sm:max-w-[85%] md:max-w-[80%] lg:max-w-[75%] xl:max-w-[70%] 2xl:max-w-[1400px]">
          <BeforeAfter
            items={items}
            onButtonClick={() => console.log('go to section')}
          />
        </div>
      </div>
    </div>
  )
}

export default SliderSection6