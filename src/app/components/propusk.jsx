'use client'
import Image from "next/image"
import { motion, AnimatePresence } from "framer-motion"

export default function Propusk({ next, prev, text }) {
  return (
    <>
      {/* Верхнее меню */}
      <div className="fixed  top-4 left-0 right-0 flex justify-between items-center w-full px-[4%] z-50">
        <div className="group flex gap-4 transition-all duration-700 ease-[cubic-bezier(0.25,1,0.5,1)] w-[20%] sm:w-[15%] md:w-[12%] lg:w-[8%]">
          <Image
            src="/images/Logo2.svg"
            alt="Логотип"
            width={80}
            height={80}
            className="w-1/2 h-auto cursor-pointer transition-all duration-700 ease-[cubic-bezier(0.25,1,0.5,1)] group-hover:-translate-x-1 group-hover:drop-shadow-[0_0_8px_rgba(167,124,102,0.4)]"
          />
          <Image
            src="/images/Menu.svg"
            alt="Меню"
            width={80}
            height={80}
            className="relative w-1/2 h-auto cursor-pointer transition-all duration-700 ease-[cubic-bezier(0.25,1,0.5,1)] group-hover:translate-x-1 group-hover:drop-shadow-[0_0_8px_rgba(167,124,102,0.4)]"
          />
        </div>

        {/* Анимация текста */}
       <AnimatePresence mode="wait">
  <motion.div
    key={text?.title}
    variants={{
      hidden: { opacity: 0, y: 12, scale: 0.99, filter: "blur(1.5px)" },
      show: {
        opacity: 1, y: 0, scale: 1, filter: "blur(0px)",
        transition: { duration: 0.45, ease: [0.33, 1, 0.68, 1] }
      },
      exit: {
        opacity: 0, y: -10, scale: 0.99, filter: "blur(1.5px)",
        transition: { duration: 0.3, ease: [0.33, 1, 0.68, 1] }
      }
    }}
    initial="hidden"
    animate="show"
    exit="exit"
  >
    <motion.p
      variants={{
        hidden: { opacity: 0, y: 8 },
        show: { opacity: 1, y: 0, transition: { duration: 0.32, ease: [0.33, 1, 0.68, 1] } },
        exit: { opacity: 0, y: -6, transition: { duration: 0.26, ease: [0.33, 1, 0.68, 1] } }
      }}
      className="font-[spaceagecyrillic-regular] text-[clamp(1.5rem,1rem+2.5vw,4rem)] text-[#414141]"
    >
      {text?.tit}
    </motion.p>
  </motion.div>
</AnimatePresence>
      </div>

      {/* Левая колонка и текст */}
      <div className="fixed  top-1/2 px-[4%] transform -translate-y-1/2 flex gap-[6%] items-center  z-50 w-full text-[#414141]">
        <div className="flex flex-col gap-4 w-[11%] sm:w-[7%] lg:w-[4%]">
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
                className="h-auto w-full transition cursor-pointer duration-700 ease-[cubic-bezier(0.25,1,0.5,1)] hover:-translate-y-1 hover:scale-110 hover:drop-shadow-[0_0_15px_rgba(167,124,102,0.5)]"
              />
            </div>
          ))}
        </div>

       
{/* Центрированный текст */}
<AnimatePresence mode="wait">
  <motion.div
    key={text?.title}
    variants={{
      hidden: { opacity: 0, y: 14, scale: 0.99, filter: "blur(1.5px)" },
      show: {
        opacity: 1, y: 0, scale: 1, filter: "blur(0px)",
        transition: {
          duration: 0.45,
          ease: [0.33, 1, 0.68, 1],
          when: "beforeChildren",
          staggerChildren: 0.035,
          delayChildren: 0.02
        }
      },
      exit: {
        opacity: 0, y: -12, scale: 0.99, filter: "blur(1.5px)",
        transition: { duration: 0.3, ease: [0.33, 1, 0.68, 1] }
      }
    }}
    initial="hidden"
    animate="show"
    exit="exit"
    className="px-[2%] rounded-[20px] py-[2%] w-[55%] 4xl:w-[42%] z-50 text-[#414141]"
  >
    <motion.h2
      variants={{
        hidden: { opacity: 0, y: 8 },
        show: { opacity: 1, y: 0, transition: { duration: 0.32, ease: [0.33, 1, 0.68, 1] } }
      }}
      className="text-[clamp(0.875rem,0.55rem+1.625vw,2.5rem)] font-[Manrope-Bold] mb-4"
    >
      {text?.title}
    </motion.h2>

    <motion.p
      variants={{
        hidden: { opacity: 0, y: 8 },
        show: { opacity: 1, y: 0, transition: { duration: 0.3, ease: [0.33, 1, 0.68, 1] } }
      }}
      className="text-[clamp(0.75rem,0.65rem+0.5vw,1.25rem)] font-[Manrope-Regular] mb-4"
    >
      {text?.desc}
    </motion.p>

   <motion.div
  variants={{
    hidden: { opacity: 0, y: 6 },
    show:   { opacity: 1, y: 0, transition: { duration: 0.28, ease: [0.33,1,0.68,1] } }
  }}
  className="flex flex-wrap  gap-4"
