'use client'

import { memo } from "react"
import { mobileBarType } from "../../types/GlavProps"


function MobileBar({ title, text, buttons }:mobileBarType) {
  return (
    <div className="absolute bottom-0 z-[10] w-full">
      <div className="mx-auto w-full max-w-[1410px]">
        <div className="bg-white flex flex-col xs:hidden w-full py-6 px-6
                        shadow-[0_8px_40px_rgba(0,0,0,0.12)]">
          <p className="text-[#636846] text-[clamp(0.875rem,0.55rem+1.625vw,2.5rem)]
                       font-[Manrope-Bold] mb-4 flex flex-col">
            {Array.isArray(title) ? title.map((t,i)=><span key={i}>{t}</span>) : <span>{title}</span>}
          </p>
          <p className="text-[clamp(0.75rem,0.65rem+0.5vw,1.25rem)]
                        font-[Manrope-Regular] flex flex-col mb-4 text-[#636846]">
            {text.map((t,i)=><span key={i}>{t}</span>)}
          </p>
          <div className="flex gap-4">
            {buttons?.map((b,i)=>(
              <button key={i}
                className={`rounded-[5px] px-[6%] py-[3%] w-full font-[Manrope-Regular]
                           text-[clamp(0.75rem,0.65rem+0.5vw,1.25rem)]
                           ${b.variant==='primary'
                              ? 'bg-[#636846] text-[#F7EFE5]'
                              : 'bg-[#F7EFE5] text-[#967450]'}`}>
                {b.label}
              </button>
            ))}
          </div>
          <div className="bg-white h-[8dvh]" />
        </div>
      </div>
    </div>
  )
}
export default memo(MobileBar)
