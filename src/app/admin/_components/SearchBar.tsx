"use client";

import { useState, useEffect } from "react";

type Props = {
  placeholder?: string;
  onSearch: (query: string) => void;
  defaultValue?: string;
};

export default function SearchBar({ placeholder = "Поиск (имя/телефон/почта/карта)", onSearch, defaultValue = "" }: Props) {
  const [query, setQuery] = useState(defaultValue);

  // Debounced search - wait 500ms after user stops typing
  useEffect(() => {
    const timer = setTimeout(() => {
      onSearch(query);
    }, 500);

    return () => clearTimeout(timer);
  }, [query, onSearch]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(query);
  };

  return (
    <form onSubmit={handleSubmit} className="relative w-full">
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          className="w-full pl-[2.5rem] pr-[2.5rem] py-[clamp(0.875rem,0.7596rem+0.5128vw,1.25rem)] bg-[#F5F0E4] border-none rounded-xl text-base font-ManropeRegular text-[#4F5338] placeholder:text-[#636846] focus:outline-none focus:ring-2 focus:ring-[#967450]"
          aria-label="Поиск"
        />
        <svg
          className="absolute left-[1rem] top-1/2 -translate-y-1/2 w-[1.25rem] h-[1.25rem] text-[#636846] pointer-events-none"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          strokeWidth={2}
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        {query && (
          <button
            type="button"
            onClick={() => {
              setQuery("");
              onSearch("");
            }}
            className="absolute right-[1rem] top-1/2 -translate-y-1/2 text-[#636846] hover:text-[#4F5338] transition-colors"
            aria-label="Очистить поиск"
          >
            <svg className="w-[1.125rem] h-[1.125rem]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
    </form>
  );
}
