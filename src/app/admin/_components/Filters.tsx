"use client";

import { useState } from "react";

export type FilterChip = {
  key: string;
  label: string;
  value: string | null;
  options?: { value: string; label: string }[];
};

type Props = {
  chips: FilterChip[];
  onChange: (key: string, value: string | null) => void;
  onReset: () => void;
};

export default function Filters({ chips, onChange, onReset }: Props) {
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  const hasActiveFilters = chips.some((chip) => chip.value !== null);

  const toggleDropdown = (key: string) => {
    setOpenDropdown(openDropdown === key ? null : key);
  };

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span className="text-sm text-[#636846] font-ManropeMedium">Фильтры:</span>

      {chips.map((chip) => (
        <div key={chip.key} className="relative">
          {chip.options ? (
            <>
              <button
                onClick={() => toggleDropdown(chip.key)}
                className={`px-3 py-1.5 text-sm rounded-full border transition-colors font-ManropeMedium ${
                  chip.value
                    ? "bg-[#F5F0E4] border-[var(--admin-text-accent)] text-[#967450]"
                    : "bg-white border-[#E8E2D5] text-[#636846] hover:bg-[#F5F0E4]"
                }`}
                aria-expanded={openDropdown === chip.key}
                aria-haspopup="listbox"
              >
                {chip.value ? chip.options.find((o) => o.value === chip.value)?.label || chip.label : chip.label}
                <span className="ml-1">▼</span>
              </button>

              {openDropdown === chip.key && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setOpenDropdown(null)} />
                  <div className="absolute top-full left-0 mt-1 bg-white border border-[#E8E2D5] rounded-lg shadow-[var(--shadow-lg)] z-50 min-w-[160px]">
                    <button
                      onClick={() => {
                        onChange(chip.key, null);
                        setOpenDropdown(null);
                      }}
                      className="w-full px-4 py-2 text-left text-sm hover:bg-[#F5F0E4] text-[#636846] font-ManropeRegular"
                    >
                      Сбросить
                    </button>
                    {chip.options.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => {
                          onChange(chip.key, option.value);
                          setOpenDropdown(null);
                        }}
                        className={`w-full px-4 py-2 text-left text-sm hover:bg-[#F5F0E4] font-ManropeRegular ${
                          chip.value === option.value ? "bg-[#F5F0E4] text-[#967450] font-ManropeMedium" : "text-[#4F5338]"
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </>
          ) : (
            <button
              onClick={() => onChange(chip.key, chip.value ? null : "active")}
              className={`px-3 py-1.5 text-sm rounded-full border transition-colors font-ManropeMedium ${
                chip.value
                  ? "bg-[#F5F0E4] border-[var(--admin-text-accent)] text-[#967450]"
                  : "bg-white border-[#E8E2D5] text-[#636846] hover:bg-[#F5F0E4]"
              }`}
            >
              {chip.label}
            </button>
          )}
        </div>
      ))}

      {hasActiveFilters && (
        <button
          onClick={onReset}
          className="px-3 py-1.5 text-sm text-[#636846] hover:text-[#4F5338] underline font-ManropeRegular"
          aria-label="Сбросить все фильтры"
        >
          Сбросить все
        </button>
      )}
    </div>
  );
}
