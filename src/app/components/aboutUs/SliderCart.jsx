'use client'
import React from 'react'
import { Swiper, SwiperSlide } from 'swiper/react'
import { FreeMode ,Pagination} from 'swiper/modules'
import 'swiper/css'
import 'swiper/css/pagination';
import 'swiper/css/free-mode'
import StaticSection3 from '../SliderSection3'
/* Cart импортируешь свой */
import Cart from './Cart'

export default function SliderCart() {
  return (
   <StaticSection3 key="3" src="">
  <div className="absolute inset-0 h-[100dvh] flex items-center justify-center px-[4%] 4xl:px-[14%]">

    {/* ≥ 1000px — твой старый блок без изменений */}
    <div className="hidden min-[1000px]:block w-full">
      <div className='grid grid-cols-2 md:grid-cols-4 gap-2 xl:gap-4 w-full'>
        <div className='"order-4 flex'>
          <Cart number="1" title="Простота">
            <>
              <span>Всё, что мы делаем —</span>
              <span>понятно, удобно</span>
              <span>и безопасно</span>
            </>
          </Cart>
        </div>

        <div className="order-3 flex">
          <Cart number="4" title="Поддержка">
            <>
              <span>Каждый маршрут </span>
              <span>сопровождается </span>
              <span>заботой — от первых </span>
              <span>шагов до финального </span>
              <span>результата</span>
            </>
          </Cart>
        </div>

        <div className="order-1 flex">
          <Cart number="2" title="Мягкость">
            <>
              <span>Мы не торопим, </span>
              <span>не сравниваем</span>
              <span>и не давим</span>
            </>
          </Cart>
        </div>

        <div className="order-2 flex">
          <Cart number="3" title="Осознанность">
            <>
              <span>Наши программы </span>
              <span>выстроены так,</span>
              <span>чтобы вести клиента</span>
              <span>к качественным и </span>
              <span>устойчивым переменам</span>
            </>
          </Cart>
        </div>
      </div>
    </div>

    {/* < 1000px — свайпер 1.5 слайда, без стрелок */}
    <div className="block 1k:hidden w-full">
      <Swiper
        
        modules={[Pagination]}
        grabCursor
        slidesPerView={2.5}  
        pagination={{
            el: '.slider-pag',     
            clickable: true,
            }}
         breakpoints={{

            

            481: { // начиная с 481px
            slidesPerView: 2,
            },
            0: { // от 0px до 480px
            slidesPerView: 1.5,
            },
  }}           // полтора слайда
        spaceBetween={16}               // отступы между карточками
        style={{ overflow: 'hidden', paddingBlock: '0.5rem' }}
      >
        <SwiperSlide className="!h-auto">
          <Cart number="1" title="Простота">
            <>
              <span>Всё, что мы делаем —</span>
              <span>понятно, удобно</span>
              <span>и безопасно</span>
            </>
          </Cart>
        </SwiperSlide>

        <SwiperSlide className="!h-auto ">
          <Cart number="4" title="Поддержка">
            <>
              <span>Каждый маршрут </span>
              <span>сопровождается </span>
              <span>заботой — от первых </span>
              <span>шагов до финального </span>
              <span>результата</span>
            </>
          </Cart>
        </SwiperSlide>

        <SwiperSlide className="!h-auto">
          <Cart number="2" title="Мягкость">
            <>
              <span>Мы не торопим, </span>
              <span>не сравниваем</span>
              <span>и не давим</span>
            </>
          </Cart>
        </SwiperSlide>

        <SwiperSlide className="!h-auto">
          <Cart number="3" title="Осознанность">
            <>
              <span>Наши программы </span>
              <span>выстроены так,</span>
              <span>чтобы вести клиента</span>
              <span>к качественным и </span>
              <span>устойчивым переменам</span>
            </>
          </Cart>
        </SwiperSlide>
      </Swiper>
      <div className="slider-pag mt-6 flex justify-center gap-2 transition-transform duration-500"></div>
      {/* Tailwind "вшитые" стили для bullets */}
     
     <style jsx global>{`
      .swiper-pagination-bullet {
        background-color: rgba(167,124,102,0.35) !important;
        width: 10px; height: 10px; border-radius: 9999px;
      }
      .swiper-pagination-bullet-active {
        background-color: #A77C66 !important;
        width: 26px; height: 10px; border-radius: 9999px;
        box-shadow: 0 0 8px rgba(167,124,102,.45);
      }
    `}</style>
    </div>
      

  </div>
</StaticSection3>

  )
}
