'use client'
import React from 'react'
import StaticSection3 from '../SliderSection3'

export default function WhatMakesUsDifferent() {
  const features = [
    {
      bg: '#757F64',
      title: 'Уникальные 28-дневные маршруты',
      text: 'Каждая программа — это продуманный путь с ежедневными заданиями, поддержкой и мягкой динамикой'
    },
    {
      bg: '#CB7A5C',
      title: 'Финальные процедуры',
      text: 'В конце каждого маршрута — реальная услуга: массаж, уход или консультация'
    },
    {
      bg: '#F5F0E4',
      title: 'Возможность подарить заботу другим',
      text: 'Любой маршрут можно оформить как подарок — красиво, просто и с душевным посылом',
      textColor: '#636846'
    },
   
  ]

  return (
    <StaticSection3 src="">
      <div className='absolute flex w-full px-[4%] xs:px-[8%] h-[100dvh] items-center justify-center '>
        <div className='w-full max-w-[1400px] flex flex-col 1k:flex-row gap-4 sm:gap-8 1k:gap-12 items-center 1k:items-start'>
          {/* Заголовок слева */}
          <div className='w-full 1k:w-[35%] flex-shrink-0'>
            <h2 className='text-[#636846] text-[clamp(1.5rem,1rem+2vw,3rem)] hidden sm:flex font-ManropeBold leading-[1.2]'>
              Что нас отличает
            </h2>
          </div>

          {/* Карточки справа вертикальным стеком */}
          <div className='w-full 1k:w-[65%] flex flex-col  gap-2 sm:gap-4'>
            {features.map((feature, index) => (
              <div
                key={index}
                className='rounded-xl sm:rounded-[20px] p-4 1k:p-8 flex flex-col gap-3'
                style={{ backgroundColor: feature.bg }}
              >
                <h3
                  className='text-[clamp(1rem,0.8rem+0.8vw,1.25rem)] font-ManropeBold leading-[1.3]'
                  style={{ color: feature.textColor || '#FFFFFF' }}
                >
                  {feature.title}
                </h3>
                <p
                  className='text-[clamp(0.875rem,0.75rem+0.5vw,1rem)] font-ManropeRegular leading-[1.5]'
                  style={{ color: feature.textColor || '#FFFFFF' }}
                >
                  {feature.text}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </StaticSection3>
  )
}
