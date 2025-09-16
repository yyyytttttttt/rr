import React from 'react'

const Cart = ({ number, title, children,text = '#F5F0E4' }) => {
  return (
    <div className="bg-[#F5F0E4] w-full flex flex-col px-[8%] 4xl:px-[14%] py-[10%] rounded-[10px] md:rounded-[20px]">
      {/* Кружок с номером */}
      <p
        className="
          font-ManropeBold text-[#967450]
          text-[clamp(1rem,0.9rem+0.5vw,1.5rem)]
          bg-[#F4EDD7]
          w-[clamp(2rem,1.6rem+1.2vw,2.75rem)]
          aspect-square
          rounded-full
          grid place-items-center
          leading-none
          mb-[8%] lg:mb-[20%]
        "
      >
        {number}
      </p>

      {/* Заголовок + текст */}
      <div className="flex flex-col gap-2  ">
        <span className="font-ManropeBold flex    text-[#967450] text-[clamp(1.125rem,0.9231rem+0.8974vw,2rem)]" style={{ color: text }}>
          
          {title}
        </span>
        <p className="text-[clamp(0.875rem,0.7308rem+0.641vw,1.5rem)] -tracking-tight xs:tracking-normal font-ManropeRegular text-[#636846] flex flex-col" style={{ color: text }}>
          
          {children}
        </p>
      </div>
    </div>
  )
}

export default Cart
