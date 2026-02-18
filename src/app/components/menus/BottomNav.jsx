'use client'
import Image from "next/image"
import { memo, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import GuestBookingModal from '../modals/GuestBookingModal'

const ArrowLeft = ({ className = "" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 50 50" fill="none" className={className}>
    <rect x="50" y="50" width="50" height="50" rx="25" transform="rotate(-180 50 50)" fill="#F4EDD7"/>
    <path d="M18.349 25.0001L27.8359 34.4871L26.4896 35.8657L15.6245 25.0001L26.4896 14.1345L27.8359 15.5131L18.349 25.0001Z" fill="#967450"/>
  </svg>
)

const ArrowRight = ({ className = "" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 50 50" fill="none" className={className}>
    <rect width="50" height="50" rx="25" fill="#F4EDD7"/>
    <path d="M31.651 25.0001L22.1641 34.4871L23.5104 35.8657L34.3755 25.0001L23.5104 14.1345L22.1641 15.5131L31.651 25.0001Z" fill="#967450"/>
  </svg>
)

// Слайды со слайдерами и их классы навигации
const SLIDER_SLIDES = {
  1: { prev: 'nav-slide-news-prev', next: 'nav-slide-news-next' },
  2: { prev: 'nav-slide-2-prev', next: 'nav-slide-2-next' },
  3: { prev: 'nav-slide-3-prev', next: 'nav-slide-3-next' },
  4: { prev: 'nav-slide-5-prev', next: 'nav-slide-5-next' },
}

function BottomNav({ activeSlide = 0 }) {
  const router = useRouter()
  const pathname = usePathname()
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false)
  const [activeTooltip, setActiveTooltip] = useState(null)

  const isHomePage = pathname === '/' || pathname === ''
  const hasSlider = isHomePage && SLIDER_SLIDES[activeSlide]
  const navClasses = SLIDER_SLIDES[activeSlide] || { prev: '', next: '' }

  const handleTooltipToggle = (index) => {
    setActiveTooltip(activeTooltip === index ? null : index)
  }

  const handleNavigation = (path) => {
    router.push(path)
  }

  return (
    <>
      <div className={`fixed mx-auto bottom-0 sm:bottom-12 left-1/2 transform -translate-x-1/2 w-full flex items-center justify-center px-1 sm:px-2 py-1 pb-0 sm:pb-0 z-50 transition-all duration-300 ${hasSlider ? 'max-w-[100%] sm:max-w-[1440px]' : 'max-w-[810px]'}`}>

        {/* Стрелки влево - видны и на мобильных */}
        <div className={`${hasSlider ? 'flex' : 'hidden'} items-center justify-center mr-1 sm:mr-4`}>
          {Object.entries(SLIDER_SLIDES).map(([slideIdx, classes]) => (
            <button
              key={`prev-${slideIdx}`}
              className={`${classes.prev} items-center justify-center cursor-pointer transition-all duration-300 hover:scale-110 active:scale-95 ${Number(slideIdx) === activeSlide ? 'flex' : 'hidden'}`}
            >
              <ArrowLeft className="w-9 h-9 sm:w-[50px] sm:h-[50px]" />
            </button>
          ))}
        </div>

        <div className={`bg-[#e5dccb] rounded-full flex items-center justify-center py-2 sm:py-1 transition-all duration-300 ${hasSlider ? 'flex-1 max-w-[calc(100%-5rem)] sm:max-w-[810px]' : 'w-full max-w-[810px]'}`}>
          <div className="w-[85%] flex justify-between">

          {/* Главная */}
          <button
            onClick={() => handleNavigation('/')}
            className="
              relative w-[10%] sm:w-[7.4%] cursor-pointer group
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
              className="relative z-10 w-full h-auto drop-shadow-[0_0_6px_#A77C6680] hover:drop-shadow-[0_0_12px_#A77C66]"
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
            <div className={`absolute bottom-full left-1/2 -translate-x-1/2 mb-3 ${activeTooltip === 0 ? 'opacity-100 -translate-y-1' : 'opacity-0'} group-hover:opacity-100 group-hover:-translate-y-1 transition-all duration-300 pointer-events-none`}>
              <div className="bg-gradient-to-br from-[#A77C66] to-[#8B6654] text-white px-3 py-1.5 rounded-lg shadow-[0_4px_16px_rgba(167,124,102,0.4)] whitespace-nowrap text-xs sm:text-sm font-medium">
                <span className="drop-shadow-sm">Главная</span>
                <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-0.5 w-0 h-0 border-l-[5px] border-l-transparent border-r-[5px] border-r-transparent border-t-[5px] border-t-[#8B6654]"></div>
              </div>
            </div>
          </button>

          {/* Услуги */}
          <button
            onClick={() => handleNavigation('/Servic/')}
            className="
              relative w-[10%] sm:w-[7.4%] cursor-pointer group
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
              className="relative z-10 w-full h-auto drop-shadow-[0_0_6px_#A77C6680] hover:drop-shadow-[0_0_12px_#A77C66]"
              xmlns="http://www.w3.org/2000/svg"
              width="61"
              height="60"
              viewBox="0 0 61 60"
              fill="none"
            >
              <path
                d="M10.5408 16.6905H27.1778L30.5052 21.3489H50.4697V43.3098H10.5408V16.6905Z"
                stroke="#A77C66"
                strokeWidth="1.7428"
                strokeLinejoin="round"
              />
            </svg>
            <div className={`absolute bottom-full left-1/2 -translate-x-1/2 mb-3 ${activeTooltip === 1 ? 'opacity-100 -translate-y-1' : 'opacity-0'} group-hover:opacity-100 group-hover:-translate-y-1 transition-all duration-300 pointer-events-none`}>
              <div className="bg-gradient-to-br from-[#A77C66] to-[#8B6654] text-white px-3 py-1.5 rounded-lg shadow-[0_4px_16px_rgba(167,124,102,0.4)] whitespace-nowrap text-xs sm:text-sm font-medium">
                <span className="drop-shadow-sm">Услуги</span>
                <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-0.5 w-0 h-0 border-l-[5px] border-l-transparent border-r-[5px] border-r-transparent border-t-[5px] border-t-[#8B6654]"></div>
              </div>
            </div>
          </button>

          {/* Записаться */}
          <button
            onClick={() => setIsBookingModalOpen(true)}
            onMouseEnter={() => setActiveTooltip(2)}
            onMouseLeave={() => setActiveTooltip(null)}
            onTouchStart={() => handleTooltipToggle(2)}
            className="
              relative w-[10%] sm:w-[7.4%] flex-shrink-0 scale-[1.5] cursor-pointer group
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
              alt="Записаться"
              width={60}
              height={60}
              className="relative z-10 drop-shadow-[0_0_6px_#A77C6680] hover:drop-shadow-[0_0_12px_#A77C66]"
            />
            <div className={`absolute bottom-full left-1/2 -translate-x-1/2 mb-4 ${activeTooltip === 2 ? 'opacity-100 -translate-y-1' : 'opacity-0'} transition-all duration-300 pointer-events-none`}>
              <div className="bg-gradient-to-br from-[#A77C66] to-[#8B6654] text-white px-3 py-1.5 rounded-lg shadow-[0_4px_16px_rgba(167,124,102,0.4)] whitespace-nowrap text-xs sm:text-sm font-medium">
                <span className="drop-shadow-sm">Записаться</span>
                <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-0.5 w-0 h-0 border-l-[5px] border-l-transparent border-r-[5px] border-r-transparent border-t-[5px] border-t-[#8B6654]"></div>
              </div>
            </div>
          </button>

          {/* Профиль */}
          <button
            onClick={() => handleNavigation('/profile/')}
            className="
              relative w-[10%] sm:w-[7.4%] cursor-pointer group
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
              className="relative z-10 w-full h-auto drop-shadow-[0_0_6px_#A77C6680] hover:drop-shadow-[0_0_12px_#A77C66]"
              xmlns="http://www.w3.org/2000/svg"
              width="61"
              height="60"
              viewBox="0 0 61 60"
              fill="none"
            >
              <path
                d="M30.5004 29.9999C36.7136 29.9999 41.7504 24.9631 41.7504 18.7499C41.7504 12.5367 36.7136 7.49994 30.5004 7.49994C24.2872 7.49994 19.2504 12.5367 19.2504 18.7499C19.2504 24.9631 24.2872 29.9999 30.5004 29.9999Z"
                stroke="#A77C66"
                strokeWidth="1.74598"
              />
              <path
                d="M15.4998 48.7498C15.4998 40.4651 22.2151 33.7498 30.4998 33.7498C38.7844 33.7498 45.4998 40.4651 45.4998 48.7498"
                stroke="#A77C66"
                strokeWidth="1.74598"
                strokeLinecap="round"
              />
            </svg>
            <div className={`absolute bottom-full left-1/2 -translate-x-1/2 mb-3 ${activeTooltip === 3 ? 'opacity-100 -translate-y-1' : 'opacity-0'} group-hover:opacity-100 group-hover:-translate-y-1 transition-all duration-300 pointer-events-none`}>
              <div className="bg-gradient-to-br from-[#A77C66] to-[#8B6654] text-white px-3 py-1.5 rounded-lg shadow-[0_4px_16px_rgba(167,124,102,0.4)] whitespace-nowrap text-xs sm:text-sm font-medium">
                <span className="drop-shadow-sm">Профиль</span>
                <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-0.5 w-0 h-0 border-l-[5px] border-l-transparent border-r-[5px] border-r-transparent border-t-[5px] border-t-[#8B6654]"></div>
              </div>
            </div>
          </button>

          {/* Контакты */}
          <button
            onClick={() => handleNavigation('/how-to-find/')}
            className="
              relative w-[10%] sm:w-[7.4%] cursor-pointer group
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
              className="relative z-10 w-full h-auto drop-shadow-[0_0_6px_#A77C6680] hover:drop-shadow-[0_0_12px_#A77C66]"
              xmlns="http://www.w3.org/2000/svg"
              width="61"
              height="60"
              viewBox="0 0 61 60"
              fill="none"
            >
              <path
                d="M13.547 18.7947H48.3624C50.1031 18.7947 51.2636 19.9552 51.2636 21.696V39.1037C51.2636 40.8445 50.1031 42.005 48.3624 42.005H28.0534L22.2509 47.8075V42.005H13.547C11.8063 42.005 10.6458 40.8445 10.6458 39.1037V21.696C10.6458 19.9552 11.8063 18.7947 13.547 18.7947Z"
                stroke="#A77C66"
                strokeWidth="1.7428"
                strokeLinejoin="round"
              />
            </svg>
            <div className={`absolute bottom-full left-1/2 -translate-x-1/2 mb-3 ${activeTooltip === 4 ? 'opacity-100 -translate-y-1' : 'opacity-0'} group-hover:opacity-100 group-hover:-translate-y-1 transition-all duration-300 pointer-events-none`}>
              <div className="bg-gradient-to-br from-[#A77C66] to-[#8B6654] text-white px-3 py-1.5 rounded-lg shadow-[0_4px_16px_rgba(167,124,102,0.4)] whitespace-nowrap text-xs sm:text-sm font-medium">
                <span className="drop-shadow-sm">Контакты</span>
                <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-0.5 w-0 h-0 border-l-[5px] border-l-transparent border-r-[5px] border-r-transparent border-t-[5px] border-t-[#8B6654]"></div>
              </div>
            </div>
          </button>

          </div>
        </div>

        {/* Стрелки вправо - видны и на мобильных */}
        <div className={`${hasSlider ? 'flex' : 'hidden'} items-center justify-center ml-1 sm:ml-4`}>
          {Object.entries(SLIDER_SLIDES).map(([slideIdx, classes]) => (
            <button
              key={`next-${slideIdx}`}
              className={`${classes.next} items-center justify-center cursor-pointer transition-all duration-300 hover:scale-110 active:scale-95 ${Number(slideIdx) === activeSlide ? 'flex' : 'hidden'}`}
            >
              <ArrowRight className="w-9 h-9 sm:w-[50px] sm:h-[50px]" />
            </button>
          ))}
        </div>

      </div>

      <GuestBookingModal
        isOpen={isBookingModalOpen}
        onClose={() => setIsBookingModalOpen(false)}
      />
    </>
  )
}

export default memo(BottomNav)
