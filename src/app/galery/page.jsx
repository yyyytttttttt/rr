"use client";

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import LayoutOverlay3 from "../components/LayoutOverlay3";
import BottomNav from "../components/menus/BottomNav";
import BeforeAfterCompare from "../components/galeryPage/BeforeAfterCompare";
import DirectionSelect from "../components/galeryPage/DirectionSelect";

const GALLERY_SECTIONS = [
  {
    categoryId: "tricho",
    categoryName: "Трихология",
    items: [
      {
        title: "PRP-терапия волос",
        desc: "Инъекционная стимуляция кожи головы для поддержки роста и качества волос",
        before: "https://www.innersourcemedicine.com/wp-content/uploads/2023/06/scalp-full-416x416.jpg",
        after: "https://prp-london.com/images/mesotherapy-hair-scalp-london.webp",
      },
      {
        title: "Мезотерапия кожи головы",
        desc: "Курс микроинъекций для улучшения питания фолликулов и состояния кожи головы",
        before: "https://prp-london.com/images/mesotherapy-hair-scalp-london.webp",
        after: "https://www.innersourcemedicine.com/wp-content/uploads/2023/06/scalp-full-416x416.jpg",
      },
    ],
  },

  {
    categoryId: "inject",
    categoryName: "Инъекционная косметология",
    items: [
      {
        title: "Контурная пластика",
        desc: "Коррекция объема и контуров, акценты на губы/скулы/овал лица",
        before: "https://valleyderm.com/wp-content/uploads/2024/02/dermal-fillers-2-min.jpg",
        after: "https://puraestheticsandwellness.com/wp-content/uploads/2025/05/dermal_fillers_session.webp",
      },
      {
        title: "Биоревитализация",
        desc: "Глубокое увлажнение, улучшение текстуры и тонуса кожи",
        before: "https://iniyaclinic.com/wp-content/uploads/elementor/thumbs/profhilo-treatment-qspaz0qx183grzdt4zfbfo7buc7izdzrnkyb35ippc.jpg",
        after: "https://iniyaclinic.com/wp-content/uploads/2024/05/skin-booster.png",
      },
    ],
  },
];



function CompareCard({ title, desc, before, after }) {
  return (
    <div className="w-full">
      <BeforeAfterCompare before={before} after={after} alt={title} initial={0.5} />

      <div className="mt-4">
        <div className="text-[18px] font-[Manrope-SemiBold] text-[#2F2D28]">
          {title}
        </div>
        <div className="mt-1 max-w-[420px] text-[13px] leading-[1.35] text-[#2F2D28]/55 font-[Manrope-Regular]">
          {desc}
        </div>
      </div>
    </div>
  );
}

export default function ServicesPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeId, setActiveId] = useState("all");

  // Список направлений для селекта
  const options = useMemo(() => {
    const base = [{ id: "all", label: "Все" }];
    const fromSections = GALLERY_SECTIONS.map((s) => ({
      id: s.categoryId,
      label: s.categoryName,
    }));

    const uniq = [];
    const seen = new Set();
    for (const o of [...base, ...fromSections]) {
      if (!seen.has(o.id)) {
        seen.add(o.id);
        uniq.push(o);
      }
    }
    return uniq;
  }, []);

  // Фильтр по поиску + направлению
  const filteredSections = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    const byCategory =
      activeId === "all"
        ? GALLERY_SECTIONS
        : GALLERY_SECTIONS.filter((s) => s.categoryId === activeId);

    if (!q) return byCategory;

    return byCategory
      .map((sec) => ({
        ...sec,
        items: sec.items.filter((it) => {
          const t = (it.title || "").toLowerCase().replace("\n", " ");
          const d = (it.desc || "").toLowerCase();
          return t.includes(q) || d.includes(q);
        }),
      }))
      .filter((sec) => sec.items.length > 0);
  }, [activeId, searchQuery]);

  return (
    <LayoutOverlay3 title="Галерея">
      <main className="min-h-screen ">
        <div className="mx-auto max-w-[1920px] px-8 lg:px-[134px] pb-24">
          {/* Хлебные крошки */}
          <nav className="pt-[0%] text-[clamp(0.875rem,0.8077rem+0.2885vw,1.125rem)] text-[#636846] font-ManropeRegular">
            <ol className="flex items-center gap-2">
              <li>
                <a className="hover:text-[#967450] transition" href="/">
                  Главная
                </a>
              </li>
              <li className="opacity-60">›</li>
              <li className="text-[#4F5338]">Галерея</li>
            </ol>
          </nav>

          {/* Верхняя панель: поиск слева + селект справа */}
          <div className="mt-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            {/* поиск */}
            <div className="w-full md:max-w-[320px]">
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
                  placeholder="Поиск"
                  className="h-12 w-full rounded-xl md:rounded-2xl bg-[#EFEBE3] pl-14 pr-12 text-[16px] font-[Manrope-Regular] text-[#2F2D28] outline-none placeholder:text-[#967450]/70 focus:ring-2 focus:ring-[#636846]/20"
                />

                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full p-1 hover:bg-[#D9D4C9] transition-colors"
                    aria-label="Очистить"
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

            {/* селект направления */}
            <div className="flex w-full items-center md:w-auto md:justify-end">
              <DirectionSelect
                value={activeId}
                onChange={setActiveId}
                options={options}
                placeholder="Все"
                className="w-full md:w-auto md:justify-end"
                dropdownWidthClass="w-full md:w-[240px]"
              />
            </div>
          </div>

          {/* Результаты поиска */}
          {searchQuery && (
            <div className="mt-4 text-[14px] font-[Manrope-Regular] text-[#967450]">
              {filteredSections.length > 0 ? (
                <span>
                  Найдено:{" "}
                  {filteredSections.reduce((acc, sec) => acc + sec.items.length, 0)}{" "}
                  работ
                </span>
              ) : (
                <span>Ничего не найдено по запросу "{searchQuery}"</span>
              )}
            </div>
          )}

          {/* Секции галереи */}
          <div className="mt-10 space-y-16">
            <AnimatePresence mode="wait">
              <motion.div
                key={`${activeId}_${searchQuery}`}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.35, ease: [0.25, 1, 0.5, 1] }}
                className="space-y-16"
              >
                {filteredSections.map((sec, secIdx) => (
                  <motion.section
                    key={sec.categoryId}
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35, delay: secIdx * 0.06 }}
                  >
                    <div className="flex items-end justify-between gap-6">
                      <h2 className="text-[20px] sm:text-[28px] lg:text-[32px] font-[Manrope-SemiBold] tracking-[-0.02em] text-[#2F2D28]">
                        {sec.categoryName}
                      </h2>

                      <a
                        href="#"
                        className="text-[14px] font-[Manrope-Regular] text-[#2F2D28]/45 hover:text-[#967450] transition whitespace-nowrap"
                      >
                        Смотреть все
                      </a>
                    </div>

                    <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-10">
                      {sec.items.map((it, idx) => (
                        <motion.div
                          key={idx}
                          initial={{ opacity: 0, y: 12 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{
                            duration: 0.28,
                            delay: secIdx * 0.06 + idx * 0.06,
                          }}
                        >
                          <CompareCard
                            title={it.title}
                            desc={it.desc}
                            before={it.before}
                            after={it.after}
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

      <BottomNav />
      <div className="h-15">

      </div>
    </LayoutOverlay3>
  );
}
