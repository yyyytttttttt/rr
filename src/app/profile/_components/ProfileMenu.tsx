"use client";

import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";

type View = "home" | "booking" | "healthpasses" | "history" | "gifts" | "settings";

type Props = {
  setOpen: (open: boolean) => void;
  currentView: View;
};

type MenuItem = {
  view: View;
  label: string;
  icon: React.ReactNode;
  badge?: number;
};

const MENU_ITEMS: MenuItem[] = [
  {
    view: "home",
    label: "Главная профиля",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 32 32" fill="none">
        <path d="M27.2375 13.7626L17.2375 3.76263C17.075 3.6001 16.8821 3.47118 16.6697 3.38323C16.4574 3.29527 16.2298 3.25 16 3.25C15.7702 3.25 15.5426 3.29527 15.3303 3.38323C15.1179 3.47118 14.925 3.6001 14.7625 3.76263L4.76251 13.7626C4.59956 13.9248 4.47037 14.1177 4.38241 14.3301C4.29444 14.5425 4.24944 14.7702 4.25001 15.0001V27.0001C4.25001 27.199 4.32902 27.3898 4.46968 27.5305C4.61033 27.6711 4.80109 27.7501 5.00001 27.7501H27C27.1989 27.7501 27.3897 27.6711 27.5303 27.5305C27.671 27.3898 27.75 27.199 27.75 27.0001V15.0001C27.7506 14.7702 27.7056 14.5425 27.6176 14.3301C27.5296 14.1177 27.4004 13.9248 27.2375 13.7626ZM26.25 26.2501H5.75001V15.0001C5.74981 14.9672 5.75612 14.9346 5.76856 14.9042C5.781 14.8737 5.79934 14.846 5.82251 14.8226L15.8225 4.82263C15.8457 4.79919 15.8734 4.7806 15.9039 4.7679C15.9343 4.75521 15.967 4.74868 16 4.74868C16.033 4.74868 16.0657 4.75521 16.0961 4.7679C16.1266 4.7806 16.1543 4.79919 16.1775 4.82263L26.1775 14.8226C26.2007 14.846 26.219 14.8737 26.2314 14.9042C26.2439 14.9346 26.2502 14.9672 26.25 15.0001V26.2501Z" fill="#636846"/>
      </svg>
    ),
  },
  {
    view: "booking",
    label: "Записи на приём",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 32 32" fill="none">
        <g clipPath="url(#clip0_10064_124)">
          <path d="M28 11V25.1112C28 25.347 27.9064 25.573 27.7397 25.7397C27.573 25.9064 27.347 26 27.1112 26H5C4.73478 26 4.48043 25.8946 4.29289 25.7071C4.10536 25.5196 4 25.2652 4 25V8C4 7.73478 4.10536 7.48043 4.29289 7.29289C4.48043 7.10536 4.73478 7 5 7H11.6663C11.8826 7 12.0932 7.07018 12.2662 7.2L16 10H27C27.2652 10 27.5196 10.1054 27.7071 10.2929C27.8946 10.4804 28 10.7348 28 11Z" stroke="#636846" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </g>
        <defs>
          <clipPath id="clip0_10064_124">
            <rect width="32" height="32" fill="white"/>
          </clipPath>
        </defs>
      </svg>
    ),
  },
  {
    view: "healthpasses",
    label: "Пропуски здоровья",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 32 32" fill="none">
        <g clipPath="url(#clip0_10064_820)">
          <path d="M16 28C16 28 3 21 3 12.75C3 10.9598 3.71116 9.2429 4.97703 7.97703C6.2429 6.71116 7.95979 6 9.75 6C12.5738 6 14.9925 7.53875 16 10C17.0075 7.53875 19.4262 6 22.25 6C24.0402 6 25.7571 6.71116 27.023 7.97703C28.2888 9.2429 29 10.9598 29 12.75C29 21 16 28 16 28Z" stroke="#636846" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </g>
        <defs>
          <clipPath id="clip0_10064_820">
            <rect width="32" height="32" fill="white"/>
          </clipPath>
        </defs>
      </svg>
    ),
  },
  {
    view: "history",
    label: "История записей",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 32 32" fill="none">
        <g clipPath="url(#clip0_10064_332)">
          <path d="M16 10V16L21 19" stroke="#967450" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M9 13H4V8" stroke="#967450" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M8.45 24.0005C10.0225 25.4843 11.9973 26.4718 14.1278 26.8396C16.2583 27.2075 18.4499 26.9393 20.4289 26.0687C22.4078 25.1981 24.0864 23.7636 25.2547 21.9445C26.4231 20.1254 27.0295 18.0023 26.9982 15.8406C26.9668 13.6788 26.2991 11.5742 25.0785 9.78968C23.8579 8.0052 22.1385 6.61999 20.1351 5.80711C18.1318 4.99424 15.9333 4.78975 13.8144 5.21919C11.6954 5.64864 9.75004 6.69298 8.22125 8.22173C6.75 9.71173 5.535 11.1167 4 13.0005" stroke="#967450" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </g>
        <defs>
          <clipPath id="clip0_10064_332">
            <rect width="32" height="32" fill="white"/>
          </clipPath>
        </defs>
      </svg>
    ),
  },
  {
    view: "gifts",
    label: "Подарочные сертификаты",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 32 32" fill="none">
        <g clipPath="url(#clip0_10064_2848)">
          <path d="M27 10H5C4.44772 10 4 10.4477 4 11V15C4 15.5523 4.44772 16 5 16H27C27.5523 16 28 15.5523 28 15V11C28 10.4477 27.5523 10 27 10Z" stroke="#636846" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M26 16V25C26 25.2652 25.8946 25.5196 25.7071 25.7071C25.5196 25.8946 25.2652 26 25 26H7C6.73478 26 6.48043 25.8946 6.29289 25.7071C6.10536 25.5196 6 25.2652 6 25V16" stroke="#636846" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M16 10V26" stroke="#636846" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M22.0987 3.90159C23.2662 5.06909 23.335 7.03409 22.0987 8.12909C19.985 10.0003 16 10.0003 16 10.0003C16 10.0003 16 6.01534 17.875 3.90159C18.9662 2.66534 20.9312 2.73409 22.0987 3.90159Z" stroke="#636846" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M9.90159 3.90159C8.73409 5.06909 8.66534 7.03409 9.90159 8.12909C12.0153 10.0003 16.0003 10.0003 16.0003 10.0003C16.0003 10.0003 16.0003 6.01534 14.1253 3.90159C13.0341 2.66534 11.0691 2.73409 9.90159 3.90159Z" stroke="#636846" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </g>
        <defs>
          <clipPath id="clip0_10064_2848">
            <rect width="32" height="32" fill="white"/>
          </clipPath>
        </defs>
      </svg>
    ),
  },
  {
    view: "settings",
    label: "Настройки",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 32 32" fill="none">
        <g clipPath="url(#clip0_10064_792)">
          <path d="M16 21C18.7614 21 21 18.7614 21 16C21 13.2386 18.7614 11 16 11C13.2386 11 11 13.2386 11 16C11 18.7614 13.2386 21 16 21Z" stroke="#636846" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M5.17867 22.2612C4.62614 21.3095 4.20283 20.2884 3.91992 19.2249L6.01742 16.5999C5.99367 16.1986 5.99367 15.7962 6.01742 15.3949L3.92117 12.7699C4.2036 11.7063 4.62604 10.6848 5.17742 9.73242L8.51617 9.35742C8.78279 9.05704 9.06704 8.77279 9.36742 8.50617L9.74242 5.16867C10.6935 4.61992 11.7132 4.19999 12.7749 3.91992L15.3999 6.01742C15.8012 5.99367 16.2036 5.99367 16.6049 6.01742L19.2299 3.92117C20.2936 4.2036 21.315 4.62604 22.2674 5.17742L22.6424 8.51617C22.9428 8.78279 23.2271 9.06704 23.4937 9.36742L26.8312 9.74242C27.3837 10.6941 27.807 11.7152 28.0899 12.7787L25.9924 15.4037C26.0162 15.805 26.0162 16.2074 25.9924 16.6087L28.0887 19.2337C27.8082 20.297 27.3879 21.3184 26.8387 22.2712L23.4999 22.6462C23.2333 22.9466 22.9491 23.2308 22.6487 23.4974L22.2737 26.8349C21.322 27.3875 20.3009 27.8108 19.2374 28.0937L16.6124 25.9962C16.2111 26.0199 15.8087 26.0199 15.4074 25.9962L12.7824 28.0924C11.7191 27.812 10.6977 27.3916 9.74492 26.8424L9.36992 23.5037C9.06954 23.2371 8.78529 22.9528 8.51867 22.6524L5.17867 22.2612Z" stroke="#636846" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </g>
        <defs>
          <clipPath id="clip0_10064_792">
            <rect width="32" height="32" fill="white"/>
          </clipPath>
        </defs>
      </svg>
    ),
  },
];

