'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Image from 'next/image'

/**
 * items: [
 *  {
 *    id: '1',
 *    title?: 'Виниры',
 *    before: { src:'/img/b1.jpg', alt:'До' },
 *    after: { src:'/img/a1.jpg', alt:'После' },
 *    thumb?: { src:'/img/t1.jpg', alt:'Миниатюра' } // если нет — возьмём after
 *  }
 * ]
 */

function BeforeAfterHero({ before, after, initial = 50, className = '' }) {
  const wrapRef = useRef(null)
  const [pos, setPos] = useState(initial) // 0..100
  const draggingRef = useRef(false)

  const clamp = (v, a, b) => Math.max(a, Math.min(v, b))

  const setFromClientX = (clientX) => {
    const el = wrapRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const x = clamp(clientX - rect.left, 0, rect.width)
    const p = (x / rect.width) * 100
    setPos(p)
  }

  const onPointerDown = (e) => {
    // только ЛКМ или любой touch/pen
    if (e.pointerType === 'mouse' && e.button !== 0) return
    draggingRef.current = true
    e.currentTarget.setPointerCapture?.(e.pointerId)
    setFromClientX(e.clientX)
  }

  const onPointerMove = (e) => {
    if (!draggingRef.current) return
    setFromClientX(e.clientX)
  }

  const onPointerUp = () => {
    draggingRef.current = false
  }

  const onKeyDown = (e) => {
    const step = 2
    if (e.key === 'ArrowLeft') {
      e.preventDefault()
      setPos((p) => clamp(p - step, 0, 100))
    }
    if (e.key === 'ArrowRight') {
      e.preventDefault()
      setPos((p) => clamp(p + step, 0, 100))
    }
    if (e.key === 'Home') {
      e.preventDefault()
      setPos(0)
    }
    if (e.key === 'End') {
      e.preventDefault()
      setPos(100)
    }
  }

  // если initial меняется при переключении кейса — сбрасываем
  useEffect(() => {
    setPos(initial)
  }, [initial])

  return (
    <div
      ref={wrapRef}
      className={[
        'relative w-full overflow-hidden rounded-[20px] border border-black/10 bg-neutral-100',
        'shadow-[0_18px_50px_rgba(0,0,0,0.10)]',
        'aspect-[16/10] md:aspect-[16/9]',
        className,
      ].join(' ')}
      onClick={(e) => setFromClientX(e.clientX)}
    >
      {/* AFTER */}
      <Image
        src={after.src}
        alt={after.alt}
        fill
        className="object-cover"
        quality={90}
        sizes="(max-width: 768px) 100vw, 60vw"
        draggable={false}
        priority={false}
      />

      {/* BEFORE (clipped) */}
      <div className="absolute inset-0 overflow-hidden" style={{ width: `${pos}%` }}>
        <div
          className="relative h-full"
          style={{ width: pos > 0 ? `${(100 / pos) * 100}%` : '200%' }}
        >
          <Image
            src={before.src}
            alt={before.alt}
            fill
            className="object-cover"
            quality={90}
            sizes="(max-width: 768px) 100vw, 60vw"
            draggable={false}
            priority={false}
          />
        </div>
      </div>

      {/* Divider line */}
      <div
        className="absolute top-0 bottom-0 w-[3px] bg-white/90 shadow-[0_0_0_1px_rgba(0,0,0,0.08),0_12px_30px_rgba(0,0,0,0.20)]"
        style={{ left: `${pos}%` }}
      />

      {/* Handle */}
      <button
        type="button"
        className={[
          'absolute top-1/2 -translate-y-1/2 -translate-x-1/2',
          'w-12 h-12 md:w-14 md:h-14 rounded-full',
          'bg-white shadow-[0_18px_40px_rgba(0,0,0,0.18)]',
          'border border-black/10',
          'grid place-items-center',
          'cursor-ew-resize select-none touch-none',
          'transition-transform active:scale-95 hover:scale-105',
          'focus:outline-none focus-visible:ring-4 focus-visible:ring-[#184FF8]/25',
        ].join(' ')}
        style={{ left: `${pos}%` }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onLostPointerCapture={onPointerUp}
        onKeyDown={onKeyDown}
        role="slider"
        aria-label="Сравнение До / После"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(pos)}
        aria-orientation="horizontal"
      >
        {/* icon */}
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" className="text-black/70">
          <path
            d="M9 6L5 10L9 14M15 14L19 10L15 6M5 10H19"
            stroke="currentColor"
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {/* Labels */}
      <div className="absolute left-4 top-4 rounded-lg bg-black/55 px-3 py-1.5 text-xs md:text-sm font-medium text-white backdrop-blur">
        До
      </div>
      <div className="absolute right-4 top-4 rounded-lg bg-black/55 px-3 py-1.5 text-xs md:text-sm font-medium text-white backdrop-blur">
        После
      </div>
    </div>
  )
}

