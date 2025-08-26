// hooks/usePagedScroll.js
import { useState, useRef, useEffect, useCallback, useMemo } from 'react'

/**
 * Универсальный постраничный скролл (колёсико/свайпы/клавиатура) + мобильные оверрайды.
 *
 * Параметры:
 * - pageCount: число страниц (обяз.)
 * - initialPage: стартовая страница (0)
 * - axis: 'y' | 'x' — базовая ось (дефолтная для desktop)
 * - duration: длительность анимации (мс)
 * - touchThreshold: порог свайпа в px
 * - keyboard: реагировать ли на клавиатуру
 * - blockWhileAnimating: блокировать ли новые переходы, пока идёт анимация
 * - shouldCaptureEvent?: (e) => boolean — если вернёт true, событие наше; иначе игнор
 * - onPageChange?: (nextIdx, prevIdx) => void
 *
 * Мобильные настройки:
 * - mobileMaxWidth: число px (по умолчанию 480)
 * - mobile: { axis, duration, touchThreshold, keyboard, blockWhileAnimating }
 *   Любой из этих параметров можно опустить — возьмётся desktop-значение.
 *
 * Возвращает:
 * - currentPage, isAnimating, isMobile
 * - containerRef
 * - next, prev, goTo
 * - motionAnimate, motionTransition
 * - activeAxis (фактическая ось с учётом моб. оверрайдов)
 */
