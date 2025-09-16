import React from 'react'
import NewsItem from './NewsItem'
const newsSecondSection = () => {
  return (
    <div className='px-[4%]'>
      <div className='grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8   justify-items-center mb-[2%]'>
        <NewsItem
        imageSrc="/images/newsImg.png"
        imageAlt="Новый баннер"
        category="Психология / Поддержка"
        titleTop="Встреча с психологом —"
        titleBottom="теперь онлайн"
        ctaHref="/news/1"
        ctaLabel="Узнать больше"
        readingTime="2 мин чтения"
        />  
        <NewsItem
        imageSrc="/images/newsImg3.png"
        imageAlt="Новый баннер"
        category="Уход за кожей / Подарки"
        titleTop="Программа «Живой баланс»"
        titleBottom="с подарочной упаковкой"
        ctaHref="/news/1"
        ctaLabel="Узнать больше"
        readingTime="2 мин чтения"
        />  
        <NewsItem
        imageSrc="/images/newsImg4.png"
        imageAlt="Новый баннер"
        category="Команда / Поддержка"
        titleTop="Наши специалисты"
        titleBottom="теперь на связи в Telegram"
        ctaHref="/news/1"
        ctaLabel="Узнать больше"
        readingTime="2 мин чтения"
        />  
       <NewsItem
        imageSrc="/images/newsImg5.png"
        imageAlt="Новый баннер"
        category="Тело / Расслабление"
        titleTop="Доступна новая программа"
        titleBottom="«Заново в теле»"
        ctaHref="/news/1"
        ctaLabel="Узнать больше"
        readingTime="2 мин чтения"
        />  
       <NewsItem
        imageSrc="/images/newsImg6.png"
        imageAlt="Новый баннер"
        category="Забота / Подарки"
        titleTop="«Подарить пропуск»"
        titleBottom="теперь онлайн"
        ctaHref="/news/1"
        ctaLabel="Узнать больше"
        readingTime="2 мин чтения"
        />  

      </div>
      <div  className='h-50'></div>
    </div>
  )
}

export default newsSecondSection
