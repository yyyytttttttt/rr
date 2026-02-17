'use client'
import Image from "next/image"
import { motion, AnimatePresence } from "framer-motion"
import { useState } from "react"
import Menu from "./menus/Menu"
import Link from "next/link"
import BottomNav from "./menus/BottomNav"

export default function LayoutOverlay({ text }) {
  const [open,setOpen]=useState(false)
  return (
    <>
      {/* Верхнее меню */}
      <div className="fixed  top-4 left-0 right-0 flex justify-between items-center w-full px-[4%] z-50">
        <div className="group flex gap-2 items-center transition-all duration-700 ease-[cubic-bezier(0.25,1,0.5,1)] w-[20%] sm:w-[15%] md:w-[12%] lg:w-[8%]">
          <div className="w-[40%]">
            <Link href="/" aria-label="На главную" className="block">
              <Image
                src="/images/logo.png"
                alt="Логотип"
                width={80}
                height={80}
                className="w-full h-auto cursor-pointer transition-all duration-700 ease-[cubic-bezier(0.25,1,0.5,1)] group-hover:-translate-x-1 group-hover:drop-shadow-[0_0_8px_rgba(167,124,102,0.4)]"
                priority
              />
            </Link>
          </div>
          <div  className="w-[50%]  relative">
            <Image onClick={()=>setOpen(!open)} 
              src="/images/Menu1.svg"
              alt="Меню"
              width={80}
              height={80}
               className="relative  w-full h-auto cursor-pointer transition-all duration-700 ease-[cubic-bezier(0.25,1,0.5,1)] group-hover:translate-x-1 group-hover:drop-shadow-[0_0_8px_rgba(167,124,102,0.4)]"
            />
            
             
              
            <AnimatePresence>
              {open && <Menu key="menu" setOpen={setOpen} />}
            </AnimatePresence>
              

              
                
              
            
            
          </div>
        </div>

        {/* Анимация текста */}
        <AnimatePresence mode="wait">
          <motion.p
            key={text?.title}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.6, ease: [0.33, 1, 0.68, 1] }}
            className="font-[spaceagecyrillic-regular] w-[50%] text-end text-[clamp(1.25rem,0.9615rem+1.2821vw,2.5rem)] text-[#967450] uppercase"
          >
            {text?.tit}
          </motion.p>
        </AnimatePresence>
      </div>

      {/* Левая колонка и текст */}






      <BottomNav/>
    </>
  )
}
