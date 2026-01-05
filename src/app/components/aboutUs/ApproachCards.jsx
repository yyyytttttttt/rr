'use client'
import React from 'react'
import { Swiper, SwiperSlide } from 'swiper/react'
import { Pagination } from 'swiper/modules'
import 'swiper/css'
import 'swiper/css/pagination'
import StaticSection3 from '../SliderSection3'

export default function ApproachCards() {
  const cards = [
    {
      number: '1',
      title: 'Простота',
      text: 'Всё, что мы делаем — понятно, удобно и безопасно'
    },
    {
      number: '2',
      title: 'Поддержка',
      text: 'Каждый маршрут сопровождается заботой — от первых шагов до финального результата'
    },
    {
      number: '3',
      title: 'Мягкость',
      text: 'Мы не торопим, не сравниваем и не давим'
    },
    {
      number: '4',
      title: 'Осознанность',
      text: 'Наши программы выстроены так, чтобы вести клиента к качественным и устойчивым переменам'
    }
  ]

  const CardComponent = ({ card }) => (
    <div className='bg-[#F5F0E4] rounded-xl sm:rounded-[20px] p-4 sm:p-8 flex flex-col gap-2 h-full'>
      <div className='text-[#A77C66] text-[clamp(1.25rem,1.0769rem+0.7692vw,2rem)] mb-5 sm:mb-14 font-ManropeBold'>
        {card.number}
      </div>
      <h3 className='text-[#636846] text-[clamp(1.25rem,1.0769rem+0.7692vw,2rem)] font-ManropeBold'>
        {card.title}
      </h3>
      <p className='text-[#636846] text-[clamp(1rem,0.8846rem+0.5128vw,1.5rem)] font-ManropeRegular leading-normal'>
        {card.text}
      </p>
    </div>
  )

  return (
    <StaticSection3 src="">
      <div className='absolute flex w-full px-[4%] xs:px-[8%] h-[100dvh] items-center justify-center'>
        <div className='w-full max-w-[1430px]'>
          <h2 className='text-[#636846] text-[clamp(1.5rem,1rem+2vw,3rem)] font-ManropeBold mb-8'>
            Наш подход
          </h2>

          {/* Десктоп - сетка */}
          <div className='hidden 1k:grid grid-cols-2 xl:grid-cols-4 gap-4'>
            {cards.map((card) => (
              <CardComponent key={card.number} card={card} />
            ))}
          </div>

          {/* Мобилка - Swiper */}
          <div className='block 1k:hidden'>
            <Swiper
              modules={[Pagination]}
              grabCursor
              slidesPerView={1.5}
              spaceBetween={16}
              pagination={{
                el: '.approach-slider-pag',
                clickable: true,
              }}
              breakpoints={{
                481: {
                  slidesPerView: 2,
                },
                0: {
                  slidesPerView: 1.5,
                },
              }}
              style={{ overflow: 'hidden', paddingBlock: '0.5rem' }}
            >
              {cards.map((card) => (
                <SwiperSlide key={card.number} className="!h-auto">
                  <CardComponent card={card} />
                </SwiperSlide>
              ))}
            </Swiper>
            <div className="approach-slider-pag mt-6 flex justify-center gap-2 transition-transform duration-500"></div>

            <style jsx global>{`
              .swiper-pagination-bullet {
                background-color: rgba(167,124,102,0.35) !important;
                width: 10px;
                height: 10px;
                border-radius: 9999px;
              }
              .swiper-pagination-bullet-active {
                background-color: #A77C66 !important;
                width: 26px;
                height: 10px;
                border-radius: 9999px;
                box-shadow: 0 0 8px rgba(167,124,102,.45);
              }
            `}</style>
          </div>
        </div>
      </div>
    </StaticSection3>
  )
}
