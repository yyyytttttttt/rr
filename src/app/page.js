'use client'
import React, { useState, useEffect, useMemo } from 'react'
import { motion } from 'framer-motion'
import SliderSection from './components/SliderSection1'
import SliderSection2 from './components/SliderSection2'
import StaticSection3 from './components/SliderSection3'
import LayoutOverlay from './components/LayoutOverlay'
import { usePagedScroll } from './hooks/usePagedScroll'
import Image from 'next/image'

// мини-хук
function useIsMobile(maxWidth = 480) {
  const [isMobile, setIsMobile] = useState(false)
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth <= maxWidth)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [maxWidth])
  return isMobile
}

export default function FullPageScroll() {
  const isMobile = useIsMobile(480)

  // формируем секции (важно: зависимость от isMobile!)
  const sections = useMemo(() => ([
   <SliderSection
      key="1"
      
      images={isMobile 
    ? ["/images/mobile1.mp4", "/images/mobile2.png"] 
    : ["/video/sl2.mp4","/video/ad.mp4", "/images/sl20.png"]
    
}
 overlays={[
    (
      <div className='absolute top-1/2 right-[4%] -translate-y-1/2 rounded-[20px]
                             
                              bg-[#CFC4A6] py-[2%] px-[2%]'>
        <p className='text-[#636846] text-[clamp(0.875rem,0.55rem+1.625vw,2.5rem)] font-[Manrope-Bold] mb-4 flex flex-col'>
          <span>Подарок ко дню рождения</span>
          
        </p>
        <p className='text-[clamp(0.75rem,0.65rem+0.5vw,1.25rem)] font-[Manrope-Regular] flex flex-col mb-4 text-[#636846]'>
          <span>Твой месяц — твои подарки</span>
          <span>Мы подготовили для тебя особые сюрпризы, чтобы этот</span>
          <span>период был наполнен заботой и радостью.</span>
          
        </p>
        <div className='flex gap-4'>
          <button className='rounded-[5px] bg-[#636846] text-[#F7EFE5] px-[6%] py-[3%] font-[Manrope-Regular] text-[clamp(0.75rem,0.65rem+0.5vw,1.25rem)]'>
            Узнать подробнее
          </button>
          <button className='rounded-[5px] bg-[#F7EFE5] text-[#967450] px-[6%] py-[3%] font-[Manrope-Regular] text-[clamp(0.75rem,0.65rem+0.5vw,1.25rem)]'>
            Написать в чат
          </button>
        </div>
      </div>
    ),
    (
      <div className='absolute top-1/2 right-[4%] -translate-y-1/2 rounded-[20px]
                             
                              bg-[#CFC4A6] py-[2%] px-[2%]'>
        <p className='text-[#636846] text-[clamp(0.875rem,0.55rem+1.625vw,2.5rem)] font-[Manrope-Bold] mb-4 flex flex-col'>
          <span>Сила природы</span>
          
        </p>
        <p className='text-[clamp(0.75rem,0.65rem+0.5vw,1.25rem)] font-[Manrope-Regular] flex flex-col mb-4 text-[#636846]'>
          <span>Мы используем только естественные компоненты, </span>
          <span>чтобы каждая процедура наполняла </span>
          <span>тебя свежестью и гармонией.</span>
        </p>
        <div className='flex gap-4'>
          <button className='rounded-[5px] bg-[#636846] text-[#F7EFE5] px-[6%] py-[3%] font-[Manrope-Regular] text-[clamp(0.75rem,0.65rem+0.5vw,1.25rem)]'>
            Узнать подробнее
          </button>
          <button className='rounded-[5px] bg-[#F7EFE5] text-[#967450] px-[6%] py-[3%] font-[Manrope-Regular] text-[clamp(0.75rem,0.65rem+0.5vw,1.25rem)]'>
            Написать в чат
          </button>
        </div>
      </div>
    ),
    (
      <div className='absolute top-1/2 right-[4%] -translate-y-1/2 rounded-[20px]
                             
                              bg-[#CFC4A6] py-[2%] px-[2%]'>
        <p className='text-[#636846] text-[clamp(0.875rem,0.55rem+1.625vw,2.5rem)] font-[Manrope-Bold] mb-4 flex flex-col'>
          <span>Ты — центр</span>
          <span>этого пространства</span>
          
        </p>
        <p className='text-[clamp(0.75rem,0.65rem+0.5vw,1.25rem)] font-[Manrope-Regular] flex flex-col mb-4 text-[#636846]'>
          <span>«Новая Я» — это не просто эстетика и стиль, Это  </span>
          <span>сопровождение, поддержка и услуги,которые помогают </span>
          <span>выбрать себя заново. Запишись — не для того, чтобы </span>
          <span>изменить себя, а чтобы наконец-то услышать.</span>
        </p>
        <div className='flex gap-4'>
          <button className='rounded-[5px] bg-[#636846] text-[#F7EFE5] px-[6%] py-[3%] font-[Manrope-Regular] text-[clamp(0.75rem,0.65rem+0.5vw,1.25rem)]'>
            Выбрать услугу
          </button>
          <button className='rounded-[5px] bg-[#F7EFE5] text-[#967450] px-[6%] py-[3%] font-[Manrope-Regular] text-[clamp(0.75rem,0.65rem+0.5vw,1.25rem)]'>
            Написать в чат
          </button>
        </div>
      </div>
    ),
  ]}
    />,
     <StaticSection3 src="/images/sl2.png">
         <div className='absolute top-1/2 left-[14%] -translate-y-1/2 rounded-[20px]
                            
                              bg-[#CFC4A6] py-[2%] px-[2%]'>
        <p className='text-[#636846] text-[clamp(0.875rem,0.55rem+1.625vw,2.5rem)] font-[Manrope-Bold] mb-4 flex flex-col'>
          Новости клиники
        </p>
        <p className='text-[clamp(0.75rem,0.65rem+0.5vw,1.25rem)] font-[Manrope-Regular] flex flex-col mb-4 text-[#636846]'>
          <span>Мы не просто ведём соцсети — </span>
          <span>мы создаём пространство, где вы</span>
          <span>можете читать, вдохновляться, </span>
          <span>выбирать и чувствовать себя </span>
          <span>частью чего-то настоящего. </span>
        </p>
        <div className='flex gap-4'>
          <button className='rounded-[5px] bg-[#F7EFE5] text-[#967450] px-[6%] py-[3%] font-[Manrope-Regular] text-[clamp(0.75rem,0.65rem+0.5vw,1.25rem)]'>
            Перейти в раздел
          </button>
          
        </div>
      </div>
      </StaticSection3>,
    <StaticSection3 src="/images/sl3.png">
         <div className='absolute top-1/2 left-[14%] -translate-y-1/2 rounded-[20px]
                            
                              bg-[#CFC4A6] py-[2%] px-[2%]'>
        <p className='text-[#636846] text-[clamp(0.875rem,0.55rem+1.625vw,2.5rem)] font-[Manrope-Bold] mb-4 flex flex-col'>
          Наши услуги
        </p>
        <p className='text-[clamp(0.75rem,0.65rem+0.5vw,1.25rem)] font-[Manrope-Regular] flex flex-col mb-4 text-[#636846]'>
          <span>Красота, спокойствие и уверенность — всё  </span>
          <span>начинается с заботы о себе.</span>
          <span>Выбери то, что откликается именно тебе. </span>
          
        </p>
        <div className='flex gap-4'>
          <button className='rounded-[5px] bg-[#636846] text-[#F7EFE5] px-[6%] py-[3%] font-[Manrope-Regular] text-[clamp(0.75rem,0.65rem+0.5vw,1.25rem)]'>
            Выбрать услугу
          </button>
          <button className='rounded-[5px] bg-[#F7EFE5] text-[#967450] px-[6%] py-[3%] font-[Manrope-Regular] text-[clamp(0.75rem,0.65rem+0.5vw,1.25rem)]'>
            Написать в чат
          </button>
          
        </div>
      </div>
      </StaticSection3>,
     
      
     
      
      
    <SliderSection2>
      <div className='absolute top-1/2 left-[14%] -translate-y-1/2 rounded-[20px]
                                     
                                      bg-[#CFC4A6] py-[2%] px-[2%]'>
                <p className='text-[#636846] text-[clamp(0.875rem,0.55rem+1.625vw,2.5rem)] font-[Manrope-Bold] mb-4 flex flex-col'>
                  <span>Ты — центр</span>
                  <span>этого пространства</span>
                </p>
                <p className='text-[clamp(0.75rem,0.65rem+0.5vw,1.25rem)] font-[Manrope-Regular] flex flex-col mb-4 text-[#636846]'>
                  <span>«Новая Я» — это не просто эстетика и стиль</span>
                  <span>Это сопровождение, поддержка и услуги,</span>
                  <span>которые помогают выбрать себя заново.</span>
                  <span>Запишись — не для того, чтобы изменить себя,</span>
                  <span>а чтобы наконец-то услышать.</span>
                </p>
                <div className='flex gap-4'>
                  <button className='rounded-[5px] bg-[#636846] text-[#F7EFE5] px-[6%] py-[3%] font-[Manrope-Regular] text-[clamp(0.75rem,0.65rem+0.5vw,1.25rem)]'>
                    Выбрать услугу
                  </button>
                  <button className='rounded-[5px] bg-[#F7EFE5] text-[#967450] px-[6%] py-[3%] font-[Manrope-Regular] text-[clamp(0.75rem,0.65rem+0.5vw,1.25rem)]'>
                    Написать в чат
                  </button>
                </div>
                     
                      </div>
    </SliderSection2>,
    <StaticSection3 src="/images/sl60.png">
         <div className='absolute top-1/2 left-[14%] -translate-y-1/2 rounded-[20px]
                            
                              bg-[#CFC4A6] py-[2%] px-[2%]'>
        <p className='text-[#636846] text-[clamp(0.875rem,0.55rem+1.625vw,2.5rem)] font-[Manrope-Bold] mb-4 flex flex-col'>
          <span>Контакты и адрес —</span>
          <span>в одном месте</span>
        </p>
        <p className='text-[clamp(0.75rem,0.65rem+0.5vw,1.25rem)] font-[Manrope-Regular] flex flex-col mb-4 text-[#636846]'>
          <span>Мы сделали электронную </span>
          <span>визитку, которую удобно </span>
          <span>сохранить и легко отправить. </span>
          
        </p>
        <div className='flex gap-4'>
         
          <button className='rounded-[5px] bg-[#F7EFE5] text-[#967450] px-[6%] py-[3%] font-[Manrope-Regular] text-[clamp(0.75rem,0.65rem+0.5vw,1.25rem)]'>
           Перейти в раздел
          </button>
          
        </div>
      </div>
      </StaticSection3>,
      <StaticSection3 src="/images/sl6.png">
         <div className='absolute top-1/2 left-[14%] -translate-y-1/2 rounded-[20px]
                            
                              bg-[#CFC4A6] py-[2%] px-[2%]'>
        <p className='text-[#636846] text-[clamp(0.875rem,0.55rem+1.625vw,2.5rem)] font-[Manrope-Bold] mb-4 flex flex-col'>
          <span>Пространство осознанности</span>
          <span>и внутренней силы</span>
        </p>
        <p className='text-[clamp(0.75rem,0.65rem+0.5vw,1.25rem)] font-[Manrope-Regular] flex flex-col mb-4 text-[#636846]'>
          <span>–Онлайн-семинары с практикующими психологами</span>
          <span>–Вдохновляющие подкасты о жизни, принятии и гармонии </span>
          <span>–Разборы лучших книг по психологии  </span>
          
        </p>
        <div className='flex gap-4'>
         
          <button className='rounded-[5px] bg-[#F7EFE5] text-[#967450] px-[6%] py-[3%] font-[Manrope-Regular] text-[clamp(0.75rem,0.65rem+0.5vw,1.25rem)]'>
           Перейти в раздел
          </button>
          
        </div>
      </div>
      </StaticSection3>,
      <StaticSection3 src="/images/sl7.png">
         <div className='absolute top-1/2 left-[14%] -translate-y-1/2 rounded-[20px]
                            
                              bg-[#CFC4A6] py-[2%] px-[2%]'>
        <p className='text-[#636846] text-[clamp(0.875rem,0.55rem+1.625vw,2.5rem)] font-[Manrope-Bold] mb-4 flex flex-col'>
          <span>Личный кабинет,</span>
          <span>который работает за вас</span>
        </p>
        <p className='text-[clamp(0.75rem,0.65rem+0.5vw,1.25rem)] font-[Manrope-Regular] flex flex-col mb-4 text-[#636846]'>
          <span>Запись на приём, история процедур, персональные</span>
          <span>рекомендации, напоминания и дневник —</span>
          <span>всё в одном месте. На сайте и в приложении.</span>
          <span>Всегда под рукой.</span>
          
        </p>
        <div className='flex gap-4'>
         
          <button className='rounded-[5px] bg-[#F7EFE5] text-[#967450] px-[6%] py-[3%] font-[Manrope-Regular] text-[clamp(0.75rem,0.65rem+0.5vw,1.25rem)]'>
           Перейти в раздел
          </button>
          
        </div>
      </div>
      </StaticSection3>,
       <SliderSection2 
       mode="images"
      images={['/images/i1.png','/images/i2.png','/images/i3.png','/images/i4.png']}
       >
      <div className='absolute top-1/2 left-[14%] -translate-y-1/2 rounded-[20px]
              
                                     
                                      bg-[#CFC4A6] py-[2%] px-[2%]'>
                                        
                <p className='text-[#636846] text-[clamp(0.875rem,0.55rem+1.625vw,2.5rem)] font-[Manrope-Bold] mb-4 flex flex-col'>
                  <span>Галерея наших работ</span>
                  
                </p>
                <p className='text-[clamp(0.75rem,0.65rem+0.5vw,1.25rem)] font-[Manrope-Regular] flex flex-col mb-4 text-[#636846]'>
                  <span>Видео результаты процедур,</span>
                  <span>выполненных нашими специалистами. </span>
                  <span>Мы гордимся доверием наших клиентов</span>
                  <span>и с радостью делимся их преображениями.</span>
                 
                </p>
                <div className='flex gap-4'>
                  
                  <button className='rounded-[5px] bg-[#F7EFE5] text-[#967450] px-[6%] py-[3%] font-[Manrope-Regular] text-[clamp(0.75rem,0.65rem+0.5vw,1.25rem)]'>
                    Перейти в раздел
                  </button>
                </div>
                     
                      </div>
    </SliderSection2>,
   <StaticSection3 src="/images/sl30.png">
         <div className='absolute top-1/2 left-[14%] -translate-y-1/2 rounded-[20px]
                            
                              bg-[#CFC4A6] py-[2%] px-[2%]'>
        <p className='text-[#636846] text-[clamp(0.875rem,0.55rem+1.625vw,2.5rem)] font-[Manrope-Bold] mb-4 flex flex-col'>
          <span>Новая Я —</span>
          <span>в формате приложения</span>
        </p>
        <p className='text-[clamp(0.75rem,0.65rem+0.5vw,1.25rem)] font-[Manrope-Regular] flex flex-col mb-4 text-[#636846]'>
          <span>Мы соединяем IT и заботу о себе.</span>
          <span>В нашем приложении вы проходите бьюти-челленджи,</span>
          <span>копите баллы и получаете процедуры бесплатно. </span>
          <span>Встроенный личный кабинет, чек-листы и дневник </span>
          <span>ухода помогут планировать свой путь к сиянию — </span>
          <span>удобно, осознанно и с любовью. </span>
          
          
        </p>
        <div className='flex gap-4'>
          <button className='rounded-[5px] bg-[#636846] text-[#F7EFE5] px-[6%] py-[3%] font-[Manrope-Regular] text-[clamp(0.75rem,0.65rem+0.5vw,1.25rem)]'>
                                      <div className='w-full'>
                                        <svg className='w-full h-auto' xmlns="http://www.w3.org/2000/svg" width="37" height="37" viewBox="0 0 37 37" fill="none">
                                                                  <g clip-path="url(#clip0_8267_15836)">
                                                                  <path d="M24.5654 0.345334C24.1602 0.402218 23.3069 0.665304 22.731 0.907059C20.1925 1.99496 18.294 4.2703 17.7323 6.90827C17.6328 7.37756 17.5972 8.72143 17.6754 8.92763C17.7536 9.13383 18.5927 9.06273 19.5881 8.75698C21.9701 8.03172 24.0179 5.86303 24.7645 3.28194C25.0063 2.46424 25.1272 1.46167 25.0632 0.821733C25.0134 0.260009 25.0418 0.281341 24.5654 0.345334Z" fill="#F7EFE5"/>
                                                                  <path d="M10.6371 8.93567C8.69597 9.30542 6.89703 10.3578 5.36118 12.0358C3.96753 13.5575 3.15694 15.3564 2.81564 17.6815C2.38191 20.6892 2.88675 24.216 4.23062 27.565C5.31141 30.2528 7.06768 33.0401 8.73864 34.7181C10.2176 36.1971 11.469 36.7801 12.9338 36.6806C13.6804 36.6308 14.0359 36.5242 15.3442 35.9838C16.5743 35.4718 17.2143 35.2941 18.2169 35.2087C19.646 35.0808 20.7837 35.287 22.3836 35.9838C23.5995 36.5099 23.9905 36.6237 24.7087 36.6735C26.8489 36.8228 28.8185 35.3083 31.2503 31.6251C31.6911 30.9567 32.2457 30.0537 32.4804 29.627C32.8999 28.8733 33.7034 27.1739 33.7034 27.046C33.7034 27.0104 33.4972 26.8966 33.2483 26.79C32.1746 26.3278 30.7952 25.183 30.0771 24.1449C28.1644 21.3789 28.1004 17.7811 29.9206 15.0222C30.3473 14.3752 31.3569 13.3868 32.0538 12.9246L32.6937 12.498L32.2742 12.0216C30.8379 10.4075 28.8754 9.27698 26.9556 8.94279C25.3344 8.66548 23.8625 8.87168 21.6867 9.68227C20.2362 10.2227 19.7243 10.3435 18.807 10.3435C17.8471 10.3364 17.3778 10.2298 15.6286 9.6325C14.9034 9.38363 14.0217 9.12055 13.6733 9.04233C12.8129 8.85035 11.3695 8.80058 10.6371 8.93567Z" fill="#F7EFE5"/>
                                                                  </g>
                                                                  <defs>
                                                                  <clipPath id="clip0_8267_15836">
                                                                  <rect width="36.4054" height="36.4054" fill="white" transform="translate(0 0.296875)"/>
                                                                  </clipPath>
                                                                  </defs>
                                                                  </svg>
                                      </div>
          </button>
          <button className='rounded-[5px] bg-[#636846] text-[#F7EFE5] px-[6%] py-[3%] font-[Manrope-Regular] text-[clamp(0.75rem,0.65rem+0.5vw,1.25rem)]'>
                          <svg xmlns="http://www.w3.org/2000/svg" width="43" height="43" viewBox="0 0 43 43" fill="none">
                          <g clip-path="url(#clip0_8267_15844)">
                          <path d="M13.0719 0.817547C12.7875 0.971945 12.5681 1.43514 12.6412 1.72768C12.6737 1.87395 13.1532 2.41841 13.9089 3.18227L15.1278 4.41746L14.6484 4.77501C13.5107 5.65264 12.3405 7.13161 11.7392 8.43993C11.1947 9.65074 10.8047 11.2516 10.8047 12.3324V12.8037H21.2062H31.6078V12.3324C31.6078 11.2516 31.2177 9.65074 30.6733 8.43993C30.0719 7.13161 28.9018 5.65264 27.7641 4.77501L27.2846 4.41746L28.5036 3.18227C29.2593 2.41841 29.7388 1.87395 29.7713 1.72768C29.8444 1.41889 29.6169 0.963819 29.3081 0.809421C28.8124 0.549381 28.6011 0.671274 27.1709 2.08524L25.8626 3.38543L25.3994 3.18227C24.1561 2.62969 22.8884 2.39403 21.2062 2.39403C19.5241 2.39403 18.2564 2.62969 17.0131 3.18227L16.5499 3.38543L15.2822 2.12587C13.8195 0.6794 13.5839 0.541255 13.0719 0.817547ZM17.33 7.22913C17.4763 7.28601 17.6957 7.45666 17.8257 7.59481C18.0208 7.79796 18.0695 7.93611 18.102 8.33429C18.1345 8.75686 18.1102 8.87062 17.9314 9.13879C17.4194 9.91078 16.2493 9.89453 15.7617 9.10628C15.4935 8.67559 15.5585 7.94424 15.8917 7.59481C16.3143 7.13974 16.8262 7.00972 17.33 7.22913ZM26.0251 7.22913C26.1714 7.28601 26.3908 7.45666 26.5208 7.59481C26.854 7.94424 26.919 8.67559 26.6508 9.10628C26.1632 9.89453 24.9931 9.91078 24.4811 9.13879C24.3023 8.87062 24.2779 8.75686 24.3105 8.33429C24.343 7.93611 24.3917 7.79796 24.5867 7.59481C25.0093 7.13974 25.5213 7.00972 26.0251 7.22913Z" fill="#F7EFE5"/>
                          <path d="M5.68584 14.6333C4.84884 14.9096 4.08498 15.7791 3.89808 16.6649C3.84119 16.9493 3.81682 19.1271 3.83307 23.4584L3.85745 29.8293L4.06873 30.2844C4.88948 32.0234 7.02667 32.3891 8.31874 31.0076C8.52189 30.7882 8.7413 30.4388 8.84694 30.1625C9.01759 29.6912 9.01759 29.6912 9.00134 23.0602L8.97696 16.4211L8.78193 16.0391C8.19685 14.8933 6.81539 14.2595 5.68584 14.6333Z" fill="#F7EFE5"/>
                          <path d="M10.8047 23.4272C10.8047 31.911 10.8128 32.3661 10.9591 32.6749C11.1379 33.0812 11.5198 33.4144 11.9261 33.5281C12.0886 33.5688 12.6737 33.6094 13.2182 33.6094H14.2014L14.2339 36.8761C14.2665 40.0291 14.2746 40.1672 14.4452 40.6061C14.6728 41.183 15.2335 41.7681 15.8267 42.0444C17.0863 42.6376 18.614 42.0281 19.2478 40.6873L19.4591 40.2323L19.4835 36.9249L19.5079 33.6094H21.2062H22.9046L22.929 36.9249L22.9534 40.2323L23.1647 40.6873C23.7985 42.0281 25.3262 42.6376 26.5858 42.0444C27.179 41.7681 27.7397 41.183 27.9672 40.6061C28.1379 40.1672 28.146 40.0291 28.1785 36.8843L28.211 33.6094H29.1943C29.7388 33.6094 30.3239 33.5688 30.4864 33.5281C30.8927 33.4144 31.2746 33.0812 31.4534 32.6749C31.5997 32.3661 31.6078 31.911 31.6078 23.4272V14.5128H21.2062H10.8047V23.4272Z" fill="#F7EFE5"/>
                          <path d="M35.3064 14.6171C34.5588 14.869 33.9818 15.3565 33.6324 16.0391L33.4374 16.4211L33.413 23.0602C33.3968 29.6912 33.3968 29.6912 33.5674 30.1625C33.6731 30.4388 33.8925 30.7882 34.0956 31.0076C35.3877 32.3891 37.5249 32.0234 38.3456 30.2844L38.5569 29.8293V23.2065V16.5836L38.2887 16.0391C37.8499 15.1453 37.0617 14.6008 36.1353 14.5439C35.8509 14.5277 35.4933 14.5602 35.3064 14.6171Z" fill="#F7EFE5"/>
                          </g>
                          <defs>
                          <clipPath id="clip0_8267_15844">
                          <rect width="41.6062" height="41.6062" fill="white" transform="translate(0.40625 0.697266)"/>
                          </clipPath>
                          </defs>
                        </svg>
          </button>
          <button className='rounded-[5px] bg-[#F7EFE5] text-[#967450] px-[6%] py-[3%] font-[Manrope-Regular] text-[clamp(0.75rem,0.65rem+0.5vw,1.25rem)]'>
            Написать в чат
          </button>
          
        </div>
      </div>
      </StaticSection3>,
    
   
    <StaticSection3 src="/images/sl4.png">
         <div className='absolute top-1/2 left-[14%] -translate-y-1/2 rounded-[20px]
                            
                              bg-[#CFC4A6] py-[2%] px-[2%]'>
        <p className='text-[#636846] text-[clamp(0.875rem,0.55rem+1.625vw,2.5rem)] font-[Manrope-Bold] mb-4 flex flex-col'>
          <span>Наши специалисты</span>
          
        </p>
        <p className='text-[clamp(0.75rem,0.65rem+0.5vw,1.25rem)] font-[Manrope-Regular] flex flex-col mb-4 text-[#636846]'>
          <span>Вы можете выбрать подходящую услугу</span>
          <span>и записаться на прием с возможностью</span>
          <span>оплаты онлайн. Просто и быстро.</span>
         
          
          
        </p>
        <div className='flex gap-4'>
          
          <button className='rounded-[5px] bg-[#F7EFE5] text-[#967450] px-[6%] py-[3%] font-[Manrope-Regular] text-[clamp(0.75rem,0.65rem+0.5vw,1.25rem)]'>
            Выбрать специалиста
          </button>
          
        </div>
      </div>
      </StaticSection3>,
    <StaticSection3 src="/images/sl11.png">
         <div className='absolute top-1/2 left-[14%] -translate-y-1/2 rounded-[20px]
                            
                              bg-[#CFC4A6] py-[2%] px-[2%]'>
        <p className='text-[#636846] text-[clamp(0.875rem,0.55rem+1.625vw,2.5rem)] font-[Manrope-Bold] mb-4 flex flex-col'>
          <span>Теперь доступна </span>
          <span>онлайн-оплата!</span>
          
        </p>
        <p className='text-[clamp(0.75rem,0.65rem+0.5vw,1.25rem)] font-[Manrope-Regular] flex flex-col mb-4 text-[#636846]'>
          <span>Оплачивайте услуги прямо через приложение </span>
          <span>или сайт — быстро, безопасно и удобно.</span>
          <span>Поддерживаются все популярные способы: </span>
          <span>карта, СБП и другие. </span>
          <span>Выбирайте то, что подходит вам!</span>
         
          
          
        </p>
        <div className='flex gap-4'>
          
          <button className='rounded-[5px] bg-[#F7EFE5] text-[#967450] px-[6%] py-[3%] font-[Manrope-Regular] text-[clamp(0.75rem,0.65rem+0.5vw,1.25rem)]'>
            Записаться на прием
          </button>
          
        </div>
      </div>
      </StaticSection3>,
    
  ]), [isMobile])
    
   
 

  const texts = useMemo(() => ([
    { tit: "Новая я" },
    { tit: "новости" },
    { tit: "услуги" },
    { tit: "пропуск к здоровью" },
    {tit: "Контакты"},
    { tit: "Факультет психологии" },
    { tit: "Личный кабинет" },
    { tit: "галерея" },
    { tit: "приложение" },
    { tit: "специалисты" },
    { tit: "онлайн-оплата" },
  ]), [])

  const {
    currentPage,
    containerRef,
    next, prev, goTo,
    motionAnimate,
    motionTransition,
  } = usePagedScroll({
    pageCount: sections.length,
    axis: 'y',
    duration: 600,
    touchThreshold: 50,
    keyboard: true,
    blockWhileAnimating: true,
    mobileMaxWidth: 480,
    mobile: {
      axis: 'y',
      duration: 600,
      touchThreshold: 50,
      keyboard: false,
    },
    shouldCaptureEvent: (e) => !e.target.closest('[data-scroll-lock="off"]'),
  })

  // >>> вот здесь НЕТ slideNext/slidePrev <<<
  const overlayProps = {
    next,                 // листаем страницу вперёд
    prev,                 // листаем страницу назад
    goTo,                 // перейти к конкретной странице
    currentPage,
    totalPages: sections.length,
    text: texts[currentPage],
  }

  return (
    <div ref={containerRef} className="overflow-hidden h-screen w-screen relative">
      <motion.div
        animate={motionAnimate}
        transition={motionTransition}
        className="flex flex-col"
      >
        {sections}
      </motion.div>

      <LayoutOverlay {...overlayProps} />
    </div>
  )
}
