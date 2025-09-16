'use client'
import Image from "next/image"
import { motion, AnimatePresence } from "framer-motion"
import { useState } from "react"
import Menu from "./menus/Menu"

export default function LayoutOverlay({ text }) {
  const [open,setOpen]=useState(false)
  return (
    <>
      {/* Верхнее меню */}
      <div className="fixed  top-4 left-0 right-0 flex justify-between items-center w-full px-[4%] z-50">
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

        {/* Анимация текста */}
        <AnimatePresence mode="wait">
          <motion.p
            key={text?.title}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.6, ease: [0.33, 1, 0.68, 1] }}
            className="font-[spaceagecyrillic-regular] text-end text-[clamp(1.5rem,1rem+2.5vw,4rem)] text-[#414141]"
          >
            {text?.tit}
          </motion.p>
        </AnimatePresence>
      </div>

      {/* Левая колонка и текст */}
      <div className="fixed   transform top-[30%]  xs:top-1/2 left-[4%]  -translate-y-1/2 flex justify-between items-center gap-16 z-30 w-[20%] text-[#414141]">
        <div className="flex flex-col gap-4 w-[58%] xs:w-[32%] lg:w-[18%]">
          {[
            { src: "/images/loc1.svg", alt: "Лок" },
            { src: "/images/doc1.svg", alt: "Док" },
            { src: "/images/lk1.svg", alt: "ЛК" },
            { src: "/images/zv1.svg", alt: "Зв" },
          ].map(({ src, alt }, i) => (
            <div key={i}>
              <Image
                src={src}
                alt={alt}
                width={80}
                height={80}
                className="h-auto max-w-[40px] xs:max-w-[80px]  xs:w-full transition cursor-pointer duration-700 ease-[cubic-bezier(0.25,1,0.5,1)] hover:-translate-y-1 hover:scale-110 hover:drop-shadow-[0_0_15px_rgba(167,124,102,0.5)]"
              />
            </div>
          ))}
        </div>

       

      </div>

      
    </>
  )
}