export function usePagedScroll({
  pageCount,
  initialPage = 0,
  axis = 'y',
  duration = 600,
  touchThreshold = 50,
  keyboard = true,
  blockWhileAnimating = true,
  shouldCaptureEvent,
  onPageChange,

  // Мобильные оверрайды
  mobileMaxWidth = 480,
  mobile, // { axis?, duration?, touchThreshold?, keyboard?, blockWhileAnimating? }
} = {}) {
  const [currentPage, setCurrentPage] = useState(initialPage)
  const [isAnimating, setIsAnimating] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  const containerRef = useRef(null)
  const pageCountRef = useRef(pageCount)

  // Детект мобилки
  useEffect(() => {
    if (typeof window === 'undefined') return
    const check = () => setIsMobile(window.innerWidth <= mobileMaxWidth)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [mobileMaxWidth])

  // Актуализируем количество страниц и индекс
  useEffect(() => {
    pageCountRef.current = pageCount
    setCurrentPage((prev) => Math.max(0, Math.min(pageCount - 1, prev)))
  }, [pageCount])

  // Сливаем базовые и мобильные настройки в «эффективные»
  const cfg = useMemo(() => {
    const useMobile = isMobile && mobile && typeof mobile === 'object'
    return {
      axis: useMobile && mobile.axis != null ? mobile.axis : axis,
      duration: useMobile && mobile.duration != null ? mobile.duration : duration,
      touchThreshold:
        useMobile && mobile.touchThreshold != null ? mobile.touchThreshold : touchThreshold,
      keyboard: useMobile && mobile.keyboard != null ? mobile.keyboard : keyboard,
      blockWhileAnimating:
        useMobile && mobile.blockWhileAnimating != null
          ? mobile.blockWhileAnimating
          : blockWhileAnimating,
    }
  }, [isMobile, mobile, axis, duration, touchThreshold, keyboard, blockWhileAnimating])

  const goTo = useCallback(
    (idx) => {
      setCurrentPage((prev) => {
        const next = Math.max(0, Math.min(pageCountRef.current - 1, idx))
        if (next !== prev) {
          if (cfg.blockWhileAnimating) setIsAnimating(true)
          onPageChange?.(next, prev)
        }
        return next
      })
    },
    [onPageChange, cfg.blockWhileAnimating]
  )

  const next = useCallback(() => {
    setCurrentPage((prev) => {
      const nextIdx = Math.min(pageCountRef.current - 1, prev + 1)
      if (nextIdx !== prev) {
        if (cfg.blockWhileAnimating) setIsAnimating(true)
        onPageChange?.(nextIdx, prev)
      }
      return nextIdx
    })
  }, [onPageChange, cfg.blockWhileAnimating])

  const prev = useCallback(() => {
    setCurrentPage((prev) => {
      const nextIdx = Math.max(0, prev - 1)
      if (nextIdx !== prev) {
        if (cfg.blockWhileAnimating) setIsAnimating(true)
        onPageChange?.(nextIdx, prev)
      }
      return nextIdx
    })
  }, [onPageChange, cfg.blockWhileAnimating])

  // Сбрасываем блокировку после анимации
  useEffect(() => {
    if (!cfg.blockWhileAnimating || !isAnimating) return
    const t = setTimeout(() => setIsAnimating(false), cfg.duration)
    return () => clearTimeout(t)
  }, [isAnimating, cfg.duration, cfg.blockWhileAnimating])

  // Обработчики событий
  useEffect(() => {
    if (typeof window === 'undefined') return
    const el = containerRef.current ?? window

    let startX = 0
    let startY = 0

    const shouldSkip = (e) => {
      if (cfg.blockWhileAnimating && isAnimating) return true
      if (typeof shouldCaptureEvent === 'function') {
        // true -> наше событие, false -> игнорим
        return !shouldCaptureEvent(e)
      }
      return false
    }

    const onWheel = (e) => {
      if (shouldSkip(e)) return

      // для вертикали — deltaY (или deltaX при Shift), для горизонтали — наоборот
      const primaryDelta =
        cfg.axis === 'y'
          ? Math.abs(e.deltaY) >= Math.abs(e.deltaX)
            ? e.deltaY
            : e.shiftKey
            ? e.deltaX
            : 0
          : Math.abs(e.deltaX) >= Math.abs(e.deltaY)
          ? e.deltaX
          : e.shiftKey
          ? e.deltaY
          : 0

      if (primaryDelta > 0) next()
      else if (primaryDelta < 0) prev()
    }

    const onTouchStart = (e) => {
      const t = e.touches[0]
      startX = t.clientX
      startY = t.clientY
    }

    const onTouchEnd = (e) => {
      if (shouldSkip(e)) return
      const t = e.changedTouches[0]
      const dx = t.clientX - startX
      const dy = t.clientY - startY
      const primary = cfg.axis === 'y' ? -dy : -dx

      if (primary > cfg.touchThreshold) next()
      else if (primary < -cfg.touchThreshold) prev()
    }

    const onKeyDown = (e) => {
      if (!cfg.keyboard) return
      if (cfg.blockWhileAnimating && isAnimating) return

      if (cfg.axis === 'y') {
        if (['ArrowDown', 'PageDown', 'Space'].includes(e.code)) next()
        if (['ArrowUp', 'PageUp'].includes(e.code)) prev()
      } else {
        if (['ArrowRight'].includes(e.code)) next()
        if (['ArrowLeft'].includes(e.code)) prev()
      }
    }

    el.addEventListener('wheel', onWheel, { passive: true })
    el.addEventListener('touchstart', onTouchStart, { passive: true })
    el.addEventListener('touchend', onTouchEnd, { passive: true })
    window.addEventListener('keydown', onKeyDown)

    return () => {
      el.removeEventListener('wheel', onWheel)
      el.removeEventListener('touchstart', onTouchStart)
      el.removeEventListener('touchend', onTouchEnd)
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [
    cfg.axis,
    cfg.keyboard,
    cfg.touchThreshold,
    cfg.blockWhileAnimating,
    isAnimating,
    next,
    prev,
    shouldCaptureEvent,
  ])

  // Готовые пропсы для framer-motion
  const motionAnimate =
    cfg.axis === 'y'
      ? { x: 0, y: `-${currentPage * 100}vh` }
      : { y: 0, x: `-${currentPage * 100}vw` }

  const motionTransition = { duration: cfg.duration / 1000, ease: [0.33, 1, 0.68, 1] }

  return {
    currentPage,
    isAnimating,
    isMobile,        // ← можно использовать снаружи
    containerRef,
    next,
    prev,
    goTo,
    motionAnimate,
    motionTransition,
    activeAxis: cfg.axis,
  }
}
