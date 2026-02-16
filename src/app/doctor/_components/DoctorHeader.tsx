"use client";

import { useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import DoctorMenu from "./DoctorMenu";

type View = "home" | "calendar" | "services" | "schedule" | "blocks" | "settings";

type Props = {
  title: string;
  view: View;
  userName: string;
  userImage?: string;
  onAction?: () => void;
};

const VIEW_ACTIONS: Partial<Record<View, { label: string; icon: string }>> = {
 
  
};

export default function DoctorHeader({ title, view, userName, userImage, onAction }: Props) {
  const [menuOpen, setMenuOpen] = useState(false);
  const action = VIEW_ACTIONS[view];

  return (
    <>
      <header className="sticky top-0 z-[20] bg-white shadow-sm">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between gap-4">
            {/* Left: Logo + Menu + Title */}
            <div className="flex items-center gap-0 xs:gap-2 min-w-0 flex-1">
              {/* Logo */}
              <a href="/" className="flex items-center shrink-0">
                <Image
                  src="/images/logo.png"
                  alt="Логотип"
                  width={44}
                  height={44}
                  className="w-11 h-11"
                  priority
                />
              </a>

              {/* Menu Button */}
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="flex items-center justify-center w-11 h-11 hover:bg-[#F5F0E4] rounded-xl transition-all shrink-0"
                aria-label="Открыть меню"
              >
                <svg className="w-6 h-6 text-[#4F5338]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>

              {/* Title - desktop only */}
              <h1 className="hidden lg:block text-lg font-ManropeBold text-[#4F5338] truncate">
                {title}
              </h1>
            </div>

            {/* Right: Action Button + User Info */}
            <div className="flex items-center gap-2 shrink-0">
              {/* Action Button */}
              {action && (
                <button
                  onClick={onAction}
                  className="flex items-center justify-center gap-2 w-9 md:w-auto h-9 md:px-3 bg-[#5C6744] text-white rounded-lg hover:bg-[#4F5938] transition-all hover:scale-105 shadow-sm"
                  aria-label={action.label}
                >
                  <span className="text-lg leading-none">{action.icon}</span>
                  <span className="hidden md:inline text-sm font-ManropeMedium whitespace-nowrap">{action.label}</span>
                </button>
              )}

              {/* User Info */}
              <div className="flex items-center gap-2">
                {userImage ? (
                  <img
                    src={userImage}
                    alt={userName}
                    className="w-8 h-8 rounded-full object-cover shrink-0 ring-2 ring-white"
                  />
                ) : (
                  <div className="w-8 h-8 bg-[#5C6744] rounded-full flex items-center justify-center text-white text-sm font-ManropeBold shrink-0">
                    {userName.charAt(0).toUpperCase()}
                  </div>
                )}
                <span className="hidden xl:inline text-sm text-[#4F5338] font-ManropeMedium truncate max-w-[120px]">
                  {userName}
                </span>
              </div>
            </div>
          </div>

          {/* Title - mobile/tablet only */}
          <div className="lg:hidden mt-3">
            <h1 className="text-lg font-ManropeBold text-[#4F5338] truncate">
              {title}
            </h1>
          </div>
        </div>
      </header>

      {/* Menu Modal */}
      <AnimatePresence>
        {menuOpen && <DoctorMenu key="doctor-menu" setOpen={setMenuOpen} currentView={view} />}
      </AnimatePresence>
    </>
  );
}
