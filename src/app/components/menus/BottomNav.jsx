'use client'
import Image from "next/image"
import { memo, useState } from "react"
import GuestBookingModal from '../modals/GuestBookingModal'

function BottomNav() {
    const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);

    return(
        <>

            <div className="fixed max-w-[1410px] mx-auto bottom-0  xl:bottom-12 left-1/2 transform -translate-x-1/2 w-full  xl:w-3/4 flex items-center justify-between bg-[#e5dccb] px-2 py-1 pb-4 xl:pb-0 rounded-0 xl:rounded-full z-50">
              <button className=" swiper-button-custom-prev-2
           w-[5.4%] sm:w-[3.2%] cursor-pointer
          transition-all duration-700 ease-[cubic-bezier(0.25,1,0.5,1)]
          hover:scale-110 hover:opacity-95 active:scale-95
          before:content-[''] before:absolute before:inset-0 
          before:rounded-full before:bg-gradient-to-r 
          before:from-[#967450]/40 before:to-[#967450]/10
          before:blur-lg before:opacity-0 hover:before:opacity-100 
          before:transition-all before:duration-700
        " >
                <svg className='h-auto w-full hidden xs:flex' xmlns="http://www.w3.org/2000/svg" width="50" height="50" viewBox="0 0 50 50" fill="none">
              <rect x="50" y="50" width="50" height="50" rx="25" transform="rotate(-180 50 50)" fill="#F4EDD7"/>
              <path d="M18.349 25.0001L27.8359 34.4871L26.4896 35.8657L15.6245 25.0001L26.4896 14.1345L27.8359 15.5131L18.349 25.0001Z" fill="#967450"/>
              </svg>
               <svg className='h-auto w-full flex xs:hidden' xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M15.397 19.1025C15.4523 19.154 15.4966 19.2161 15.5273 19.2851C15.5581 19.3541 15.5746 19.4286 15.5759 19.5041C15.5773 19.5796 15.5634 19.6547 15.5351 19.7247C15.5068 19.7947 15.4647 19.8584 15.4113 19.9118C15.3579 19.9652 15.2942 20.0073 15.2242 20.0356C15.1542 20.0639 15.0791 20.0778 15.0036 20.0765C14.9281 20.0751 14.8536 20.0586 14.7846 20.0278C14.7156 19.9971 14.6535 19.9528 14.602 19.8975L7.10201 12.3975C6.99667 12.292 6.9375 12.1491 6.9375 12C6.9375 11.8509 6.99667 11.708 7.10201 11.6025L14.602 4.10251C14.7086 4.00315 14.8497 3.94905 14.9954 3.95163C15.1411 3.9542 15.2802 4.01323 15.3832 4.11629C15.4863 4.21935 15.5453 4.35839 15.5479 4.50411C15.5505 4.64984 15.4964 4.79088 15.397 4.89751L8.29544 12L15.397 19.1025Z" fill="#967450"/>
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
        onClick={() => setIsBookingModalOpen(true)}
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
          alt="Записаться"
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
        className=" swiper-button-custom-next-2
          relative w-[5.4%] sm:w-[3.2%] cursor-pointer
          transition-all duration-700 ease-[cubic-bezier(0.25,1,0.5,1)]
          hover:scale-110 hover:opacity-95 active:scale-95
          before:content-[''] before:absolute before:inset-0 
          before:rounded-full before:bg-gradient-to-r 
          before:from-[#967450]/40 before:to-[#967450]/10
          before:blur-lg before:opacity-0 hover:before:opacity-100 
          before:transition-all before:duration-700
        "
        
      >
        <svg className='h-auto w-full hidden xs:flex' xmlns="http://www.w3.org/2000/svg" width="50" height="50" viewBox="0 0 50 50" fill="none">
<rect width="50" height="50" rx="25" fill="#F4EDD7"/>
<path d="M31.651 24.9998L22.1641 15.5128L23.5104 14.1342L34.3755 24.9998L23.5104 35.8654L22.1641 34.4868L31.651 24.9998Z" fill="#967450"/>
</svg>
    <svg className='h-auto w-full flex xs:hidden' xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
    <path d="M16.8991 12.3975L9.39909 19.8975C9.29246 19.9969 9.15143 20.051 9.0057 20.0484C8.85998 20.0458 8.72094 19.9868 8.61788 19.8837C8.51482 19.7807 8.45578 19.6416 8.45321 19.4959C8.45064 19.3502 8.50473 19.2091 8.60409 19.1025L15.7057 12L8.60409 4.89751C8.50473 4.79088 8.45064 4.64984 8.45321 4.50411C8.45578 4.35839 8.51482 4.21935 8.61788 4.11629C8.72094 4.01323 8.85998 3.9542 9.0057 3.95163C9.15143 3.94905 9.29246 4.00315 9.39909 4.10251L16.8991 11.6025C17.0044 11.708 17.0636 11.8509 17.0636 12C17.0636 12.1491 17.0044 12.292 16.8991 12.3975Z" fill="#967450"/>
    </svg>
      </button>
            </div>

            <GuestBookingModal
              isOpen={isBookingModalOpen}
              onClose={() => setIsBookingModalOpen(false)}
            />
        </>
    )
}
export default memo(BottomNav)