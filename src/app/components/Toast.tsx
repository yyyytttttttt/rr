'use client';

import { useEffect } from 'react';

interface ToastProps {
  message: string;
  onClose: () => void;
  duration?: number;
}

export default function Toast({ message, onClose, duration = 5000 }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  return (
    <div className="fixed top-4 right-4 left-4 sm:left-auto sm:top-6 sm:right-6 z-50 animate-slideIn">
      <div className="bg-white rounded-[12px] shadow-lg px-4 py-3 sm:px-6 sm:py-4 flex items-center gap-3 sm:gap-4 sm:min-w-[320px] max-w-[500px]">
        {/* SVG галочка */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="40"
          height="40"
          viewBox="0 0 64 64"
          fill="none"
          className="flex-shrink-0 sm:w-12 sm:h-12"
        >
          <g clipPath="url(#clip0_9406_2745)">
            <path
              d="M10 36L24 50L56 18"
              stroke="#636846"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </g>
          <defs>
            <clipPath id="clip0_9406_2745">
              <rect width="64" height="64" fill="white"/>
            </clipPath>
          </defs>
        </svg>

        {/* Текст сообщения */}
        <p className="text-[#636846] font-ManropeMedium text-[14px] sm:text-[clamp(0.875rem,0.8077rem+0.2885vw,1.125rem)] leading-snug flex-1">
          {message}
        </p>

        {/* Кнопка закрытия (необязательно) */}
        <button
          onClick={onClose}
          className="flex-shrink-0 text-[#636846] hover:opacity-70 transition p-1"
          aria-label="Закрыть"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="sm:w-5 sm:h-5"
          >
            <line x1="18" y1="6" x2="6" y2="18"/>
            <line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>
    </div>
  );
}
