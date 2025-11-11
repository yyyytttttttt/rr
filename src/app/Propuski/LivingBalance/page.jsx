'use client'

import React from 'react'
import LayoutOverlay3 from '../../components/LayoutOverlay3'
import FirstBlock from '../../components/propuski/FirstBlock'
import NewsItem from '../../components/News/NewsItem'
import { Swiper, SwiperSlide } from 'swiper/react'
import { Navigation, EffectCoverflow } from 'swiper/modules'
import Image from 'next/image'
import 'swiper/css'
import 'swiper/css/navigation'

const items = [
    {
    tag: 'Психология / Поддержка',
    time: '2 мин чтения',
    title: ['Живой баланс' 
    ],
    excerpt: [
        '28 дней простых шагов для увлажнения кожи.',
        'Подготовка, мягкий уход и маска для лица в подарок.',
        'Первые 20 участников получают программу ',
        'и бонус бесплатно.',
        'Пропуск здоровья возможно купить — 3 000 ₽, ',
        'условия программы сохраяются.'
    ],
    mesta:'Осталось 20 мест',
    
    cta: 'Начать бесплатно',
    cta1:'Купить ',
    href: '/blog/psy-online',
    image: '/images/pr1.png',
    },
 
]
const cards = [
  { id: '1', img: '/images/cr.png', title: 'Живой баланс', desc: 'Глубокое увлажнение кожи и маска для лица в подарок' },
  { id: '2', img: '/images/cr1.png', title: 'Новое сияние',  desc: 'Очищение кожи и профессиональная чистка лица в подарок' },
  { id: '3', img: '/images/cr2.png', title: 'Улыбка души',   desc: 'Снятие напряжения и консультация психолога в подарок' },
  { id: '4', img: '/images/cr3.png', title: 'Тихая сила',     desc: 'Мягкое восстановление тонуса и сияния кожи' },
]

