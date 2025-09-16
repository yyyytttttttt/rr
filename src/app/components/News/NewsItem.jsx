'use client'
import React from 'react'
import Image from 'next/image'
import Link from 'next/link'

const NewsItem = ({
  imageSrc = '/images/newsImg2.png',
  imageAlt = '',
  imageWidth = 760,
  imageHeight = 450,
  desc='',
  desc1='',
  category = '',
  titleTop = '',
  titleBottom = '',
  ctaHref = '#',
  ctaLabel = '',
  readingTime = '',
}) => {
  return (
    <article className="group rounded-[24px] overflow-hidden ">
      {/* Картинка */}
      <div className="relative overflow-hidden">
        <Image
          src={imageSrc}
          alt={imageAlt}
          width={imageWidth}
          height={imageHeight}
          className="object-cover transition-transform duration-500 ease-[cubic-bezier(0.25,1,0.5,1)] group-hover:scale-[1.03]"
          priority
        />
      </div>

      {/* Текстовый блок */}
      <div className="px-5 sm:px-6 py-5 sm:py-6">
        <p className="text-[clamp(0.75rem,0.6682rem+0.3636vw,1.25rem)] font-ManropeRegular leading-5 text-[#636846CC]">
          {category}
        </p>

        <h3 className="mt-2 mb-[2%] text-[#636846CC] font-ManropeBold leading-tight text-[clamp(1.2rem,1.05rem+0.8vw,1.7rem)]">
          {titleTop}
          <br className="hidden sm:block" />
          {titleBottom}
        </h3>
        <p className='text-[clamp(0.75rem,0.5769rem+0.7692vw,1.5rem)] flex flex-col text-[#636846] font-ManropeRegular'>
          <span>{desc}</span>
          <span>{desc1}</span>
        </p>

        <div className="mt-5 flex items-center gap-4">
          <Link
            href={ctaHref}
            className="inline-flex items-center rounded-[5px] px-5 py-3 bg-[#F5F0E4] hover:bg-[#E1DAC6] transition-colors text-[clamp(0.75rem,0.6682rem+0.3636vw,1.25rem)] font-ManropeBold text-[#967450]"
          >
            {ctaLabel}
          </Link>

          <span className="ml-auto font-ManropeRegular text-[clamp(0.75rem,0.6682rem+0.3636vw,1.25rem)] text-[#8C887F]">
            {readingTime}
          </span>
        </div>
      </div>
    </article>
  )
}

export default NewsItem
