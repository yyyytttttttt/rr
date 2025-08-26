import React from 'react'

const MenuItem = ({svg,children}) => {
  return (
    <div className=''>
         <div className='flex items-center gap-4 transition-all duration-500 hover:scale-110 cursor-pointer'>
                            <div className='w-[25%]'>{svg}</div>
                            <p className='flex flex-col  font-[Manrope-Regular] text-white text-[clamp(0.75rem,0.6273rem+0.5455vw,1.5rem)]'>
                                {children}
                            </p>
        </div>
    </div>
  )
}

export default MenuItem