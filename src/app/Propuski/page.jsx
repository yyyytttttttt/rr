import React from 'react'
import HealthPassesBlock from '../components/Propusk/HealthPassesBlock'
import LayoutOverlay3 from '../components/LayoutOverlay3'
import Cart from '../components/aboutUs/Cart'
import Rulet from '../components/Propusk/Rulet'
import Image from 'next/image'
import BottomNav from '../components/menus/BottomNav'
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
      <BottomNav></BottomNav>
      <div className='h-15'>

      </div>
      
    </LayoutOverlay3>
  )
}

export default page