const page = () => {
  return (
    <LayoutOverlay3 title="пропуск к здоровью">
          <nav aria-label="Breadcrumb" className="mb-[4%] px-[4%] 2xl:px-[8%] lg:mb-[1%]">
              <ol className="flex items-center font-ManropeMedium text-[clamp(0.9375rem,0.8352rem+0.4545vw,1.5625rem)]   gap-3  text-[#A08973]">
                <li className="opacity-70 hidden  xs:block">Главная</li>
                <li className='hidden  xs:block' aria-hidden>›</li>
                <li className="opacity-70">Пропуски здоровья</li>
                 <li aria-hidden>›</li>
                
                 
                 <li className="text-[#967450]">Живой баланс</li>
              </ol>
            </nav>
                    <div className='px-[4%] 2xl:px-[8%] mb-4'>
                        {items.map((it, i) => (
                                    <FirstBlock key={it.id ?? i} item={it}  />
                                    ))}
                    </div>
                    <p className='px-[4%] 2xl:px-[8%] mb-4 xs:mb-8  text-[#636846] text-[clamp(0.875rem,0.55rem+1.625vw,2.5rem)] font-ManropeBold'>Доступные пропуски</p>
            <div className='px-[4%] 2xl:px-[8%] hidden 2xl:grid gap-6 grid-cols-3'>
                <NewsItem
                imageSrc="/images/pr2.png"
                imageAlt="Новый баннер"
                desc='Очищение кожи и профессиональная'
                desc1='чистка лица в подарок'
                
                titleTop="Новое сияние"
                
                ctaHref="/news/1"
                ctaLabel="Узнать больше"
                
                />  
                <NewsItem
                imageSrc="/images/pr3.png"
                imageAlt="Новый баннер"
                desc='Очищение кожи и профессиональная'
                desc1='чистка лица в подарок'
                
                titleTop="Улыбка души "
                
                ctaHref="/news/1"
                ctaLabel="Узнать больше"
                
                />  
               <NewsItem
                imageSrc="/images/pr4.png"
                imageAlt="Новый баннер"
                desc='Очищение кожи и профессиональная'
                desc1='чистка лица в подарок'
                
                titleTop="Заново в теле"
                
                ctaHref="/news/1"
                ctaLabel="Узнать больше"
                
                />  


            </div>     
            <div className="block 2xl:hidden  relative">
        {/* Стрелки */}
            <div className="absolute left-[4%] -bottom-10 2xl:-bottom-20  z-10 flex gap-3">
              <button
                className="nav-prev w-[20px] xs:w-[25px] h-[20px] xs:h-[25px] 2xl:w-[40px]  2xl:h-[40px] rounded-full bg-[#EDE6D7] text-[#967450] flex items-center justify-center shadow-sm hover:bg-[#E6DDC9] active:scale-95 transition"
                aria-label="Назад"
              >
                <svg className="w-full h-auto -translate-x-[1px]" viewBox="0 0 24 24" fill="none">
                  <path d="M15 6L9 12L15 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
              <button
                className="nav-next w-[20px] xs:w-[25px] h-[20px] xs:h-[25px] 2xl:w-[40px]  2xl:h-[40px] rounded-full bg-[#EDE6D7] text-[#967450] flex items-center justify-center shadow-sm hover:bg-[#E6DDC9] active:scale-95 transition"
                aria-label="Вперёд"
              >
                <svg className="w-full h-auto translate-x-[1px]" viewBox="0 0 24 24" fill="none">
                  <path d="M9 6L15 12L9 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>

        <div className='pl-[4%]'>
          <Swiper
              modules={[Navigation, EffectCoverflow]}
                navigation={{ prevEl: '.nav-prev', nextEl: '.nav-next' }}
                
                loop={true}
                grabCursor={true}

                spaceBetween={24}
                slidesPerView={2.1}
                slidesPerGroup={1}
                slideToClickedSlide={true}
                 
                  allowTouchMove={true}
                  simulateTouch={true}

                  /* приятные ощущения при драге (необязательно) */
                  // freeMode={{ enabled: true, momentum: true, sticky: false }}

                  /* мелкие твики драга */
                  touchStartPreventDefault={false}  // чтобы кликабельные элементы внутри работали
                  threshold={5}                     // чуть «усилия» для старта
                  longSwipesMs={200}
                  longSwipesRatio={0.3}
                  resistanceRatio={0.65}

                /* Анимация */
                speed={600}
                

                breakpoints={{
                  320: { slidesPerView: 2.1, spaceBetween: 8 },
                  
                  
                  1280: { slidesPerView: 2.1, spaceBetween: 28 },
                }}
              className="!overflow-hidden swiper-equal my-fade touch-pan-y"
            >
              {cards.map((c) => (
                <SwiperSlide key={c.id} className="!h-auto">
                  <article className="h-full bg-[#EFE9DB] rounded-[10px]  lg:rounded-[18px] overflow-hidden shadow-[0_2px_10px_rgba(0,0,0,0.04)]">
                    <div className="aspect-[5/3] relative">
                      <Image
                        src={c.img}
                        alt={c.title}
                        fill
                        className="object-cover"
                        sizes="(max-width: 1024px) 80vw, 40vw"
                      />
                    </div>
                    <div className="p-2 md:p-6 flex flex-col l card-body">
                      <h3 className="text-[#636846] font-ManropeBold text-[clamp(0.75rem,0.4615rem+1.2821vw,2rem)] mb-2">
                        {c.title}
                      </h3>
                      <p className="text-[#636846] font-ManropeRegular text-[clamp(0.75rem,0.5769rem+0.7692vw,1.5rem)]  ">
                        {c.desc}
                      </p>
                      <button className="mt-4  items-center justify-center rounded-[5px] xs:rounded-[10px] bg-[#586244] text-[#F7F4EA] text-[clamp(0.625rem,0.4808rem+0.641vw,1.25rem)] px-[4%] py-[4%] font-ManropeRegular hover:scale-[0.98] active:scale-[0.98] transition">
                        Узнать больше
                      </button>
                    </div>
                  </article>
                </SwiperSlide>
              ))}
            </Swiper>
        </div>
      </div>

      {/* выравнивание высоты слайдов под самую высокую карточку */}
     <style jsx global>{`
  /* как и было — равные высоты */
  .swiper-equal .swiper-wrapper { align-items: stretch; }
  .swiper-equal .swiper-slide > * { height: 100%; }

  /* плавное появление элементов внутри активного слайда */
  .my-fade .card-body > * {
    opacity: 0.5;
    transform: translateY(10px);
    transition: opacity .45s ease, transform .45s ease;
  }
  /* активный слайд */
  .my-fade .swiper-slide-active .card-body > * {
    opacity: 1;
    transform: translateY(0);
  }
  /* ступенчатые задержки */
  .my-fade .swiper-slide-active .card-body > :nth-child(1) { transition-delay: .05s; }
  .my-fade .swiper-slide-active .card-body > :nth-child(2) { transition-delay: .15s; }
  .my-fade .swiper-slide-active .card-body > :nth-child(3) { transition-delay: .25s; }
`}</style>
            <div className='h-20'> </div>   
        
    </LayoutOverlay3>
  )
}

export default page