>
  {(text?.buttons ?? []).map((btn, i) => (
    <motion.button
      key={i}
      variants={{ hidden: { opacity: 0, y: 6 }, show: { opacity: 1, y: 0, transition: { duration: 0.24, delay: 0.03 * i } } }}
      className="rounded-[10px] px-[6%] py-[3%] font-[Manrope-Regular] text-[clamp(0.75rem,0.65rem+0.5vw,1.25rem)]"
      style={{
        backgroundColor: btn.bg ?? 'transparent',
        color:           btn.text ?? '#636846',
        borderColor:     btn.border ?? 'transparent',
        borderWidth:     btn.border ? 1 : 0,
      }}
      onClick={btn.onClick}
    >
      {btn.label}
    </motion.button>
  ))}
</motion.div>
  </motion.div>
</AnimatePresence>

      </div>

      {/* Bottom Nav */}
      <div className="fixed max-w-[1410px] mx-auto bottom-12 left-1/2 transform -translate-x-1/2 w-3/4 flex items-center justify-between bg-[#e5dccb] px-2 rounded-full z-50">
        <button className="
    relative w-[5.4%] sm:w-[4.2%] cursor-pointer
    transition-all duration-700 ease-[cubic-bezier(0.25,1,0.5,1)]
    hover:scale-110 hover:opacity-95 active:scale-95
    before:content-[''] before:absolute before:inset-0 
    before:rounded-full before:bg-gradient-to-r 
    before:from-[#967450]/40 before:to-[#967450]/10
    before:blur-lg before:opacity-0 hover:before:opacity-100 
    before:transition-all before:duration-700
  " onClick={prev}>
          <svg className="w-full h-auto" xmlns="http://www.w3.org/2000/svg" width="50" height="50" viewBox="0 0 50 50" fill="none">
          <circle cx="25" cy="25" r="25" transform="matrix(-1 0 0 1 50 0)" fill="#414141"/>
          <path d="M17.4276 25.9412C16.9078 25.4214 16.9078 24.5786 17.4276 24.0588L25.8987 15.5877C26.4185 15.0678 27.2614 15.0678 27.7812 15.5877C28.301 16.1075 28.301 16.9503 27.7812 17.4701L20.2513 25L27.7812 32.5299C28.301 33.0497 28.301 33.8925 27.7812 34.4123C27.2614 34.9322 26.4185 34.9322 25.8987 34.4123L17.4276 25.9412ZM19.8368 25L19.8368 26.3311L18.3688 26.3311L18.3688 25L18.3688 23.6689L19.8368 23.6689L19.8368 25Z" fill="#967450"/>
          </svg>
        </button>
        <div className="w-[80%] sm:w-[50%] flex justify-between">
         <button
  className="
    relative w-[10%] sm:w-[7.4%] cursor-pointer
    transition-all duration-700 ease-[cubic-bezier(0.25,1,0.5,1)]
    hover:scale-110 hover:opacity-95 active:scale-95
    before:content-[''] before:absolute before:inset-0 
    before:rounded-xl before:bg-gradient-to-r 
    before:from-[#A77C66]/40 before:to-[#A77C66]/10
    before:blur-lg before:opacity-0 hover:before:opacity-100 
    before:transition-all before:duration-700
  "
>
  <svg 
    className="relative z-10 w-full h-auto 
      drop-shadow-[0_0_6px_#A77C6680] 
      hover:drop-shadow-[0_0_12px_#A77C66]"
    xmlns="http://www.w3.org/2000/svg" 
    width="61" 
    height="60" 
    viewBox="0 0 61 60" 
    fill="none"
  >
    <path 
      d="M16.3643 27.6396L30.5067 13.4972L44.6491 27.6396V41.782C44.6491 44.1391 42.2921 46.4961 39.935 46.4961H21.0785C18.7214 46.4961 16.3643 44.1391 16.3643 41.782V27.6396Z" 
      stroke="#A77C66" 
      strokeWidth="1.7428" 
      strokeLinejoin="round"
    />
  </svg>
</button>
          <button  className="
    relative w-[10%] sm:w-[7.4%] cursor-pointer
    transition-all duration-700 ease-[cubic-bezier(0.25,1,0.5,1)]
    hover:scale-110 hover:opacity-95 active:scale-95
    before:content-[''] before:absolute before:inset-0 
    before:rounded-xl before:bg-gradient-to-r 
    before:from-[#A77C66]/40 before:to-[#A77C66]/10
    before:blur-lg before:opacity-0 hover:before:opacity-100 
    before:transition-all before:duration-700
  ">
            <svg className="relative z-10 w-full h-auto 
      drop-shadow-[0_0_6px_#A77C6680] 
      hover:drop-shadow-[0_0_12px_#A77C66]" xmlns="http://www.w3.org/2000/svg" width="61" height="60" viewBox="0 0 61 60" fill="none">
              <path d="M10.5408 16.6905H27.1778L30.5052 21.3489H50.4697V43.3098H10.5408V16.6905Z" stroke="#A77C66" stroke-width="1.7428" stroke-linejoin="round"/>
              </svg>

          </button>
         <button
  className="
    relative w-[10%] sm:w-[7.4%] flex-shrink-0 scale-[1.5] cursor-pointer
    transition-all duration-700 ease-[cubic-bezier(0.25,1,0.5,1)]
    hover:scale-[1.65] hover:opacity-95 active:scale-[1.4]
    before:content-[''] before:absolute before:inset-0
    before:rounded-full before:bg-gradient-to-r 
    before:from-[#A77C66]/40 before:to-[#A77C66]/10
    before:blur-lg before:opacity-0 hover:before:opacity-100
    before:transition-all before:duration-700
  "
>
  <Image 
    src="/images/pl.svg" 
    alt="Зв" 
    width={60} 
    height={60}
    className="relative z-10 drop-shadow-[0_0_6px_#A77C6680] hover:drop-shadow-[0_0_12px_#A77C66]"
  />
</button>
          <button  className="
    relative w-[10%] sm:w-[7.4%] cursor-pointer
    transition-all duration-700 ease-[cubic-bezier(0.25,1,0.5,1)]
    hover:scale-110 hover:opacity-95 active:scale-95
    before:content-[''] before:absolute before:inset-0 
    before:rounded-xl before:bg-gradient-to-r 
    before:from-[#A77C66]/40 before:to-[#A77C66]/10
    before:blur-lg before:opacity-0 hover:before:opacity-100 
    before:transition-all before:duration-700
  ">
            <svg className="relative z-10 w-full h-auto 
      drop-shadow-[0_0_6px_#A77C6680] 
      hover:drop-shadow-[0_0_12px_#A77C66]" xmlns="http://www.w3.org/2000/svg" width="61" height="60" viewBox="0 0 61 60" fill="none">
              <path d="M30.5004 29.9999C36.7136 29.9999 41.7504 24.9631 41.7504 18.7499C41.7504 12.5367 36.7136 7.49994 30.5004 7.49994C24.2872 7.49994 19.2504 12.5367 19.2504 18.7499C19.2504 24.9631 24.2872 29.9999 30.5004 29.9999Z" stroke="#A77C66" stroke-width="1.74598"/>
              <path d="M15.4998 48.7498C15.4998 40.4651 22.2151 33.7498 30.4998 33.7498C38.7844 33.7498 45.4998 40.4651 45.4998 48.7498" stroke="#A77C66" stroke-width="1.74598" stroke-linecap="round"/>
              </svg>
        </button>
          <button  className="
    relative w-[10%] sm:w-[7.4%] cursor-pointer
    transition-all duration-700 ease-[cubic-bezier(0.25,1,0.5,1)]
    hover:scale-110 hover:opacity-95 active:scale-95
    before:content-[''] before:absolute before:inset-0 
    before:rounded-xl before:bg-gradient-to-r 
    before:from-[#A77C66]/40 before:to-[#A77C66]/10
    before:blur-lg before:opacity-0 hover:before:opacity-100 
    before:transition-all before:duration-700
  ">
            <svg className="relative z-10 w-full h-auto 
      drop-shadow-[0_0_6px_#A77C6680] 
      hover:drop-shadow-[0_0_12px_#A77C66]" xmlns="http://www.w3.org/2000/svg" width="61" height="60" viewBox="0 0 61 60" fill="none">
          <path d="M13.547 18.7947H48.3624C50.1031 18.7947 51.2636 19.9552 51.2636 21.696V39.1037C51.2636 40.8445 50.1031 42.005 48.3624 42.005H28.0534L22.2509 47.8075V42.005H13.547C11.8063 42.005 10.6458 40.8445 10.6458 39.1037V21.696C10.6458 19.9552 11.8063 18.7947 13.547 18.7947Z" stroke="#A77C66" stroke-width="1.7428" stroke-linejoin="round"/>
          </svg>
          </button>
        </div>
        <button
  className="
    relative w-[5.4%] sm:w-[4.2%] cursor-pointer
    transition-all duration-700 ease-[cubic-bezier(0.25,1,0.5,1)]
    hover:scale-110 hover:opacity-95 active:scale-95
    before:content-[''] before:absolute before:inset-0 
    before:rounded-full before:bg-gradient-to-r 
    before:from-[#967450]/40 before:to-[#967450]/10
    before:blur-lg before:opacity-0 hover:before:opacity-100 
    before:transition-all before:duration-700
  "
  onClick={next}
>
  <svg className="relative z-10 w-full h-auto" xmlns="http://www.w3.org/2000/svg" width="50" height="52" viewBox="0 0 50 52" fill="none">
    <ellipse cx="25" cy="26" rx="25" ry="25.2789" fill="#414141"/>
    <path d="M32.5721 26.9412C33.092 26.4213 33.092 25.5785 32.5721 25.0587L24.101 16.5876C23.5812 16.0678 22.7384 16.0678 22.2185 16.5876C21.6987 17.1074 21.6987 17.9502 22.2185 18.4701L29.7484 25.9999L22.2185 33.5298C21.6987 34.0496 21.6987 34.8925 22.2185 35.4123C22.7384 35.9321 23.5812 35.9321 24.101 35.4123L32.5721 26.9412ZM30.1629 25.9999L30.1629 27.331L31.6309 27.331L31.6309 25.9999L31.6309 24.6688L30.1629 24.6688L30.1629 25.9999Z" fill="#967450"/>
  </svg>
</button>
      </div>
    </>
  )
}
