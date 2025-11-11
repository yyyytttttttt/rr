
'use client'

import { JSX, memo } from "react"
import { DescProps } from "../../types/GlavProps"

function DesktopCard({title,buttons, lines ,pos }:DescProps):JSX.Element {
  const side = pos === 'right' ? 'right-[4%]' : 'left-[14%]'

  return (
    <div className={`absolute top-1/2 ${side} -translate-y-1/2 rounded-[20px]  hidden xs:flex flex-col bg-[#CFC4A6] py-[2%] px-[2%]`}>
      <p className="text-[#636846] text-[clamp(0.875rem,0.55rem+1.625vw,2.5rem)] font-[Manrope-Bold] mb-4 flex flex-col">
        {Array.isArray(title) ? title.map((t,i)=><span key={i}>{t}</span>) : title}
      </p>

      {!!lines.length && (
        <p className="text-[clamp(0.75rem,0.65rem+0.5vw,1.25rem)] font-[Manrope-Regular] flex flex-col mb-4 text-[#636846]">
          {lines.map((l,i)=><span key={i}>{l}</span>)}
        </p>
      )}

      {!!buttons.length && (
        <div className="flex gap-4">
          {buttons.map((b,i)=>(
            <button
              key={i}
              className={`rounded-[5px] w-full px-[1%] py-[3%] font-[Manrope-Regular] text-[clamp(0.75rem,0.65rem+0.5vw,1.25rem)]
                ${b.variant==='primary' ? 'bg-[#636846] text-[#F7EFE5]' : 'bg-[#F7EFE5] text-[#967450]'}
              `}
            >
              {b.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
export default memo(DesktopCard)
