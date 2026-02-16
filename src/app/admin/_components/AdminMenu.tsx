"use client";

import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";

type View =
  | "specialists.schedule"
  | "specialists.base"
  | "clients.base"
  | "clients.bookings"
  | "services.manage"
  | "services.categories"
  | "settings";

type Props = {
  setOpen: (open: boolean) => void;
  currentView: View;
};

type MenuItem = {
  view: View;
  label: string;
  icon: string;
  group: string;
};

const MENU_ITEMS: MenuItem[] = [
  // Специалисты
  { view: "specialists.schedule", label: "Смотреть занятость", icon: "", group: "Специалисты" },
  { view: "specialists.base", label: "База специалистов", icon: "", group: "Специалисты" },

  // Клиенты
  { view: "clients.base", label: "База клиентов", icon: "", group: "Клиенты" },
  { view: "clients.bookings", label: "Записи клиентов", icon: "", group: "Клиенты" },

  // Услуги
  { view: "services.manage", label: "Управление услугами", icon: "", group: "Услуги" },
  { view: "services.categories", label: "Категории услуг", icon: "", group: "Услуги" },

  // Настройки
  { view: "settings", label: "Настройки", icon: "", group: "Настройки" },
];

// Группируем меню
const groupedMenu = MENU_ITEMS.reduce((acc, item) => {
  if (!acc[item.group]) {
    acc[item.group] = [];
  }
  acc[item.group].push(item);
  return acc;
}, {} as Record<string, MenuItem[]>);

export default function AdminMenu({ setOpen, currentView }: Props) {
  const router = useRouter();

  const handleNavigate = (view: View) => {
    router.replace(`/admin?view=${view}`, { scroll: false });
    if (typeof window !== "undefined") localStorage.setItem("admin_last_view", view);
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
      className="fixed inset-0 z-[9000] bg-black/30 backdrop-blur-sm"
      onClick={() => setOpen(false)}
      role="dialog"
      aria-modal="true"
      aria-label="Меню администратора"
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
              Админ панель
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
          <nav className="space-y-5" role="navigation" aria-label="Навигация администратора">
            {Object.entries(groupedMenu).map(([groupName, items]) => (
              <section key={groupName}>
                {/* Group title */}
                <div className="flex items-center gap-2 mb-2 px-2">
                  <h3 className="text-xs font-ManropeBold text-[#967450] uppercase tracking-wider whitespace-nowrap">
                    {groupName}
                  </h3>
                  <div className="flex-1 h-[1px] bg-[#E8E2D5]" />
                </div>

                {/* Group items */}
                <ul className="space-y-2">
                  {items.map((item) => {
                    const isActive = currentView === item.view;
                    return (
                      <li key={item.view}>
                        <button
                          onClick={() => handleNavigate(item.view)}
                          className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all ${
                            isActive
                              ? "bg-[#5C6744] text-white shadow-md"
                              : "text-[#636846] hover:bg-[#F5F0E4]"
                          }`}
                          aria-current={isActive ? "page" : undefined}
                        >
                          <span className="text-2xl flex-shrink-0" aria-hidden="true">
                            {item.icon}
                          </span>
                          <span className="text-sm sm:text-base font-ManropeMedium text-left flex-1">
                            {item.label}
                          </span>
                          {isActive && (
                            <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2} aria-hidden="true">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                            </svg>
                          )}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </section>
            ))}
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
