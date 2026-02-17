'use client'
import { memo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const TopTitle = memo(function TopTitle({ active, texts }) {
  return (
    <div className="absolute top-[1%] right-[4%] z-[99] w-[70%]">
      <AnimatePresence mode="wait">
        <motion.p
          key={active}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.6, ease: [0.33, 1, 0.68, 1] }}
          className="font-[spaceagecyrillic-regular] text-end text-[clamp(1.5rem,1rem+2.5vw,4rem)]  text-[#967450]"
        >
          {texts[active]}
        </motion.p>
      </AnimatePresence>
    </div>
  )
})
export default memo(TopTitle)