function Thumb({ src, alt, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        'relative shrink-0 overflow-hidden rounded-2xl',
        'w-[110px] h-[80px] md:w-[130px] md:h-[90px]',
        'border transition-all',
        active
          ? 'border-[#B08A66] shadow-[0_0_0_3px_rgba(176,138,102,0.25)]'
          : 'border-black/10 hover:border-black/20',
      ].join(' ')}
      aria-label="Открыть работу"
    >
      <Image
        src={src}
        alt={alt}
        fill
        className="object-cover"
        quality={85}
        sizes="140px"
        draggable={false}
      />
    </button>
  )
}

export default function WorksGalleryShowcase({
  title = 'Галерея наших работ',
  description = `Видео результаты процедур,\nвыполненных нашими специалистами.\nМы гордимся доверием наших клиентов\nи с радостью делимся их преображениями.`,
  buttonText = 'Перейти в раздел',
  onButtonClick,
  items = [],
}) {
  const safeItems = useMemo(() => items.filter(Boolean), [items])
  const [active, setActive] = useState(0)

  const current = safeItems[active]

  // запасной UI если нет данных
  if (!current) {
    return (
      <section className="rounded-[28px] bg-[#F6F2E9] p-8 md:p-10">
        <div className="text-[#2b2b2b]">
          Нет данных для галереи (items пуст).
        </div>
      </section>
    )
  }

  const thumb = current.thumb?.src || current.after?.src
  const thumbAlt = current.thumb?.alt || current.after?.alt || 'Миниатюра'

  return (
    <section className="rounded-[28px] p-6 md:p-10">
      <div className="grid grid-cols-1 gap-8 md:grid-cols-[1fr_1.15fr] md:items-center">
        {/* LEFT */}
        <div className="pt-2 md:pt-6">
          <h2 className="text-[clamp(1.25rem,0.9615rem+1.2821vw,2.5rem)] font-semibold tracking-tight text-[#636846]">
            {title}
          </h2>

          <p className="mt-4 whitespace-pre-line text-[clamp(0.75rem,0.6346rem+0.5128vw,1.25rem)] font-ManropeRegular leading-7 text-[#6A7058]">
            {description}
          </p>

          <button
            type="button"
            onClick={onButtonClick}
            className={[
              'mt-7 inline-flex items-center justify-center',
              'rounded-[5px] px-8 py-4',
              'bg-[#EFE6DA] text-[#8B6B52]',
              '',
              '',
            ].join(' ')}
          >
            {buttonText}
          </button>
        </div>

        {/* RIGHT */}
        <div className="md:pt-2">
          <BeforeAfterHero
            before={current.before}
            after={current.after}
            initial={50}
          />
        </div>
      </div>

      {/* THUMBS */}
      <div className="mt-8 flex gap-4 overflow-x-auto pb-2">
        {safeItems.map((it, idx) => {
          const tSrc = it.thumb?.src || it.after?.src
          const tAlt = it.thumb?.alt || it.after?.alt || 'Миниатюра'
          return (
            <Thumb
              key={it.id ?? idx}
              src={tSrc}
              alt={tAlt}
              active={idx === active}
              onClick={() => setActive(idx)}
            />
          )
        })}
      </div>
    </section>
  )
}
