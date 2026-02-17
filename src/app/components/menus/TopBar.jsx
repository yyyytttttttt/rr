'use client'
import Image from "next/image"
import { memo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import Menu from "./Menu"
import { useState } from "react"
function Topbar (){
    const [open,setOpen]=useState(false)
    return(
        

      <div className="fixed  top-4 left-0 right-0 flex justify-between items-center w-full px-[4%] z-[1000]">
        <div className="group flex gap-2 items-center transition-all duration-700 ease-[cubic-bezier(0.25,1,0.5,1)] w-[20%] sm:w-[15%] md:w-[12%] lg:w-[8%]">
          <div className="w-[50%]">
            <Image
              src="/images/logo.png"
              alt="Логотип"
              width={80}
              height={80}
              className="w-full  h-auto cursor-pointer transition-all duration-700 ease-[cubic-bezier(0.25,1,0.5,1)] group-hover:-translate-x-1 group-hover:drop-shadow-[0_0_8px_rgba(167,124,102,0.4)]"
            />
          </div>
          <div  className="w-[50%] relative">
            <Image onClick={()=>setOpen(!open)} 
              src="/images/Menu1.svg"
              alt="Меню"
              width={80}
              height={80}
               className="relative w-full h-auto cursor-pointer transition-all duration-700 ease-[cubic-bezier(0.25,1,0.5,1)] group-hover:translate-x-1 group-hover:drop-shadow-[0_0_8px_rgba(167,124,102,0.4)]"
            />
            
             
              
            <AnimatePresence>
              {open && <Menu key="menu" setOpen={setOpen} />}
            </AnimatePresence>
              

              
                
              
            
            
          </div>
        </div>


      </div>
    )
    
}
export default memo(Topbar)
     