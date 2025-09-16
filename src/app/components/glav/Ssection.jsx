'use client'
import React, { useEffect, useState } from 'react'
import StaticSection3 from '../SliderSection3'

function useIsMobile(maxWidth = 480) {
  const [isMobile, setIsMobile] = useState(false)
  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth <= maxWidth)
    onResize()
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [maxWidth])
  return isMobile
}

export default function Ssection() {
  const isMobile = useIsMobile(480)

  // Оверлей №1 (состоит из трёх блоков: правый, нижний mobile, левый)
  const overlay1 = (
    <>
      {/* правый, скрыт на мобилке */}
      <div className="hidden xs:flex flex-col absolute top-1/2 right-[4%] -translate-y-1/2 rounded-[20px] bg-[#CFC4A6] py-[2%] px-[2%]">
        <p className="text-[#636846] text-[clamp(0.875rem,0.55rem+1.625vw,2.5rem)] font-[Manrope-Bold] mb-4 flex flex-col">
          <span>Подарок ко дню рождения</span>
        </p>
        <p className="text-[clamp(0.75rem,0.65rem+0.5vw,1.25rem)] font-[Manrope-Regular] flex flex-col mb-4 text-[#636846]">
          <span>Твой месяц — твои подарки</span>
          <span>Мы подготовили для тебя особые сюрпризы, чтобы этот</span>
          <span>период был наполнен заботой и радостью.</span>
        </p>
        <div className="flex gap-4">
          <button className="rounded-[5px] bg-[#636846] text-[#F7EFE5] px-[6%] py-[3%] font-[Manrope-Regular] text-[clamp(0.75rem,0.65rem+0.5vw,1.25rem)]">
            Узнать подробнее
          </button>
          <button className="rounded-[5px] bg-[#F7EFE5] text-[#967450] px-[6%] py-[3%] font-[Manrope-Regular] text-[clamp(0.75rem,0.65rem+0.5vw,1.25rem)]">
            Написать в чат
          </button>
        </div>
      </div>

      {/* нижний контейнер — только мобильный текстовый блок */}
      <div className="absolute  bottom-0 z-[10] w-full">
        <div className="mx-auto w-full max-w-[1410px]">
          <div className="bg-white flex flex-col xs:hidden w-full py-6 px-6 shadow-[0_8px_40px_rgba(0,0,0,0.12)]">
            <p className="text-[#636846] text-[clamp(0.875rem,0.55rem+1.625vw,2.5rem)] font-[Manrope-Bold] mb-4 flex flex-col">
          <span>Подарок ко дню рождения</span>
        </p>
        <p className="text-[clamp(0.75rem,0.65rem+0.5vw,1.25rem)] font-[Manrope-Regular] flex flex-col mb-4 text-[#636846]">
          <span>Твой месяц — твои подарки</span>
          <span>Мы подготовили для тебя особые сюрпризы, чтобы этот</span>
          <span>период был наполнен заботой и радостью.</span>
        </p>
        <div className="flex gap-4">
          <button className="rounded-[5px] bg-[#636846] text-[#F7EFE5] px-[6%] py-[3%] font-[Manrope-Regular] text-[clamp(0.75rem,0.65rem+0.5vw,1.25rem)]">
            Узнать подробнее
          </button>
          <button className="rounded-[5px] bg-[#F7EFE5] text-[#967450] px-[6%] py-[3%] font-[Manrope-Regular] text-[clamp(0.75rem,0.65rem+0.5vw,1.25rem)]">
            Написать в чат
          </button>
            </div>
            <div className="bg-white h-[8dvh]" />
          </div>
        </div>
      </div>

     
      
    </>
  )

  // Оверлей №2
  const overlay2 = (
    <>
        <div className="absolute top-1/2 right-[4%] hidden xs:flex flex-col -translate-y-1/2 rounded-[20px] bg-[#CFC4A6] py-[2%] px-[2%]">
          <p className="text-[#636846] text-[clamp(0.875rem,0.55rem+1.625vw,2.5rem)] font-[Manrope-Bold] mb-4 flex flex-col">
            <span>Сила природы</span>
          </p>
          <p className="text-[clamp(0.75rem,0.65rem+0.5vw,1.25rem)] font-[Manrope-Regular] flex flex-col mb-4 text-[#636846]">
            <span>Мы используем только естественные компоненты, </span>
            <span>чтобы каждая процедура наполняла </span>
            <span>тебя свежестью и гармонией.</span>
          </p>
          <div className="flex gap-4">
            <button className="rounded-[5px] bg-[#636846] text-[#F7EFE5] px-[6%] py-[3%] font-[Manrope-Regular] text-[clamp(0.75rem,0.65rem+0.5vw,1.25rem)]">
              Узнать подробнее
            </button>
            <button className="rounded-[5px] bg-[#F7EFE5] text-[#967450] px-[6%] py-[3%] font-[Manrope-Regular] text-[clamp(0.75rem,0.65rem+0.5vw,1.25rem)]">
              Написать в чат
            </button>
          </div>
        </div>
         {/* нижний контейнер — только мобильный текстовый блок */}
          <div className="absolute  bottom-0 z-[10] w-full">
            <div className="mx-auto w-full max-w-[1410px]">
              <div className="bg-white flex flex-col xs:hidden w-full py-6 px-6 shadow-[0_8px_40px_rgba(0,0,0,0.12)]">
                <p className="text-[#636846] text-[clamp(0.875rem,0.55rem+1.625vw,2.5rem)] font-[Manrope-Bold] mb-4 flex flex-col">
              <span>Сила природы</span>
            </p>
            <p className="text-[clamp(0.75rem,0.65rem+0.5vw,1.25rem)] font-[Manrope-Regular] flex flex-col mb-4 text-[#636846]">
              <span>Мы используем только естественные компоненты,</span>
              <span>чтобы каждая процедура наполняла</span>
              <span>тебя свежестью и гармонией..</span>
            </p>
            <div className="flex gap-4">
             <button className='rounded-[5px] bg-[#636846] text-[#F7EFE5] px-[6%] py-[3%] font-[Manrope-Regular] text-[clamp(0.75rem,0.65rem+0.5vw,1.25rem)]'> Узнать подробнее </button> <button className='rounded-[5px] bg-[#F7EFE5] text-[#967450] px-[6%] py-[3%] font-[Manrope-Regular] text-[clamp(0.75rem,0.65rem+0.5vw,1.25rem)]'> Написать в чат </button>
                </div>
                <div className="bg-white h-[8dvh]" />
              </div>
            </div>
          </div>
    </>
    
  )

  // Оверлей №3
  const overlay3 = (
    <div>
        <div className="absolute top-1/2 hidden xs:flex flex-col right-[4%] -translate-y-1/2 rounded-[20px] bg-[#CFC4A6] py-[2%] px-[2%]">
          <p className="text-[#636846] text-[clamp(0.875rem,0.55rem+1.625vw,2.5rem)] font-[Manrope-Bold] mb-4 flex flex-col">
            <span>Ты — центр</span>
            <span>этого пространства</span>
          </p>
          <p className="text-[clamp(0.75rem,0.65rem+0.5vw,1.25rem)] font-[Manrope-Regular] flex flex-col mb-4 text-[#636846]">
            <span>«Новая Я» — это не просто эстетика и стиль, Это</span>
            <span>сопровождение, поддержка и услуги,которые помогают</span>
            <span>выбрать себя заново. Запишись — не для того, чтобы</span>
            <span>изменить себя, а чтобы наконец-то услышать.</span>
          </p>
          <div className="flex gap-4">
            <button className="rounded-[5px] bg-[#636846] text-[#F7EFE5] px-[6%] py-[3%] font-[Manrope-Regular] text-[clamp(0.75rem,0.65rem+0.5vw,1.25rem)]">
              Выбрать услугу
            </button>
            <button className="rounded-[5px] bg-[#F7EFE5] text-[#967450] px-[6%] py-[3%] font-[Manrope-Regular] text-[clamp(0.75rem,0.65rem+0.5vw,1.25rem)]">
              Написать в чат
            </button>
          </div>
        </div>
        {/* нижний контейнер — только мобильный текстовый блок */}
              <div className="absolute  bottom-0 z-[10] w-full">
                <div className="mx-auto w-full max-w-[1410px]">
                  <div className="bg-white flex flex-col xs:hidden w-full py-6 px-6 shadow-[0_8px_40px_rgba(0,0,0,0.12)]">
                     <p className="text-[#636846] text-[clamp(0.875rem,0.55rem+1.625vw,2.5rem)] font-[Manrope-Bold] mb-4 flex flex-col">
            <span>Ты — центр</span>
            <span>этого пространства</span>
          </p>
          <p className="text-[clamp(0.75rem,0.65rem+0.5vw,1.25rem)] font-[Manrope-Regular] flex flex-col mb-4 text-[#636846]">
            <span>«Новая Я» — это не просто эстетика и стиль, Это</span>
            <span>сопровождение, поддержка и услуги,которые помогают</span>
            <span>выбрать себя заново. Запишись — не для того, чтобы</span>
            <span>изменить себя, а чтобы наконец-то услышать.</span>
          </p>
          <div className="flex gap-4">
            <button className="rounded-[5px] bg-[#636846] text-[#F7EFE5] px-[6%] py-[3%] font-[Manrope-Regular] text-[clamp(0.75rem,0.65rem+0.5vw,1.25rem)]">
              Выбрать услугу
            </button>
            <button className="rounded-[5px] bg-[#F7EFE5] text-[#967450] px-[6%] py-[3%] font-[Manrope-Regular] text-[clamp(0.75rem,0.65rem+0.5vw,1.25rem)]">
              Написать в чат
            </button>
          </div>
                    <div className="bg-white h-[8dvh]" />
                  </div>
                </div>
              </div>
    </div>
  )

  const images = isMobile
    ? ['/images/mobile1.mp4','/video/ad.mp4', '/images/mobile2.png']
    : ['/video/sl2.mp4', '/video/ad.mp4', '/images/sl20.png']

  const overlays = isMobile ? [overlay1, overlay2, overlay3] : [overlay1, overlay2, overlay3]

  return (
    <div>
      <StaticSection3 key="1" images={images} overlays={overlays} />
    </div>
  )
}
