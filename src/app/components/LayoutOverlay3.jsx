'use client'

import Image from 'next/image'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { useState } from 'react'
import Menu from './menus/Menu'

export default function Layout({ children, title }) {
  const [open, setOpen] = useState(false)

  return (
    <div>
      {/* Верхняя панель */}
      <header className="flex justify-between items-start mb-[2%] w-full px-[4%] py-3 z-0">
        <div className="group flex gap-2 items-center transition-all duration-700 ease-[cubic-bezier(0.25,1,0.5,1)] w-[20%] sm:w-[15%] md:w-[12%] lg:w-[8%]">
          
          {/* ✅ ЛОГО -> НА ГЛАВНУЮ */}
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

          <div className="w-[50%] relative flex items-center">
            <button
              type="button"
              aria-label="Открыть меню"
              onClick={() => setOpen((v) => !v)}
              className="relative w-full h-auto cursor-pointer transition-all duration-700 ease-[cubic-bezier(0.25,1,0.5,1)] group-hover:translate-x-1 group-hover:drop-shadow-[0_0_8px_rgba(167,124,102,0.4)]"
            >
              <Image
                src="/images/Menu1.svg"
                alt=""
                width={80}
                height={80}
                className="w-full h-auto"
              />
            </button>

            <AnimatePresence>
              {open && <Menu key="menu" setOpen={setOpen} />}
            </AnimatePresence>
          </div>
        </div>

        {/* Анимируемый заголовок */}
        <AnimatePresence mode="wait">
          {title ? (
            <motion.p
              key={title}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.6, ease: [0.33, 1, 0.68, 1] }}
              className="font-[spaceagecyrillic-regular] w-[50%] text-end text-[clamp(1.25rem,0.9615rem+1.2821vw,2.5rem)] text-[#967450] uppercase"
            >
              {title}
            </motion.p>
          ) : (
            <span />
          )}
        </AnimatePresence>
      </header>

      {/* Контент страницы */}
      <main>{children}</main>
    </div>
  )
}
