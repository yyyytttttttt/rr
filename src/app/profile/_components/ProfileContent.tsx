"use client";

import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import ProfileMenu from "./ProfileMenu";

type View = "home" | "booking" | "healthpasses" | "history" | "gifts" | "settings";

type PanelProps = {
  userId: string;
  tzid: string;
  userName: string;
  userEmail: string;
  userImage: string;
  userPhone?: string | null;
  initialDate?: string;
};

type User = {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
};

type Props = {
  view: View;
  panelProps: PanelProps;
  user: User;
};

// NOTE: Lazy load panels for better performance
const HomePanel = dynamic(() => import("../_panels/HomePanel"), {
  loading: () => <PanelSkeleton />,
});
const BookingPanel = dynamic(() => import("../_panels/BookingPanel"), {
  loading: () => <PanelSkeleton />,
});
const HealthPassesPanel = dynamic(() => import("../_panels/HealthPassesPanel"), {
  loading: () => <PanelSkeleton />,
});
const HistoryPanel = dynamic(() => import("../_panels/HistoryPanel"), {
  loading: () => <PanelSkeleton />,
});
const GiftsPanel = dynamic(() => import("../_panels/GiftsPanel"), {
  loading: () => <PanelSkeleton />,
});
const SettingsPanel = dynamic(() => import("../_panels/SettingsPanel"), {
  loading: () => <PanelSkeleton />,
});

function PanelSkeleton() {
  return (
    <div className="animate-pulse space-y-4">
      <div className="h-8 bg-gray-200 rounded w-1/3"></div>
      <div className="h-32 bg-gray-200 rounded"></div>
      <div className="h-32 bg-gray-200 rounded"></div>
    </div>
  );
}

export default function ProfileContent({ view, panelProps, user }: Props) {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleBack = () => {
    // Always go back to previous page in browser history
    if (typeof window !== "undefined" && window.history.length > 1) {
      window.history.back();
    } else {
      // Fallback to main page if no history
      router.push("/");
    }
  };

  return (
    <main className="flex-1 pb-20 md:pb-6 lg:pb-0">
      {/* Top bar with user info */}
      <header className="sticky top-0 z-20 w-full bg-[#FFFCF6] shadow-sm">
          <div className="mx-auto max-w-full px-3 sm:px-4 md:px-6 py-2 sm:py-3 md:py-4">
            <div className="flex items-center justify-between gap-3">
              {/* Левая часть: Лого + Меню */}
              <div className="flex items-center gap-2 sm:gap-3">
                {/* Logo */}
                <a href="/" className="flex items-center shrink-0">
                  <Image
                    src="/images/logo.png"
                    alt="Логотип"
                    width={44}
                    height={44}
                    className="w-9 h-9 sm:w-11 sm:h-11"
                    priority
                  />
                </a>

                {/* Menu Button */}
                <button
                  onClick={() => setMenuOpen(!menuOpen)}
                  className="flex items-center justify-center w-9 h-9 sm:w-11 sm:h-11 hover:bg-[#F5F0E4] rounded-xl transition-all shrink-0"
                  aria-label="Открыть меню"
                >
                  <svg className="w-5 h-5 sm:w-6 sm:h-6 text-[#4F5338]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </button>
              </div>

              {/* Правый блок: аватар + имя */}
              <div className="flex items-center gap-2 sm:gap-3">
                {user?.image ? (
                  <img
                    src={user?.image}
                    alt={"Аватар"}
                    className="h-8 w-8 sm:h-9 sm:w-9 md:h-10 md:w-10 rounded-full object-cover ring-2 ring-white"
                  />
                ) : (
                  <div className="h-8 w-8 sm:h-9 sm:w-9 md:h-10 md:w-10 rounded-full grid place-items-center bg-[#F2E6D6]">
                    <svg className="w-4 h-4 sm:w-[18px] sm:h-[18px]" viewBox="0 0 24 24" fill="none" stroke="#8A6E52">
                      <rect x="3" y="7" width="18" height="14" rx="3" strokeWidth="1.6" />
                      <path d="M8 7l1.2-2h5.6L16 7" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                      <circle cx="12" cy="14" r="3.2" strokeWidth="1.6" />
                    </svg>
                  </div>
                )}
                <span className="text-sm sm:text-base font-ManropeMedium text-[#4F5338] hidden sm:inline truncate max-w-[120px]">
                  {user?.name}
                </span>
              </div>
            </div>
          </div>
        </header>

      {/* Profile Menu */}
      <AnimatePresence>
        {menuOpen && <ProfileMenu key="profile-menu" setOpen={setMenuOpen} currentView={view} />}
      </AnimatePresence>

      {/* Panel container */}
      <div className=" max-w-full mx-auto">
        {view === "home" && <HomePanel {...panelProps} />}
        {view === "booking" && <BookingPanel {...panelProps} />}
        {view === "healthpasses" && <HealthPassesPanel {...panelProps} />}
        {view === "history" && <HistoryPanel {...panelProps} />}
        {view === "gifts" && <GiftsPanel {...panelProps} />}
        {view === "settings" && <SettingsPanel {...panelProps} />}
      </div>
    </main>
  );
}
