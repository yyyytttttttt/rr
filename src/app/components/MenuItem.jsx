
import Link from 'next/link'
import React, { memo } from 'react'

function MenuItem ({ svg, children, href })  {
  const safeHref = href || '#'
  const preventIfEmpty = (e) => { if (!href) e.preventDefault() }

  return (
    <div className=''>
      <Link
        href={safeHref}
        onClick={preventIfEmpty}
        className='flex items-center gap-2  md:gap-4 transition-all duration-500 hover:scale-110 cursor-pointer'
      >
        <div className='w-[21.5%] xs:w-[18%] xl:w-[25%]'>{svg}</div>
        <p className='flex flex-col  font-[Manrope-Regular] tracking-normal xs:tracking-tight   leading- text-white text-[clamp(0.75rem,0rem+3.3333vw,1rem)] xs:text-[clamp(0.75rem,0.5769rem+0.7692vw,1.5rem)]'>
          {children}
        </p>
      </Link>
    </div>
  )
}

export default memo(MenuItem)
