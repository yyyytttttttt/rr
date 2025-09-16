import React from 'react'

const Cart2 = ({ bg = '#757F64', text = '#F5F0E4', title, children }) => {
  return (
    <div
      className="w-full px-[4%] xs:px-[14%] py-[3%] xs:py-[5%] flex flex-col justify-center rounded-[20px]"
      style={{ backgroundColor: bg }}
    >
      <div className="flex flex-col gap-0 xs:gap-2">
        {/* Заголовок */}
        <span
          style={{ color: text }}
          className="font-ManropeBold text-[clamp(0.875rem,0.7727rem+0.4545vw,1.5rem)]"
        >
          {title}
        </span>

        {/* Текст */}
        <p
          style={{ color: text }}
          className="text-[clamp(0.75rem,0rem+3.3333vw,1rem)] xs:text-[clamp(0.875rem,0.7727rem+0.4545vw,1.5rem)] font-ManropeRegular tracking-tighter xs:tracking-normal flex flex-col"
        >
          {children}
        </p>
      </div>
    </div>
  )
}

export default Cart2
