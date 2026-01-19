"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function DirectionSelect({
  label = "Выбрать направление:",
  value,
  onChange,
  options = [],
  placeholder = "Все",
  className = "",
  dropdownWidthClass = "w-full md:w-[240px]",
}) {
  const wrapRef = useRef(null);
  const [open, setOpen] = useState(false);

  const current = useMemo(() => {
    return options.find((o) => o.id === value) || null;
  }, [options, value]);

  useEffect(() => {
    const onDown = (e) => {
      if (!wrapRef.current) return;
      if (!wrapRef.current.contains(e.target)) setOpen(false);
    };
    const onKey = (e) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("mousedown", onDown);
    window.addEventListener("touchstart", onDown);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("mousedown", onDown);
      window.removeEventListener("touchstart", onDown);
      window.removeEventListener("keydown", onKey);
    };
  }, []);

  return (
    <div
      ref={wrapRef}
      className={[
        // ✅ на мобиле колонка, на md — строка
        "flex flex-col items-start gap-2 md:flex-row md:items-center md:gap-4",
        className,
      ].join(" ")}
    >
      <div className="text-[14px] md:text-[16px] font-[Manrope-Regular] text-[#2F2D28]/70">
        {label}
      </div>

      <div className={["relative", dropdownWidthClass, "w-full"].join(" ")}>
        {/* Trigger */}
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className={[
            "group relative h-12 w-full rounded-xl md:rounded-2xl px-4 pr-11 text-left",
            "bg-white/70 ring-1 ring-[#4F5338]/10 outline-none",
            "hover:ring-[#967450]/25 transition",
            "focus:ring-2 focus:ring-[#967450]/25",
          ].join(" ")}
          aria-haspopup="listbox"
          aria-expanded={open}
        >
          <span className="block text-[16px] font-[Manrope-Regular] text-[#2F2D28]">
            {current?.label ?? placeholder}
          </span>

          {/* chevron */}
          <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 opacity-80">
            <motion.svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              animate={{ rotate: open ? 180 : 0 }}
              transition={{ duration: 0.18 }}
            >
              <path
                d="M7 10l5 5 5-5"
                stroke="#4F5338"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </motion.svg>
          </span>

          <span className="pointer-events-none absolute inset-x-0 bottom-0 h-[2px] rounded-b-2xl bg-[#967450]/0 group-hover:bg-[#967450]/20 transition" />
        </button>

        {/* Dropdown */}
        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ opacity: 0, y: 8, scale: 0.985 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 6, scale: 0.985 }}
              transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
              className={[
                // ✅ чтобы НЕ вылезало за экран:
                // на мобиле прижимаем к правому краю контейнера
                // и ограничиваем ширину по viewport
                "absolute z-50 mt-2",
                "right-0 md:right-auto md:left-0", // моб: right-0, desktop: left-0
                "w-full",
                "max-w-[calc(100vw-32px)]", // 16px слева + 16px справа (под твои отступы)
                "overflow-hidden rounded-2xl",
                "bg-[#F5F0E4] ring-1 ring-[#4F5338]/10 shadow-[0_18px_40px_rgba(0,0,0,0.08)]",
              ].join(" ")}
              role="listbox"
            >
              <div className="max-h-[320px] overflow-auto p-2">
                {options.map((opt) => {
                  const active = opt.id === value;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => {
                        onChange?.(opt.id);
                        setOpen(false);
                      }}
                      className={[
                        "w-full rounded-xl px-3 py-3 text-left transition",
                        "flex items-center justify-between gap-3",
                        active
                          ? "bg-white/70 ring-1 ring-[#967450]/25"
                          : "hover:bg-white/60",
                      ].join(" ")}
                      role="option"
                      aria-selected={active}
                    >
                      <span className="text-[15px] font-[Manrope-Regular] text-[#2F2D28]">
                        {opt.label}
                      </span>

                      {active && (
                        <span className="grid h-7 w-7 place-items-center rounded-full bg-white/80">
                          <svg width="14" height="10" viewBox="0 0 14 10" fill="none">
                            <path
                              d="M1 5L5 9L13 1"
                              stroke="#4F5338"
                              strokeWidth="1.8"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
