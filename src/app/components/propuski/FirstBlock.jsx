'use client'

import Image from 'next/image'
import { motion } from 'framer-motion'


export default function FirstBlock({ item }) {
  const it = item ?? {}

  return (
    <div className="w-full">
      <motion.article
        className="grid grid-cols-1 1k:grid-cols-2 gap-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
      >
        {/* Левая колонка */}
        <div className="flex flex-col order-2 1k:order-1 justify-center">
          {/* Теги и время */}
         

          {/* Заголовок */}
          {Array.isArray(it.title) ? (
            <div className="text-[#636846] text-[clamp(0.875rem,0.55rem+1.625vw,2.5rem)] font-[Manrope-Bold] mb-4 flex flex-col">
              {it.title.map((line, i) => (
                <span key={i}>{line}</span>
              ))}
            </div>
          ) : (
            <p className="text-[#7b5d44]/90 mb-5 whitespace-pre-line">{it.title}</p>
          )}

          {/* Текст */}
          {Array.isArray(it.excerpt) ? (
            <div className="text-[#636846] flex flex-col gap-1 mb-5 font-ManropeRegular text-[clamp(0.875rem,0.7308rem+0.641vw,1.5rem)]">
              {it.excerpt.map((line, i) => (
                <span key={i} className="block">
                  {line}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-[#7b5d44]/90 mb-5 max-w-[48ch] whitespace-pre-line">
              {it.excerpt}
            </p>
          )}
          {
            <p className='font-ManropeMedium text-[#636846] text-[clamp(0.75rem,0.6346rem+0.5128vw,1.25rem)] mb-[4%] 2xl:mb-[2%]'>{it.mesta}</p>

          }

          {/* Кнопка */}
          <div className='flex gap-4'>
              {it.cta && (
                <a
                  href={it.href || '#'}
                  className="inline-flex w-fit items-center justify-center rounded-[5px] bg-[#636846] text-[#F7EFE5] px-[5%] py-3 text-[clamp(0.875rem,0.7885rem+0.3846vw,1.25rem)] font-[Manrope-Regular] transition duration-700 hover:opacity-90"
                >
                  {it.cta}
                </a>
              )}
              {it.cta && (
                <a
                  href={it.href || '#'}
                  className="inline-flex w-fit items-center justify-center rounded-[5px] bg-[#F5F0E4] text-[#967450] px-[5%] py-3 text-[clamp(0.875rem,0.7885rem+0.3846vw,1.25rem)] font-[Manrope-Regular] transition duration-700 hover:opacity-90"
                >
                  {it.cta1}
                </a>
              )}
          </div>
        </div>

        {/* Правая колонка */}
        <div className="flex items-end justify-end order-1 1k:order-2">
          <div className="relative  w-full  h-full pt-[56.25%]">
            {it.image ? (
              <Image
                src={it.image}
                alt={Array.isArray(it.title) ? it.title.join(' ') : it.title || 'image'}
                fill
                sizes="(max-width: 480px) w-[40%]"
                className="object-cover rounded-[15px]"
                priority
              />
            ) : (
              <div className="absolute inset-0 bg-[#6f4b45]" />
            )}
          </div>
        </div>
      </motion.article>
    </div>
  )
}
