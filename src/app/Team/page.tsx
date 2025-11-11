"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import LayoutOverlay3 from '../components/LayoutOverlay3'
import BottomNav from '../components/menus/BottomNav'
type Doctor = {
  id: string;
  name: string;
  exp: number;
  specialties: string;
  photo: string;
  directions: string[];
};

const ALL_DIRECTIONS = [
  "Все",
  "Аппаратная косметология",
  "Инъекционная косметология",
  "Трихология",
  "Уходовые процедуры",
];

const MOCK: Doctor[] = Array.from({ length: 6 }).map((_, i) => ({
  id: `doc-${i + 1}`,
  name: "Кривоспицкая Екатерина",
  exp: 5,
  specialties: "Врач-косметолог, дерматовенеролог, трихолог",
  photo: "/images/doctor-ekaterina1.png",
  directions: ["Аппаратная косметология"],
}));

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.25, 1, 0.5, 1] as any }
  },
};

const dropdownVariants = {
  hidden: { opacity: 0, y: -10, scale: 0.95 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.2, ease: [0.25, 1, 0.5, 1] as any }
  },
  exit: {
    opacity: 0,
    y: -10,
    scale: 0.95,
    transition: { duration: 0.15 }
  },
};

export default function TeamPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDirection, setSelectedDirection] = useState("Все");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Закрытие dropdown при клике вне его
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filtered = useMemo(() => {
    return MOCK.filter((d) => {
      const matchQuery =
        searchQuery.trim() === "" ||
        d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.specialties.toLowerCase().includes(searchQuery.toLowerCase());

      const matchDirection =
        selectedDirection === "Все" || d.directions.includes(selectedDirection);

      return matchQuery && matchDirection;
    });
  }, [searchQuery, selectedDirection]);

  return (
    <LayoutOverlay3 title="Команда">

    <main className="min-h-screen max-w-[1920px]  mx-auto">
      {/* Хлебные крошки */}
      <nav className="px-[4%] pt-[0%] text-[clamp(0.875rem,0.8077rem+0.2885vw,1.125rem)] text-[#636846] font-ManropeRegular">
        <ol className="flex items-center gap-2">
          <li>
            <a className="hover:text-[#967450] transition" href="/">
              Главная
            </a>
          </li>
          <li className="opacity-60">›</li>
          <li className="text-[#4F5338]">Команда</li>
        </ol>
      </nav>

      {/* Фильтры */}
      <section className="px-[4%] mt-[clamp(1.5rem,1.1538rem+1.5385vw,3rem)]">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-4 items-center">
          {/* Поиск */}
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Найти специалиста"
              className="w-full xl:w-[60%] px-4 pl-12 py-[clamp(0.75rem,0.6346rem+0.5128vw,1.25rem)] rounded-[10px] border border-[#E8E2D5] bg-[#F5F0E4] text-[clamp(0.875rem,0.8077rem+0.2885vw,1.125rem)] font-ManropeRegular text-[#967450] placeholder:text-[#B0B0B0] focus:outline-none focus:ring-2 focus:ring-[#967450]/30 transition"
            />
            <svg
              className="absolute left-4 top-1/2 -translate-y-1/2 opacity-60"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
            >
              <circle cx="11" cy="11" r="8" stroke="#636846" strokeWidth="1.5" />
              <path d="M21 21l-4.35-4.35" stroke="#636846" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </div>

          {/* Выбор направления - кастомный dropdown */}
          <div className="flex items-center gap-3">
            <span className="hidden lg:inline text-[clamp(0.875rem,0.8077rem+0.2885vw,1.125rem)] font-ManropeSemiBold text-[#4F5338] whitespace-nowrap">
              Выбрать направление:
            </span>
            <div className="relative w-full lg:w-auto" ref={dropdownRef}>
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="w-full lg:min-w-[280px] px-4 py-[3%] rounded-[10px] border border-[#967450] bg-white text-[clamp(0.875rem,0.8077rem+0.2885vw,1.125rem)] font-ManropeRegular text-[#636846] focus:outline-none transition cursor-pointer flex items-center justify-between"
              >
                <span>{selectedDirection}</span>
                <svg
                  className={`w-5 h-5 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              <AnimatePresence>
                {isDropdownOpen && (
                  <motion.div
                    variants={dropdownVariants}
                    initial="hidden"
                    animate="show"
                    exit="exit"
                    className="absolute z-50 w-full mt-2 py-2 bg-white border border-[#E8E2D5] rounded-[10px] shadow-lg"
                  >
                    {ALL_DIRECTIONS.map((direction) => (
                      <button
                        key={direction}
                        onClick={() => {
                          setSelectedDirection(direction);
                          setIsDropdownOpen(false);
                        }}
                        className={`w-full px-4 py-3 text-left text-[clamp(0.875rem,0.8077rem+0.2885vw,1.125rem)] font-ManropeRegular transition-colors ${
                          selectedDirection === direction
                            ? 'bg-[#F7F2E8] text-[#4F5338]'
                            : 'text-[#636846] hover:bg-[#F7F2E8]/50'
                        }`}
                      >
                        {direction}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </section>

      {/* Заголовок секции */}
      <section className="px-[4%] mt-[clamp(2rem,1.5385rem+2.0513vw,4rem)]">
        <h1 className="text-[clamp(1.5rem,1.0385rem+2.0513vw,3.5rem)] font-ManropeBold text-[#4F5338]">
          Аппаратная косметология
        </h1>
      </section>

      {/* Сетка карточек */}
      <section className="px-[4%] mt-[clamp(1.5rem,1.1538rem+1.5385vw,3rem)] pb-[clamp(4rem,3.0769rem+4.1026vw,8rem)]">
        {filtered.length === 0 ? (
          <div className="text-center py-12 text-[clamp(1rem,0.9423rem+0.2564vw,1.25rem)] font-ManropeRegular text-[#636846]">
            Ничего не найдено. Попробуйте изменить фильтры.
          </div>
        ) : (
          <motion.ul
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-[clamp(1rem,0.7692rem+1.0256vw,2rem)]"
            initial="hidden"
            animate="show"
            variants={{ show: { transition: { staggerChildren: 0.1 } } }}
          >
            {filtered.map((doctor) => (
              <motion.li
                key={doctor.id}
                variants={fadeUp}
                className=" rounded-[clamp(1rem,0.8846rem+0.5128vw,1.5rem)] overflow-hidden  hover:shadow-lg transition-shadow duration-300"
              >
                {/* Бейджи */}
                <div className="relative">
                  <div className="absolute left-4 top-4 z-10 px-[5%] py-[2%] rounded-[7px] bg-[#FFFCF3] backdrop-blur-sm text-[clamp(0.75rem,0.6923rem+0.2564vw,1rem)] font-ManropeRegular text-[#967450]  ">
                    {doctor.exp} лет опыта
                  </div>
                  <div className="absolute right-4 top-4 z-10 w-[8%] h-auto rounded-full bg-[#FFFCF3] transition-all duration-500 hover:scale-115 cursor-pointer backdrop-blur-sm  flex items-center justify-center trans">
                    <svg className="w-full h-auto  " xmlns="http://www.w3.org/2000/svg" width="52" height="52" viewBox="0 0 52 52" fill="none">
                    <rect width="52" height="52" rx="26" fill="#F7EFE5"/>
                    <path d="M20 32L32 20M32 20H22.25M32 20V29.75" stroke="#967450" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                  </div>

                  {/* Фото */}
                  <div className="relative w-full pt-[125%] ">
                    <Image
                      src={doctor.photo}
                      alt={doctor.name}
                      fill
                      sizes=""
                      className="object-cover"
                    />
                  </div>
                </div>

                {/* Информация */}
                <div className="py-[clamp(1rem,0.7692rem+1.0256vw,2rem)] px-[4%] bg-white !border-none">
                  <h3 className="text-[clamp(1.125rem,1.0096rem+0.5128vw,1.625rem)] font-ManropeBold text-[#4F5338] mb-2">
                    {doctor.name}
                  </h3>
                  <p className="text-[clamp(0.875rem,0.8077rem+0.2885vw,1.125rem)] font-ManropeRegular text-[#636846] leading-relaxed">
                    {doctor.specialties}
                  </p>

                  {/* Кнопка */}
                  <button className="mt-4  px-6 py-[2%] rounded-[5px] bg-[#F5F0E4] text-[#967450] text-[clamp(0.875rem,0.8077rem+0.2885vw,1.125rem)] font-ManropeRegular hover:scale-105 transition-all duration-500 cursor pointer">
                    Записаться
                  </button>
                </div>
              </motion.li>
            ))}
          </motion.ul>
        )}
      </section>

      {/* Еще одна секция */}
      <section className="px-[4%] pb-[clamp(4rem,3.0769rem+4.1026vw,8rem)]">
        <h2 className="text-[clamp(1.5rem,1.0385rem+2.0513vw,3.5rem)] font-ManropeBold text-[#4F5338] mb-[clamp(1.5rem,1.1538rem+1.5385vw,3rem)]">
          Инъекционная косметология
        </h2>
        <p className="text-[clamp(1rem,0.9423rem+0.2564vw,1.25rem)] font-ManropeRegular text-[#636846] max-w-3xl">
          Скоро здесь появятся специалисты данного направления.
        </p>
      </section>
    </main>
    <BottomNav></BottomNav>
    </LayoutOverlay3>
  );
}
