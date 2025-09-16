'use client'
import React from 'react'
import { Swiper, SwiperSlide } from 'swiper/react'
import { FreeMode ,Pagination} from 'swiper/modules'
import 'swiper/css'
import Image from 'next/image'
import 'swiper/css/pagination';
import 'swiper/css/free-mode'
import StaticSection3 from '../SliderSection3'
/* Cart импортируешь свой */
import Cart from './Cart'

export default function block3() {
  return (
   <StaticSection3 key="6">
    {/* overlay-слой: растягиваемся на весь viewport и прижимаем контент к низу */}
    <div className="absolute inset-0 flex items-end h-[100dvh]">
  
      {/* Справа — изображение (на мобилке на всю ширину, на xl — 50%) */}
      <Image
        onClick={() => setOpen(!open)}
        src="/images/sl101.png"
        alt="Меню"
        width={768}
        height={1024}
        className="absolute right-0 top-0 h-full w-full xl:w-1/2 object-cover z-[5]"
        priority
      />
  
      {/* Контейнер контента по низу (центрируем по сетке, учитываем safe-area) */}
      <div className="relative  z-[10] w-full">
        <div className="
          mx-auto w-full max-w-[1410px]
          
          
        ">
          <div className="bg-white flex flex-col xs:hidden w-full py-6 px-6 shadow-[0_8px_40px_rgba(0,0,0,0.12)]">
            <p className="text-[#636846] text-[clamp(0.875rem,0.55rem+1.625vw,2.5rem)] font-ManropeBold mb-4 leading-[1.15]">
              <span className="block">Всё начинается с разрешения быть собой</span>
              
            </p>
  
            <p className="text-[clamp(0.75rem,0.65rem+0.5vw,1.25rem)] font-ManropeRegular text-[#636846] mb-4 leading-[1.4]">
              <span className="block">Мы не обещаем идеальное тело или вечную молодость. </span>
              <span className="block">Мы создаём пространство,где можно выбрать себя —</span>
              <span className="block">без спешки, без стресса, по-настоящему</span>
             
            </p>
  
            <div className="flex gap-4">
              <button className="rounded-[5px] bg-[#F5F0E4] w-full text-[#967450] px-[6%] py-[3%] font-ManropeRegular text-[clamp(0.75rem,0.65rem+0.5vw,1.25rem)] transition-transform duration-300 hover:scale-[1.02] active:scale-[0.98]">
                Перейти к услугам
              </button>
            </div>
            <div className='bg-white h-[10dvh]'></div>
          </div>
        
        </div>
      </div>
       <div className="absolute z-[10] left-[8%] top-1/2 -translate-y-1/2">
        <div className="
          mx-auto 
          
          
        ">
          <div className=" hidden bg-white px-8 py-8 rounded-[20px] flex-col gap-4  xs:flex w-full ">
            <p className="text-[#636846] text-[clamp(0.875rem,0.55rem+1.625vw,2.5rem)] font-ManropeBold mb-4 leading-[1.15]">
              <span className="block">Всё начинается </span>
              <span>с разрешения быть собой</span>
              
            </p>
  
            <p className="text-[clamp(0.75rem,0.65rem+0.5vw,1.25rem)] font-ManropeRegular text-[#636846] mb-4 leading-[1.4]">
              <span className="block">Мы не обещаем идеальное тело или вечную </span>
              <span className="block">молодость. Мы создаём пространство,</span>
              <span className="block">где можно выбрать себя — без спешки,</span>
              <span>без стресса, по-настоящему.</span>
             
            </p>
  
            <div className="flex gap-4">
              <button className="rounded-[5px] bg-[#636846] text-white px-[6%] py-[3%] font-ManropeRegular text-[clamp(0.75rem,0.65rem+0.5vw,1.25rem)] transition-transform duration-300 hover:scale-[1.02] active:scale-[0.98]">
                Перейти к услугам
              </button>
            </div>
           
          </div>
        
        </div>
      </div>
    </div>
  </StaticSection3>

  )
}