export default function ProfileMenu({ setOpen, currentView }: Props) {
  const router = useRouter();

  const handleNavigate = (view: View) => {
    const params = new URLSearchParams();
    params.set("view", view);
    router.replace(`/profile?${params.toString()}`, { scroll: false });
    if (typeof window !== "undefined") localStorage.setItem("profile_last_view", view);
    setOpen(false);
  };

  const handleSignOut = async () => {
    await signOut({ callbackUrl: "/" });
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="fixed inset-0 z-[50] bg-black/30 backdrop-blur-sm"
      onClick={() => setOpen(false)}
      role="dialog"
      aria-modal="true"
      aria-label="Меню профиля"
    >
      <motion.div
        initial={{ x: "-100%" }}
        animate={{ x: 0 }}
        exit={{ x: "-100%" }}
        transition={{ type: "spring", damping: 30, stiffness: 300 }}
        className="absolute left-0 top-0 h-full w-full max-w-[min(90vw,400px)] sm:max-w-[min(85vw,450px)] md:max-w-[500px] bg-[#FFFCF6] shadow-2xl overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-5 sm:p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl sm:text-2xl font-ManropeBold text-[#4F5338]">
              Личный кабинет
            </h2>
            <button
              onClick={() => setOpen(false)}
              className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-[#F5F0E4] transition-colors flex-shrink-0"
              aria-label="Закрыть меню"
            >
              <svg className="w-6 h-6" fill="none" stroke="#4F5338" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Navigation */}
          <nav className="space-y-2" role="navigation" aria-label="Навигация личного кабинета">
            {MENU_ITEMS.map((item) => {
              const isActive = currentView === item.view;
              return (
                <button
                  key={item.view}
                  onClick={() => handleNavigate(item.view)}
                  className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all ${
                    isActive
                      ? "bg-[#5C6744] text-white shadow-md"
                      : "text-[#636846] hover:bg-[#F5F0E4]"
                  }`}
                  aria-current={isActive ? "page" : undefined}
                >
                  <span className="flex-shrink-0" aria-hidden="true">
                    {item.icon}
                  </span>
                  <span className="text-sm sm:text-base font-ManropeMedium text-left flex-1">
                    {item.label}
                  </span>
                  {item.badge && (
                    <span className={`h-5 min-w-[20px] px-1.5 rounded-full text-[11px] grid place-items-center ${
                      isActive ? "bg-white text-[#5C6744]" : "bg-[#6B6A58] text-white"
                    }`}>
                      {item.badge}
                    </span>
                  )}
                  {isActive && (
                    <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2} aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Footer actions */}
          <div className="mt-8 pt-6 border-t border-[#E8E2D5] space-y-2">
            {/* На главную */}
            <a
              href="/"
              className="flex items-center gap-3 px-4 py-3 rounded-2xl text-[#967450] hover:bg-[#F5F0E4] transition-colors"
            >
              <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2} aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              <span className="text-sm sm:text-base font-ManropeMedium">
                На главную
              </span>
            </a>

            {/* Выйти */}
            <button
              onClick={handleSignOut}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-[#C74545] hover:bg-red-50 transition-colors"
            >
              <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2} aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span className="text-sm sm:text-base font-ManropeMedium">
                Выйти
              </span>
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
