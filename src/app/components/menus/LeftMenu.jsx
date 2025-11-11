'use client'
import React, { memo } from 'react'
import Image from 'next/image'

function LeftMenu() {
  return (
    <div className="fixed  top-[30%] xs:top-1/2 left-[4%] -translate-y-1/2
                    hidden xs:flex justify-between items-center gap-16 z-30 w-[20%] text-[#414141]">
      <div className="flex flex-col gap-4 w-[58%] xs:w-[32%] lg:w-[18%]">
        {[
          { src: '/images/loc1.svg', alt: 'Лок' },
          { src: '/images/doc1.svg', alt: 'Док' },
          { src: '/images/lk1.svg',  alt: 'ЛК'  },
          { src: '/images/zv1.svg',  alt: 'Зв'  },
        ].map(({ src, alt }, i) => (
          <div key={i}>
            <Image
              src={src}
              alt={alt}
              width={80}
              height={80}
              className="h-auto max-w-[40px] xs:max-w-[80px] xs:w-full
                         transition duration-700 ease-[cubic-bezier(0.25,1,0.5,1)]
                         hover:-translate-y-1 hover:scale-110
                         hover:drop-shadow-[0_0_15px_rgba(167,124,102,0.5)]"
            />
          </div>
        ))}
      </div>
    </div>
  )
}

export default memo(LeftMenu)
