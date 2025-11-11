"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import LayoutOverlay3 from "../components/LayoutOverlay3";
import BottomNav from "../components/menus/BottomNav";

type Service = {
  id: string;
  title: string;
  description: string;
  image: string;
  category: string;
};

const CATEGORIES = [
  { id: "all", title: "Смотреть все", image: "/images/service-all.png", badge: "S" },
  { id: "apparatus", title: "Аппаратная косметология", image: "/images/service-1.png" },
  { id: "injection", title: "Инъекционная косметология", image: "/images/service-2.png" },
  { id: "trichology", title: "Трихология", image: "/images/service-3.png" },
  { id: "facials", title: "Чистки лица", image: "/images/service-4.png" },
];

const SERVICES: Service[] = [
  {
    id: "1",
    title: "SMAS-лифтинг Ultraformer",
    description:
      "SMAS-лифтинг Ultraformer поддерживает мягкие ткани лица, предотвращая возрастные изменения- потерю ...",
    image: "/images/service-card.jpg",
    category: "apparatus",
  },
  {
    id: "2",
    title: "SMAS-лифтинг Ultraformer",
    description:
      "SMAS-лифтинг Ultraformer поддерживает мягкие ткани лица, предотвращая возрастные изменения- потерю ...",
    image: "/images/service-card.jpg",
    category: "apparatus",
  },
  {
    id: "3",
    title: "SMAS-лифтинг Ultraformer",
    description:
      "SMAS-лифтинг Ultraformer поддерживает мягкие ткани лица, предотвращая возрастные изменения- потерю ...",
    image: "/images/service-card.jpg",
    category: "apparatus",
  },
  {
    id: "4",
    title: "SMAS-лифтинг Ultraformer",
    description:
      "SMAS-лифтинг Ultraformer поддерживает мягкие ткани лица, предотвращая возрастные изменения- потерю ...",
    image: "/images/service-card.jpg",
    category: "injection",
  },
  {
    id: "5",
    title: "SMAS-лифтинг Ultraformer",
    description:
      "SMAS-лифтинг Ultraformer поддерживает мягкие ткани лица, предотвращая возрастные изменения- потерю ...",
    image: "/images/service-card.jpg",
    category: "injection",
  },
  {
    id: "6",
    title: "SMAS-лифтинг Ultraformer",
    description:
      "SMAS-лифтинг Ultraformer поддерживает мягкие ткани лица, предотвращая возрастные изменения- потерю ...",
    image: "/images/service-card.jpg",
    category: "injection",
  },
];

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.25, 1, 0.5, 1] } },
};

