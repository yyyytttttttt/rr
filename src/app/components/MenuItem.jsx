
import Link from 'next/link'
import React from 'react'

const MenuItem = ({ svg, children, href }) => {
  const safeHref = href || '#'
  const preventIfEmpty = (e) => { if (!href) e.preventDefault() }

  return (
    <div className=''>
      <Link
        href={safeHref}
        onClick={preventIfEmpty}
        className='flex items-center gap-4 transition-all duration-500 hover:scale-110 cursor-pointer'
      >
        <div className='w-[25%]'>{svg}</div>
        <p className='flex flex-col  font-[Manrope-Regular] text-white text-[clamp(0.75rem,0.6273rem+0.5455vw,1.5rem)]'>
          {children}
        </p>
      </Link>
    </div>
  )
}

export default MenuItem
