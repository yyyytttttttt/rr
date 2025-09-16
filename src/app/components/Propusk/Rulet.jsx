'use client'

import { useState } from "react"

export default function Rulet ({children,title}){
    const [openRulet,setOpenRulet]=useState(false)
    return(
        <div className="px-[4%] lg:px-[8%]">
            <div onClick={()=>setOpenRulet(!openRulet)} className={`border cursor-pointer  transition-colors duration-700   border-[#F5F0E4] py-[3%] lg:py-[1%] px-[4%] lg:px-[1%] rounded-[10px]  lg:rounded-[20px]  ${openRulet ? 'bg-[#F5F0E4]' : 'bg-white hover:bg-[#F5F0E4]'}`} >
                <div className="flex justify-between items-center  w-full  ">
                    <p className="font-ManropeBold text-[clamp(1rem,0.7692rem+1.0256vw,2rem)] text-[#636846]">{title}</p>
                    <div className="w-[7%] xs:w-[5%] lg:w-[2%]" onClick={()=>setOpenRulet(!openRulet)}>
                        <svg className={`${openRulet && ' rotate-180'} w-full h-auto transition-transform duration-500 cursor-pointer`} xmlns="http://www.w3.org/2000/svg" width="50" height="50" viewBox="0 0 50 50" fill="none">
                        <rect width="50" height="50" rx="25" fill="#FFFCF3"/>
                        <path d="M36.6813 21.8798L25.7728 32.7884C25.6714 32.8898 25.5511 32.9703 25.4187 33.0252C25.2863 33.0801 25.1443 33.1083 25.001 33.1083C24.8576 33.1083 24.7157 33.0801 24.5832 33.0252C24.4508 32.9703 24.3305 32.8898 24.2292 32.7884L13.3207 21.8798C13.116 21.6752 13.001 21.3975 13.001 21.1081C13.001 20.8186 13.116 20.541 13.3207 20.3363C13.5253 20.1316 13.803 20.0166 14.0924 20.0166C14.3819 20.0166 14.6595 20.1316 14.8642 20.3363L25.001 30.4744L35.1377 20.3363C35.2391 20.2349 35.3594 20.1545 35.4918 20.0997C35.6243 20.0448 35.7662 20.0166 35.9095 20.0166C36.0528 20.0166 36.1948 20.0448 36.3272 20.0997C36.4596 20.1545 36.5799 20.2349 36.6813 20.3363C36.7826 20.4376 36.863 20.558 36.9179 20.6904C36.9727 20.8228 37.001 20.9647 37.001 21.1081C37.001 21.2514 36.9727 21.3933 36.9179 21.5257C36.863 21.6582 36.7826 21.7785 36.6813 21.8798Z" fill="#967450"/>
                        </svg>
                    </div>
            
                </div>
                <div  className={`
                        overflow-hidden transition-all duration-700 ease-in-out
                        ${openRulet ? 'max-h-[200px] opacity-100 mt-[4%] xs:mt-[1%]' : 'max-h-0 opacity-0 '}
                    `}>
                    <p className="font-ManropeRegular text-[clamp(0.75rem,0.5769rem+0.7692vw,1.5rem)] text-[#636846] flex flex-col">
                        {children}
                    </p>
            
                 </div>
            </div>
        </div>
    )

}

