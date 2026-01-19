"use client";

import { useEffect, useRef, useState } from "react";

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

export default function BeforeAfterCompare({
  before,
  after,
  alt = "До/После",
  initial = 0.5,
}) {
  const wrapRef = useRef(null);
  const draggingRef = useRef(false);
  const [pos, setPos] = useState(initial);

  const setFromClientX = (clientX) => {
    const el = wrapRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const p = (clientX - r.left) / r.width;
    setPos(clamp(p, 0, 1));
  };

  const onPointerDown = (e) => {
    draggingRef.current = true;
    e.currentTarget.setPointerCapture?.(e.pointerId);
    setFromClientX(e.clientX);
  };

  const onPointerMove = (e) => {
    if (!draggingRef.current) return;
    setFromClientX(e.clientX);
  };

  const stopDrag = () => (draggingRef.current = false);

  useEffect(() => {
    const onUp = () => stopDrag();
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
    return () => {
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
    };
  }, []);

  const rightCut = (1 - pos) * 100;

  return (
    <div
      ref={wrapRef}
      className="relative overflow-hidden rounded-[18px] bg-[#EFEBE3] select-none touch-none"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={stopDrag}
      onPointerCancel={stopDrag}
      role="slider"
      aria-label={alt}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(pos * 100)}
    >
      <div className="relative aspect-[4/3]">
        {/* BEFORE */}
        <img
          src={before}
          alt={`${alt} до`}
          className="absolute inset-0 h-full w-full object-cover"
          draggable={false}
        />

        {/* AFTER (проявляем через clip-path) */}
        <div
          className="absolute inset-0"
          style={{ clipPath: `inset(0 ${rightCut}% 0 0)` }}
        >
          <img
            src={after}
            alt={`${alt} после`}
            className="absolute inset-0 h-full w-full object-cover"
            draggable={false}
          />
        </div>

        {/* divider */}
        <div
          className="pointer-events-none absolute top-0 h-full w-[2px] bg-white/85"
          style={{ left: `${pos * 100}%`, transform: "translateX(-1px)" }}
        />

        {/* handle */}
        <button
          type="button"
          className="absolute top-1/2 rounded-full bg-white/90 px-3 py-1 shadow-sm ring-1 ring-black/5"
          style={{ left: `${pos * 100}%`, transform: "translate(-50%, -50%)" }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={stopDrag}
          onPointerCancel={stopDrag}
          aria-label="Перетащить для сравнения"
        >
          <div className="flex items-center gap-1">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path
                d="M14 7L9 12L14 17"
                stroke="#4F5338"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path
                d="M10 7L15 12L10 17"
                stroke="#4F5338"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        </button>
      </div>
    </div>
  );
}
