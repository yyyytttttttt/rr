'use client'
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ServicesCategorySlider from "../components/Servic/ServicesCategorySlider";
import ServiceCard from "../components/Servic/ServiceCard";
import LayoutOverlay3 from "../components/LayoutOverlay3";
import BottomNav from "../components/menus/BottomNav";

const CATEGORIES = [
  {
    id: "all",
    title: "Смотреть все",
    variant: "all",
    image: "",
  },
  {
    id: "hardware",
    title: "Аппаратная\nкосметология",
    image: "/images/ser1.png",
  },
  {
    id: "inject",
    title: "Инъекционная\nкосметология",
    image: "/images/ser2.png",
  },
  {
    id: "tricho",
    title: "Трихология",
    image: "/images/ser3.png",
  },
  {
    id: "clean",
    title: "Чистки лица",
    image: "/images/ser4.png",
  },
  {
    id: "clean",
    title: "Чистки лица",
    image: "/images/ser1.png",
  },
];

const DUMMY_DESC =
  "SMAS-лифтинг Ultraformer поддерживает мягкие ткани лица, предотвращая возрастные изменения: потерю ...";

// Все услуги с привязкой к категориям
const ALL_SERVICES = [
  {
    categoryId: "hardware",
    categoryName: "Аппаратная косметология",
    items: [
      { title: "SMAS-лифтинг\nUltraformer", desc: DUMMY_DESC },
      { title: "RF-лифтинг\nThermage", desc: DUMMY_DESC },
      { title: "Лазерная\nшлифовка", desc: DUMMY_DESC },
    ],
  },
  {
    categoryId: "inject",
    categoryName: "Инъекционная косметология",
    items: [
      { title: "Ботулинотерапия\nBotox", desc: DUMMY_DESC },
      { title: "Контурная\nпластика", desc: DUMMY_DESC },
      { title: "Мезотерапия\nлица", desc: DUMMY_DESC },
    ],
  },
  {
    categoryId: "tricho",
    categoryName: "Трихология",
    items: [
      { title: "PRP-терапия\nволос", desc: DUMMY_DESC },
      { title: "Мезотерапия\nкожи головы", desc: DUMMY_DESC },
      { title: "Лечение\nалопеции", desc: DUMMY_DESC },
    ],
  },
  {
    categoryId: "clean",
    categoryName: "Чистки лица",
    items: [
      { title: "Ультразвуковая\nчистка", desc: DUMMY_DESC },
      { title: "Механическая\nчистка", desc: DUMMY_DESC },
      { title: "Комбинированная\nчистка", desc: DUMMY_DESC },
    ],
  },
];

export default function ServicesPage() {
  const [activeId, setActiveId] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Фильтрация услуг по поисковому запросу
  const searchResults = searchQuery.trim()
    ? ALL_SERVICES.map(section => ({
        ...section,
        items: section.items.filter(item =>
          item.title.toLowerCase().replace('\n', ' ').includes(searchQuery.toLowerCase()) ||
          item.desc.toLowerCase().includes(searchQuery.toLowerCase())
        )
      })).filter(section => section.items.length > 0)
    : null;

  // Фильтрация услуг по выбранной категории
  const filteredSections = searchResults
    ? searchResults
    : activeId === "all"
      ? ALL_SERVICES
      : ALL_SERVICES.filter(section => section.categoryId === activeId);

  return (
    <LayoutOverlay3 title="Услуги">
      <main className="min-h-screen">
        <div className="mx-auto max-w-[1920px] px-[4%] lg:px-[134px] pb-24">
         {/* Хлебные крошки */}
      <nav className=" pt-[0%] text-[clamp(0.875rem,0.8077rem+0.2885vw,1.125rem)] text-[#636846] font-ManropeRegular">
        <ol className="flex items-center gap-2">
          <li>
            <a className="hover:text-[#967450] transition" href="/">
              Главная
            </a>
          </li>
          <li className="opacity-60">›</li>
          <li className="text-[#4F5338]">Услуги</li>
        </ol>
      </nav>


          {/* поиск */}
          <div className="mt-6">
            <div className="relative">
              <span className="absolute left-5 top-1/2 -translate-y-1/2 opacity-60">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15Z"
                    stroke="#967450"
                    strokeWidth="1.6"
                  />
                  <path
                    d="M16.5 16.5 21 21"
                    stroke="#967450"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                  />
                </svg>
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Найти услугу"
                className="h-14 w-full rounded-xl  md:rounded-2xl bg-[#EFEBE3] pl-14 pr-12 text-[16px] font-[Manrope-Regular] text-[#2F2D28] outline-none placeholder:text-[#967450]/70 focus:ring-2 focus:ring-[#636846]/20"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-1 hover:bg-[#D9D4C9] rounded-full transition-colors"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M18 6L6 18M6 6l12 12"
                      stroke="#967450"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                  </svg>
                </button>
              )}
            </div>
          </div>

          {/* Результаты поиска */}
          {searchQuery && (
            <div className="mt-4 text-[14px] font-[Manrope-Regular] text-[#967450]">
              {searchResults && searchResults.length > 0 ? (
                <span>
                  Найдено: {searchResults.reduce((acc, sec) => acc + sec.items.length, 0)} услуг
                </span>
              ) : (
                <span>Ничего не найдено по запросу "{searchQuery}"</span>
              )}
            </div>
          )}

          {/* заголовок + слайдер */}
          <h1 className="mt-4 sm:mt-10 text-[24px] xs:text-[32px] lg:text-[40px] font-[Manrope-SemiBold] tracking-[-0.02em] text-[#2F2D28]">
            Доступные направления
          </h1>

          <ServicesCategorySlider
            categories={CATEGORIES}
            activeId={activeId}
            onSelect={(id) => setActiveId(id)}
          />

          {/* секции */}
          <div className="mt-4 sm:mt-12 space-y-16">
            <AnimatePresence mode="wait">
              <motion.div
                key={searchQuery || activeId}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.4, ease: [0.25, 1, 0.5, 1] }}
                className="space-y-16"
              >
                {filteredSections.map((sec, secIdx) => (
                  <motion.section
                    key={sec.categoryId}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: secIdx * 0.1 }}
                  >
                    <h2 className="text-[24px] xs:text-[28px] lg:text-[32px] font-[Manrope-SemiBold] tracking-[-0.02em] text-[#2F2D28]">
                      {sec.categoryName}
                    </h2>

                    <div className="mt-4 sm:mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {sec.items.map((it, idx) => (
                        <motion.div
                          key={idx}
                          initial={{ opacity: 0, y: 15 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3, delay: secIdx * 0.1 + idx * 0.05 }}
                        >
                          <ServiceCard
                            title={it.title.split("\n").map((line, i) => (
                              <span key={i} className="block">
                                {line}
                              </span>
                            ))}
                            desc={it.desc}
                          />
                        </motion.div>
                      ))}
                    </div>
                  </motion.section>
                ))}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </main>
      <BottomNav></BottomNav>
    </LayoutOverlay3>
  );
}