export default function ServicesPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  const filteredServices = useMemo(() => {
    return SERVICES.filter((service) => {
      const matchQuery =
        searchQuery.trim() === "" ||
        service.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        service.description.toLowerCase().includes(searchQuery.toLowerCase());

      const matchCategory = selectedCategory === "all" || service.category === selectedCategory;

      return matchQuery && matchCategory;
    });
  }, [searchQuery, selectedCategory]);

  return (
    <LayoutOverlay3 title="Услуги">
      <main className="min-h-screen max-w-[1920px] mx-auto">
        {/* Хлебные крошки */}
        <nav className="px-[4%] pt-0 text-[clamp(0.875rem,0.8077rem+0.2885vw,1.125rem)] text-[#636846] font-ManropeRegular">
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

        {/* Поиск */}
        <section className="px-[4%] mt-[clamp(1.5rem,1.1538rem+1.5385vw,3rem)]">
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Найти услугу"
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
        </section>

        {/* Доступные направления */}
        <section className="px-[4%] mt-[clamp(2rem,1.5385rem+2.0513vw,4rem)]">
          <h2 className="text-[clamp(1.5rem,1.0385rem+2.0513vw,3.5rem)] font-ManropeBold text-[#4F5338] mb-[clamp(1.5rem,1.1538rem+1.5385vw,3rem)]">
            Доступные направления
          </h2>

          {/* Сетка категорий */}
          <div className="flex overflow-x-auto gap-[clamp(1rem,0.7692rem+1.0256vw,2rem)] pb-4 scrollbar-hide">
            {CATEGORIES.map((category, index) => (
              <motion.button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                variants={fadeUp}
                initial="hidden"
                animate="show"
                transition={{ delay: index * 0.1 }}
                className={`flex-shrink-0 w-[clamp(10rem,8rem+8vw,16rem)] aspect-[4/5] relative rounded-[clamp(1rem,0.8846rem+0.5128vw,1.5rem)] overflow-hidden transition-all duration-300 hover:scale-105 ${
                  category.id === "all" ? "bg-[#636846]" : ""
                }`}
              >
                {category.id === "all" ? (
                  <>
                    {selectedCategory === "all" && (
                      <div className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full bg-white flex items-center justify-center">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                          <path
                            d="M20 6L9 17L4 12"
                            stroke="#636846"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </div>
                    )}
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
                      <div className="w-24 h-24 rounded-full border-2 border-white flex items-center justify-center mb-4">
                        <svg className="w-12 h-12" viewBox="0 0 24 24" fill="none">
                          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
                          <path d="M12 2v20M2 12h20" stroke="currentColor" strokeWidth="2" />
                        </svg>
                      </div>
                      {category.badge && (
                        <div className="w-12 h-12 rounded-full bg-[#967450] flex items-center justify-center text-white text-xl font-ManropeBold mb-4">
                          {category.badge}
                        </div>
                      )}
                      <p className="text-[clamp(1rem,0.9423rem+0.2564vw,1.25rem)] font-ManropeMedium text-center px-4">
                        {category.title}
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    {selectedCategory === category.id && (
                      <div className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full bg-white flex items-center justify-center">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                          <path
                            d="M20 6L9 17L4 12"
                            stroke="#636846"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </div>
                    )}
                    <Image
                      src={category.image}
                      alt={category.title}
                      fill
                      sizes="(max-width: 640px) 50vw, 16rem"
                      className="object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                    <p className="absolute bottom-4 left-4 right-4 text-white text-[clamp(1rem,0.9423rem+0.2564vw,1.25rem)] font-ManropeMedium">
                      {category.title}
                    </p>
                  </>
                )}
              </motion.button>
            ))}
          </div>
        </section>

        {/* Аппаратная косметология */}
        <section className="px-[4%] mt-[clamp(2rem,1.5385rem+2.0513vw,4rem)]">
          <h2 className="text-[clamp(1.5rem,1.0385rem+2.0513vw,3.5rem)] font-ManropeBold text-[#4F5338] mb-[clamp(1.5rem,1.1538rem+1.5385vw,3rem)]">
            Аппаратная косметология
          </h2>

          {filteredServices.filter((s) => s.category === "apparatus").length === 0 ? (
            <p className="text-[clamp(1rem,0.9423rem+0.2564vw,1.25rem)] font-ManropeRegular text-[#636846]">
              Услуги не найдены
            </p>
          ) : (
            <motion.ul
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-[clamp(1rem,0.7692rem+1.0256vw,2rem)]"
              initial="hidden"
              animate="show"
              variants={{ show: { transition: { staggerChildren: 0.1 } } }}
            >
              {filteredServices
                .filter((s) => s.category === "apparatus")
                .map((service) => (
                  <motion.li
                    key={service.id}
                    variants={fadeUp}
                    className="bg-white rounded-[clamp(1rem,0.8846rem+0.5128vw,1.5rem)] overflow-hidden border border-[#E8E2D5] hover:shadow-lg transition-all duration-300"
                  >
                    <div className="relative w-full pt-[60%]">
                      <Image
                        src={service.image}
                        alt={service.title}
                        fill
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        className="object-cover"
                      />
                    </div>
                    <div className="p-[clamp(1rem,0.7692rem+1.0256vw,2rem)]">
                      <h3 className="text-[clamp(1.125rem,1.0096rem+0.5128vw,1.625rem)] font-ManropeBold text-[#4F5338] mb-2">
                        {service.title}
                      </h3>
                      <p className="text-[clamp(0.875rem,0.8077rem+0.2885vw,1.125rem)] font-ManropeRegular text-[#636846] leading-relaxed mb-4">
                        {service.description}
                      </p>
                      <button className="px-6 py-[clamp(0.5rem,0.4423rem+0.2564vw,0.75rem)] rounded-[5px] bg-[#F5F0E4] text-[#967450] text-[clamp(0.875rem,0.8077rem+0.2885vw,1.125rem)] font-ManropeRegular hover:scale-105 transition-all duration-300">
                        Перейти
                      </button>
                    </div>
                  </motion.li>
                ))}
            </motion.ul>
          )}
        </section>

        {/* Инъекционная косметология */}
        <section className="px-[4%] mt-[clamp(2rem,1.5385rem+2.0513vw,4rem)] pb-[clamp(4rem,3.0769rem+4.1026vw,8rem)]">
          <h2 className="text-[clamp(1.5rem,1.0385rem+2.0513vw,3.5rem)] font-ManropeBold text-[#4F5338] mb-[clamp(1.5rem,1.1538rem+1.5385vw,3rem)]">
            Инъекционная косметология
          </h2>

          {filteredServices.filter((s) => s.category === "injection").length === 0 ? (
            <p className="text-[clamp(1rem,0.9423rem+0.2564vw,1.25rem)] font-ManropeRegular text-[#636846]">
              Услуги не найдены
            </p>
          ) : (
            <motion.ul
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-[clamp(1rem,0.7692rem+1.0256vw,2rem)]"
              initial="hidden"
              animate="show"
              variants={{ show: { transition: { staggerChildren: 0.1 } } }}
            >
              {filteredServices
                .filter((s) => s.category === "injection")
                .map((service) => (
                  <motion.li
                    key={service.id}
                    variants={fadeUp}
                    className="bg-white rounded-[clamp(1rem,0.8846rem+0.5128vw,1.5rem)] overflow-hidden border border-[#E8E2D5] hover:shadow-lg transition-all duration-300"
                  >
                    <div className="relative w-full pt-[60%]">
                      <Image
                        src={service.image}
                        alt={service.title}
                        fill
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        className="object-cover"
                      />
                    </div>
                    <div className="p-[clamp(1rem,0.7692rem+1.0256vw,2rem)]">
                      <h3 className="text-[clamp(1.125rem,1.0096rem+0.5128vw,1.625rem)] font-ManropeBold text-[#4F5338] mb-2">
                        {service.title}
                      </h3>
                      <p className="text-[clamp(0.875rem,0.8077rem+0.2885vw,1.125rem)] font-ManropeRegular text-[#636846] leading-relaxed mb-4">
                        {service.description}
                      </p>
                      <button className="px-6 py-[clamp(0.5rem,0.4423rem+0.2564vw,0.75rem)] rounded-[5px] bg-[#F5F0E4] text-[#967450] text-[clamp(0.875rem,0.8077rem+0.2885vw,1.125rem)] font-ManropeRegular hover:scale-105 transition-all duration-300">
                        Перейти
                      </button>
                    </div>
                  </motion.li>
                ))}
            </motion.ul>
          )}
        </section>
      </main>
      <BottomNav />
    </LayoutOverlay3>
  );
}
