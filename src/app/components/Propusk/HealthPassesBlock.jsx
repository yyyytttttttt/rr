'use client'
import Link from 'next/link'
import Image from 'next/image'
import { Swiper, SwiperSlide } from 'swiper/react'
import { Navigation, EffectCoverflow } from 'swiper/modules'
import 'swiper/css'
import 'swiper/css/navigation'


// Пример данных
const cards = [
  { id: '1', img: '/images/cr.png', title: 'Живой баланс', desc: 'Глубокое увлажнение кожи и маска для лица в подарок' },
  { id: '2', img: '/images/cr1.png', title: 'Новое сияние',  desc: 'Очищение кожи и профессиональная чистка лица в подарок' },
  { id: '3', img: '/images/cr2.png', title: 'Улыбка души',   desc: 'Снятие напряжения и консультация психолога в подарок' },
  { id: '4', img: '/images/cr3.png', title: 'Тихая сила',     desc: 'Мягкое восстановление тонуса и сияния кожи' },
]

export default function HealthPassesBlock() {
  return (
    <section className=" mb-[6%] lg:pl-[8%]">
      <nav aria-label="Breadcrumb" className="mb-[4%] px-[4%] lg:px-0 lg:mb-[1%]">
              <ol className="flex items-center font-ManropeMedium text-[clamp(0.9375rem,0.8352rem+0.4545vw,1.5625rem)]   gap-3  text-[#A08973]">
                <li className="opacity-70">Главная</li>
                <li aria-hidden>›</li>
                <li className="text-[#967450]">Пропуски здоровья</li>
              </ol>
            </nav>
      <div className=" ">
        <div className="grid grid-cols-1 lg:grid-cols-[0.9fr_1.5fr] gap-2  items-center">
          
          {/* Левая колонка (пример) */}
          <div className='w-full lg:w-fit min-w-0 px-[4%] lg:px-0  order-2 lg:order-1'>
            
            <div className='py-[4%] lg:py-0 px-[4%] lg:px-0 bg-[#F5F0E4] lg:bg-white rounded-[10px]'>
              <h2 className="text-[#586244]  font-ManropeBold  lg:flex-col w-fit flex gap-2 text-[clamp(1rem,0.6538rem+1.5385vw,2.5rem)] leading-tight mb-2 lg:mb-5">
                <div className='hidden lg:flex flex-col'>
                  <span>Пространство</span>
                  <span>заботы о себе</span>
                </div>
                <span className='flex lg:hidden'>Пространство заботы о себе</span>
              </h2>
              <p className="text-[#6B6F5A] font-ManropeRegular w-full    gap-0 lg:gap-2 hidden xs:flex flex-col text-[clamp(0.75rem,0.5769rem+0.7692vw,1.5rem)]  leading-5 xs:leading-7 ">
                <span>Это 28-дневный маршрут,</span>
                <span>который помогает выстроить</span>
                <span>заботу о себе — через уход,</span>
                <span>внимание и финальную процедуру,</span>
                <span>которая завершает путь</span>
                <span>ощущением целостности.</span>
              </p>
              <p className="text-[#6B6F5A] font-ManropeRegular w-full    gap-0 lg:gap-2 flex xs:hidden flex-col text-[clamp(0.75rem,0.5769rem+0.7692vw,1.5rem)]  leading-5 xs:leading-7 ">
                <span>Это 28-дневный маршрут,</span>
                <span>который помогает выстроить</span>
                <span>заботу о себе — через уход, внимание</span>
                <span>внимание и финальную процедуру,</span>
                <span>которая завершает пройденный путь.</span>
                
              </p>
            </div>
          </div>

          {/* Правая колонка — слайдер */}
          <div className="relative order-1 mb-[10%] xs:mb-[8%] lg:mb-0 lg:order-2 pl-[4%]    lg:pr-0  min-w-0 ">

            {/* Стрелки */}
            <div className="absolute -bottom-8 xs:-bottom-10 2xl:-bottom-20  z-10 flex gap-3">
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

            <Swiper
              modules={[Navigation, EffectCoverflow]}
                navigation={{ prevEl: '.nav-prev', nextEl: '.nav-next' }}
                
                loop={true}
                grabCursor={true}

                spaceBetween={24}
                slidesPerView={2.5}
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
                  320: { slidesPerView: 2, spaceBetween: 8 },
                  
                  
                  1280: { slidesPerView: 2.5, spaceBetween: 28 },
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
                    <div className="p-5 md:p-6 flex flex-col l card-body">
                      <h3 className="text-[#636846] font-ManropeBold text-[clamp(0.75rem,0.4615rem+1.2821vw,2rem)] mb-2">
                        {c.title}
                      </h3>
                      <p className="text-[#636846] font-ManropeRegular text-[clamp(0.75rem,0.5769rem+0.7692vw,1.5rem)]  ">
                        {c.desc}
                      </p>
                      <Link href="/Propuski/LivingBalance" className="mt-4  items-center flex justify-center rounded-[5px] xs:rounded-[10px] bg-[#586244] text-[#F7F4EA] text-[clamp(0.625rem,0.4808rem+0.641vw,1.25rem)] px-[4%] py-[4%] font-ManropeRegular hover:scale-[0.98] active:scale-[0.98] transition">
                        Узнать больше
                      </Link>
                    </div>
                  </article>
                </SwiperSlide>
              ))}
            </Swiper>
          </div>
        </div>
      </div>

      {/* равная высота слайдов (без Tailwind @apply) */}
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
    </section>
  )
}
