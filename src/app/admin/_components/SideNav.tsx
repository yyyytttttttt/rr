"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

type View =
  | "specialists.schedule"
  | "specialists.base"
  | "clients.base"
  | "clients.bookings"
  | "services.manage"
  | "services.categories"
  | "settings";

type Props = {
  currentView: View;
  userName: string;
  userImage: string;
};

type MenuItem = {
  view: View;
  label: string;
  icon: string;
};

const MENU_STRUCTURE = [
  {
    group: "Специалисты",
    icon: "👨‍⚕️",
    items: [
      { view: "specialists.schedule" as View, label: "Смотреть занятость", icon: "📅" },
      { view: "specialists.base" as View, label: "База специалистов", icon: "👥" },
    ],
  },
  {
    group: "Клиенты",
    icon: "👤",
    items: [
      { view: "clients.base" as View, label: "База клиентов", icon: "📇" },
      { view: "clients.bookings" as View, label: "Записи клиентов", icon: "🗓️" },
    ],
  },
  {
    group: "Услуги",
    icon: "💼",
    items: [
      { view: "services.manage" as View, label: "Управление услугами", icon: "📝" },
      { view: "services.categories" as View, label: "Категории услуг", icon: "📁" },
    ],
  },
];

const SETTINGS_ITEM: MenuItem = { view: "settings", label: "Настройки", icon: "⚙️" };

export default function SideNav({ currentView, userName, userImage }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [expandedGroup, setExpandedGroup] = useState<string | null>(
    currentView.startsWith("specialists")
      ? "Специалисты"
      : currentView.startsWith("clients")
      ? "Клиенты"
      : currentView.startsWith("services")
      ? "Услуги"
      : null
  );

  const setView = (view: View) => {
    const params = new URLSearchParams();
    params.set("view", view);
    router.replace(`/admin?${params.toString()}`, { scroll: false });
    if (typeof window !== "undefined") localStorage.setItem("admin_last_view", view);
  };

  useEffect(() => {
    if (typeof window !== "undefined" && !searchParams.get("view")) {
      const lastView = localStorage.getItem("admin_last_view") as View | null;
      if (lastView) router.replace(`/admin?view=${lastView}`, { scroll: false });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggleGroup = (group: string) => {
    setExpandedGroup((g) => (g === group ? null : group));
  };

  const Chevron = ({ open }: { open: boolean }) => (
    <svg
      className={`w-4 h-4 transition-transform ${open ? "rotate-180" : ""} text-[var(--admin-primary)]`}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M6 9l6 6 6-6" />
    </svg>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex md:w-64 lg:w-72 bg-[#FFFCF6] border-r border-[#E8E2D5] flex-col overflow-y-auto">
        <div className="p-6">
          {/* User info */}
          <div className="flex items-center gap-3 mb-8">
            {userImage ? (
              <img
                src={userImage}
                alt={userName}
                className="w-12 h-12 rounded-full object-cover ring-2 ring-[var(--admin-border)]"
              />
            ) : (
              <div className="w-12 h-12 rounded-full bg-[#5C6744] flex items-center justify-center text-white text-xl font-ManropeBold">
                A
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-xs text-[#967450] font-ManropeRegular">Администратор</p>
              <h2 className="font-Manrope-SemiBold text-[#4F5338] text-base truncate">
                {userName}
              </h2>
            </div>
          </div>

          {/* Navigation */}
          <nav className="space-y-2">
            {MENU_STRUCTURE.map((group) => {
              const isOpen = expandedGroup === group.group;
              return (
                <div key={group.group} className="pb-2 border-b border-[#E8E2D5] last:border-b-0">
                  <button
                    onClick={() => toggleGroup(group.group)}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-[12px] hover:bg-[#F5F0E4] transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-base">{group.icon}</span>
                      <span className="font-ManropeMedium text-[#4F5338] text-[15px]">
                        {group.group}
                      </span>
                    </div>
                    <Chevron open={isOpen} />
                  </button>

                  {isOpen && (
                    <div className="mt-1 ml-6 space-y-1">
                      {group.items.map((item) => {
                        const active = currentView === item.view;
                        return (
                          <button
                            key={item.view}
                            onClick={() => setView(item.view)}
                            className={`w-full flex items-center gap-2 px-3 py-2 rounded-[12px] transition-colors ${
                              active
                                ? "bg-[#F5F0E4] text-[#967450]"
                                : "text-[#636846] hover:bg-[#F5F0E4]"
                            }`}
                          >
                            <span className="text-base">{item.icon}</span>
                            <span className="font-ManropeMedium text-[15px]">
                              {item.label}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}

            {/* Settings */}
            <button
              onClick={() => setView(SETTINGS_ITEM.view)}
              className={`w-full flex items-center gap-2 px-3 py-2 rounded-[12px] transition-colors ${
                currentView === SETTINGS_ITEM.view
                  ? "bg-[#F5F0E4] text-[#967450]"
                  : "text-[#636846] hover:bg-[#F5F0E4]"
              }`}
            >
              <span className="text-base">{SETTINGS_ITEM.icon}</span>
              <span className="font-ManropeMedium text-[15px]">
                {SETTINGS_ITEM.label}
              </span>
            </button>
          </nav>
        </div>

        {/* Back to main site */}
        <div className="mt-auto p-4 border-t border-[#E8E2D5]">
          <a
            href="/"
            className="flex items-center gap-2 px-4 py-2 rounded-[12px] text-[#967450] hover:bg-[#F5F0E4] transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
            <span className="font-ManropeMedium text-sm">На главную</span>
          </a>
        </div>
      </aside>
    </>
  );
}
