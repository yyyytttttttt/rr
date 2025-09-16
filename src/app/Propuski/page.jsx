import React from 'react'
import HealthPassesBlock from '../components/Propusk/HealthPassesBlock'
import LayoutOverlay3 from '../components/LayoutOverlay3'
import Cart from '../components/aboutUs/Cart'
import Rulet from '../components/Propusk/Rulet'
import Image from 'next/image'
const page = () => {
  return (
    <LayoutOverlay3 title="пропуски здоровья">
      <HealthPassesBlock/>
      <p className='font-ManropeBold text-[#636846] px-[4%] lg:px-[8%] text-[clamp(1.25rem,0.9615rem+1.2821vw,2.5rem)] mb-[2%]'>Что входит в пропуск</p>
      <div className='px-[4%] lg:px-[8%] gap-2 lg:gap-4 xl:gap-6 grid grid-cols-2 xl:grid-cols-4 mb-[6%] lg:mb-[2%]'>
        
        <Cart text='#636846' number="1" title="Программа с заданиями">
          <p className='hidden xs:flex flex-col '>
            <span>Вы получаете задания,</span>
            <span>которые постепенно </span>
            <span>ведут вас к желаемому </span>
            <span>результату</span>
          </p>
          <p className='flex xs:hidden  flex-col '>
            <span>Задания, которые </span>
            <span>постепенно ведут </span>
            <span>вас к желаемому </span>
            <span>результату</span>
          </p>
        </Cart>
         <Cart text='#636846' number="2" title="Прогресс-трекер">
          <p className='hidden xs:flex flex-col'>
            <span>Помогает сохранить </span>
            <span>мотивацию </span>
            <span>и не потеряться</span>
            <span>в процессе.</span>
          </p>
           <p className='flex xs:hidden  flex-col '>
            <span>Помогает следить </span>
            <span>за выполнением </span>
            <span>и сохраняет </span>
            <span>мотивацию</span>
          </p>
        </Cart>
        <Cart text='#636846' number="3" title="Финальная процедура">
          <p className='hidden xs:flex flex-col'>
            <span>В конце пути вас ждёт</span>
            <span>подрок или услуга,</span>
            <span>в зависимости от </span>
            <span>выбранной программы</span>
          </p>
          <p className='xs:hidden flex flex-col'>
            <span>вас ждёт подарок</span>
            <span>или услуга,</span>
            <span>в зависимости от </span>
            <span>выбранной программы</span>
          </p>
        </Cart>
         <Cart text='#636846' number="4" title="Возможность подарить">
          <p className='hidden xs:flex flex-col'>
            <span>Пропуск к здоровью </span>
            <span>можно подарить</span>
            <span>близкому в знак  </span>
            <span>внимания и поддержки.</span>
          </p>
          <p className='xs:hidden flex flex-col'>
            <span>Пропуск</span>
            <span>можно подарить</span>
            <span>близкому в знак  </span>
            <span>внимания и поддержки.</span>
          </p>
        </Cart>
      </div>
      <p className='font-ManropeBold text-[#636846] px-[4%] lg:px-[8%]  text-[clamp(1.25rem,0.9615rem+1.2821vw,2.5rem)] mb-[2%]'>Вопросы и ответы</p>
      <div className='flex  flex-col gap-2 xs:gap-4'>
        <Rulet title='Что это такое?'>
          <span>Это электронный пропуск, который открывает доступ к эксклюзивному  28-дневному челленджу. </span>
          <span>Каждый день ты получаешь персональные задания, вдохновляющие советы и поддержку. </span>
          <span>А в финале — приятный подарок в знак благодарности за заботу о себе.</span>
        
        
        </Rulet>
        <Rulet title='Что ты получаешь?'>
          <span>Доступ к закрытому челленджу, уникальный контент и ежедневную поддержку.</span>
          <span>Мы начисляем баллы за каждый выполненный день и дарим подарок по завершении. </span>
          
        
        
        </Rulet>
        <Rulet title='Как использовать?'>
          <span>Оформи пропуск в приложении. Начни свой челлендж или подари его другому. </span>
          <span>Получай задания, выполняй, следи за прогрессом.Заверши и получи бонус </span>
          
        
        
        </Rulet>
        <Rulet title='Кому подойдёт?'>
          <span>Тем, кто хочет пройти путь преображения с заботой. </span>
          <span>Тем, кто любит делать подарки со смыслом</span>
          <span>Тем, кто хочет мотивации и ясного маршрута к себе</span>
        
        
        </Rulet>
      </div>
       {/* Bottom Nav */}
                  <div className="fixed  xs:hidden max-w-[1410px] mx-auto bottom-0 left-1/2 -translate-x-1/2 w-full flex  justify-center bg-[#e5dccb] px-2 py-1 z-50">
                    <div className="w-[80%] sm:w-[50%] flex justify-between">
                      <button
                        className="
                          relative w-[10%] sm:w-[7.4%] cursor-pointer
                          transition-all duration-700 ease-[cubic-bezier(0.25,1,0.5,1)]
                          hover:scale-110 hover:opacity-95 active:scale-95
                          before:content-[''] before:absolute before:inset-0 
                          before:rounded-xl before:bg-gradient-to-r 
                          before:from-[#A77C66]/40 before:to-[#A77C66]/10
                          before:blur-lg before:opacity-0 hover:before:opacity-100 
                          before:transition-all before:duration-700
                        "
                      >
                        <svg
                          className="relative z-10 w-full h-auto drop-shadow-[0_0_6px_#A77C6680] hover:drop-shadow-[0_0_12px_#A77C66]"
                          xmlns="http://www.w3.org/2000/svg"
                          width="61"
                          height="60"
                          viewBox="0 0 61 60"
                          fill="none"
                        >
                          <path
                            d="M16.3643 27.6396L30.5067 13.4972L44.6491 27.6396V41.782C44.6491 44.1391 42.2921 46.4961 39.935 46.4961H21.0785C18.7214 46.4961 16.3643 44.1391 16.3643 41.782V27.6396Z"
                            stroke="#A77C66"
                            strokeWidth="1.7428"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </button>
            
                      <button
                        className="
                          relative w-[10%] sm:w-[7.4%] cursor-pointer
                          transition-all duration-700 ease-[cubic-bezier(0.25,1,0.5,1)]
                          hover:scale-110 hover:opacity-95 active:scale-95
                          before:content-[''] before:absolute before:inset-0 
                          before:rounded-xl before:bg-gradient-to-r 
                          before:from-[#A77C66]/40 before:to-[#A77C66]/10
                          before:blur-lg before:opacity-0 hover:before:opacity-100 
                          before:transition-all before:duration-700
                        "
                      >
                        <svg
                          className="relative z-10 w-full h-auto drop-shadow-[0_0_6px_#A77C6680] hover:drop-shadow-[0_0_12px_#A77C66]"
                          xmlns="http://www.w3.org/2000/svg"
                          width="61"
                          height="60"
                          viewBox="0 0 61 60"
                          fill="none"
                        >
                          <path
                            d="M10.5408 16.6905H27.1778L30.5052 21.3489H50.4697V43.3098H10.5408V16.6905Z"
                            stroke="#A77C66"
                            strokeWidth="1.7428"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </button>
            
                      <button
                        className="
                          relative w-[10%] sm:w-[7.4%] flex-shrink-0 scale-[1.5] cursor-pointer
                          transition-all duration-700 ease-[cubic-bezier(0.25,1,0.5,1)]
                          hover:scale-[1.65] hover:opacity-95 active:scale-[1.4]
                          before:content-[''] before:absolute before:inset-0
                          before:rounded-full before:bg-gradient-to-r 
                          before:from-[#A77C66]/40 before:to-[#A77C66]/10
                          before:blur-lg before:opacity-0 hover:before:opacity-100
                          before:transition-all before:duration-700
                        "
                      >
                        <Image
                          src="/images/pl.svg"
                          alt="Зв"
                          width={60}
                          height={60}
                          className="relative z-10 drop-shadow-[0_0_6px_#A77C6680] hover:drop-shadow-[0_0_12px_#A77C66]"
                        />
                      </button>
            
                      <button
                        className="
                          relative w-[10%] sm:w-[7.4%] cursor-pointer
                          transition-all duration-700 ease-[cubic-bezier(0.25,1,0.5,1)]
                          hover:scale-110 hover:opacity-95 active:scale-95
                          before:content-[''] before:absolute before:inset-0 
                          before:rounded-xl before:bg-gradient-to-r 
                          before:from-[#A77C66]/40 before:to-[#A77C66]/10
                          before:blur-lg before:opacity-0 hover:before:opacity-100 
                          before:transition-all before:duration-700
                        "
                      >
                        <svg
                          className="relative z-10 w-full h-auto drop-shadow-[0_0_6px_#A77C6680] hover:drop-shadow-[0_0_12px_#A77C66]"
                          xmlns="http://www.w3.org/2000/svg"
                          width="61"
                          height="60"
                          viewBox="0 0 61 60"
                          fill="none"
                        >
                          <path
                            d="M30.5004 29.9999C36.7136 29.9999 41.7504 24.9631 41.7504 18.7499C41.7504 12.5367 36.7136 7.49994 30.5004 7.49994C24.2872 7.49994 19.2504 12.5367 19.2504 18.7499C19.2504 24.9631 24.2872 29.9999 30.5004 29.9999Z"
                            stroke="#A77C66"
                            strokeWidth="1.74598"
                          />
                          <path
                            d="M15.4998 48.7498C15.4998 40.4651 22.2151 33.7498 30.4998 33.7498C38.7844 33.7498 45.4998 40.4651 45.4998 48.7498"
                            stroke="#A77C66"
                            strokeWidth="1.74598"
                            strokeLinecap="round"
                          />
                        </svg>
                      </button>
            
                      <button
                        className="
                          relative w-[10%] sm:w-[7.4%] cursor-pointer
                          transition-all duration-700 ease-[cubic-bezier(0.25,1,0.5,1)]
                          hover:scale-110 hover:opacity-95 active:scale-95
                          before:content-[''] before:absolute before:inset-0 
                          before:rounded-xl before:bg-gradient-to-r 
                          before:from-[#A77C66]/40 before:to-[#A77C66]/10
                          before:blur-lg before:opacity-0 hover:before:opacity-100 
                          before:transition-all before:duration-700
                        "
                      >
                        <svg
                          className="relative z-10 w-full h-auto drop-shadow-[0_0_6px_#A77C6680] hover:drop-shadow-[0_0_12px_#A77C66]"
                          xmlns="http://www.w3.org/2000/svg"
                          width="61"
                          height="60"
                          viewBox="0 0 61 60"
                          fill="none"
                        >
                          <path
                            d="M13.547 18.7947H48.3624C50.1031 18.7947 51.2636 19.9552 51.2636 21.696V39.1037C51.2636 40.8445 50.1031 42.005 48.3624 42.005H28.0534L22.2509 47.8075V42.005H13.547C11.8063 42.005 10.6458 40.8445 10.6458 39.1037V21.696C10.6458 19.9552 11.8063 18.7947 13.547 18.7947Z"
                            stroke="#A77C66"
                            strokeWidth="1.7428"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </button>
                    </div>
                  </div>
      <div className='h-15'>

      </div>
      
    </LayoutOverlay3>
  )
}

export default page