"use client";
import React, { useCallback, useMemo, useRef, useState, useEffect } from "react";
import FullCalendar from "@fullcalendar/react";
import type {
  DateSelectArg,
  EventClickArg,
  EventDropArg,
  EventContentArg,
} from "@fullcalendar/core";
import timeGridPlugin from "@fullcalendar/timegrid";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import ruLocale from "@fullcalendar/core/locales/ru";
import * as Dialog from "@radix-ui/react-dialog";

import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import toast, { Toaster } from "react-hot-toast";

import { toZonedTime, fromZonedTime } from "date-fns-tz";

import type {
  ClientCalendarProps,
  CalendarEvent,
  CalendarApiResponse,
  ApiOpening,
  ApiException,
  ApiBooking,
  SelectionState,
  EditTargetState,
  StatusTargetState,
  WhichCreateState,
  BookingStatus,
  ModalProps,
  OpenFormModalProps,
  ExceptionFormModalProps,
  StatusModalProps,
} from "./types";

/* ===============================
   Константы
   =============================== */
const DEFAULT_BUFFER_MIN = 15; // По умолчанию 15 минут

/* ===============================
   Утилиты времени c учётом tzid
   =============================== */
// NOTE: Конвертация Date в строку для datetime-local инпута
// FullCalendar с timeZone="Europe/Moscow" передаёт Date объекты, где UTC время = московское время
// Поэтому извлекаем компоненты из UTC напрямую
function dateToLocalInputValueTZ(d: Date | null | undefined, tzid: string): string {
  if (!d) return "";

  const pad = (x: number) => String(x).padStart(2, "0");
  // NOTE: Используем UTC методы, т.к. FullCalendar хранит московское время как UTC
  const y = d.getUTCFullYear();
  const m = pad(d.getUTCMonth() + 1);
  const day = pad(d.getUTCDate());
  const h = pad(d.getUTCHours());
  const min = pad(d.getUTCMinutes());
  return `${y}-${m}-${day}T${h}:${min}`;
}

function localValueTZToISOString(localValue: string, tzid: string): string {
  // localValue = "2025-10-16T16:30" (московское время из формы)
  // FullCalendar хранит московское время как UTC
  // Просто добавляем :00.000Z к строке
  return `${localValue}:00.000Z`;
}

/* ===============================
   Нормализатор событий
   =============================== */
// NOTE: Безопасное извлечение даты из API (start/startUtc поля)
function normalizeDateTime(item: ApiOpening | ApiException | ApiBooking): {
  start: string;
  end: string;
} {
  const start = (item as any).start ?? (item as any).startUtc ?? "";
  const end = (item as any).end ?? (item as any).endUtc ?? "";
  return { start, end };
}

function normalizeOpenings(items: ApiOpening[]): CalendarEvent[] {
  return items.map((o) => {
    const { start, end } = normalizeDateTime(o);
    return {
      id: `opening:${o.id}`,
      title: "Окно приёма",
      start,
      end,
      backgroundColor: "#DCFCE7",
      borderColor: "#16A34A",
      textColor: "#14532D",
      editable: true,
      extendedProps: { type: "opening" as const, backendId: o.id },
    };
  });
}

function normalizeExceptions(items: ApiException[]): CalendarEvent[] {
  return items.map((e) => {
    const { start, end } = normalizeDateTime(e);
    return {
      id: `exception:${e.id}`,
      title: e.reason ? `Перерыв: ${e.reason}` : "Перерыв",
      start,
      end,
      backgroundColor: "#FEE2E2",
      borderColor: "#DC2626",
      textColor: "#7F1D1D",
      editable: true,
      extendedProps: {
        type: "exception" as const,
        backendId: e.id,
        reason: e.reason,
      },
    };
  });
}

function normalizeBookings(items: ApiBooking[]): CalendarEvent[] {
  return items.map((b) => {
    const { start, end } = normalizeDateTime(b);
    const status = b.status || "CONFIRMED";
    return {
      id: `booking:${b.id}`,
      title: bookingTitle(b),
      start,
      end,
      backgroundColor: bookingColor(status),
      borderColor: bookingBorder(status),
      textColor: "#111827",
      editable: false,
      extendedProps: {
        type: "booking" as const,
        backendId: b.id,
        status,
        clientName: b.clientName,
        clientEmail: b.clientEmail,
        serviceName: b.serviceName,
        note: b.note,
      },
    };
  });
}

function normalizeUnavailabilities(items: any[]): CalendarEvent[] {
  return items.map((u) => {
    const { start, end } = normalizeDateTime(u);
    const typeLabels: Record<string, string> = {
      VACATION: "🏖️ Отпуск",
      DAY_OFF: "🏠 Выходной",
      NO_BOOKINGS: "🚫 Без записей",
    };
    const title = u.reason
      ? `${typeLabels[u.type] || "Блокировка"}: ${u.reason}`
      : typeLabels[u.type] || "Блокировка";

    return {
      id: `unavailability:${u.id}`,
      title,
      start,
      end,
      backgroundColor:
        u.type === "VACATION"
          ? "#DBEAFE"
          : u.type === "DAY_OFF"
          ? "#FEF3C7"
          : "#FEE2E2",
      borderColor:
        u.type === "VACATION"
          ? "#3B82F6"
          : u.type === "DAY_OFF"
          ? "#F59E0B"
          : "#EF4444",
      textColor: "#111827",
      editable: false,
      display: "background",
      extendedProps: {
        type: "unavailability" as const,
        backendId: u.parentId || u.id,
        unavailabilityType: u.type,
        reason: u.reason,
        isRecurring: u.isRecurring,
      },
    };
  });
}

/* ===============================
   Валидация буфера между записями
   =============================== */
function hasBufferViolation(
  newStart: Date,
  newEnd: Date,
  existingEvents: CalendarEvent[],
  bufferMin: number,
  excludeId?: string
): boolean {
  const bufferMs = bufferMin * 60 * 1000;
  const newStartMs = newStart.getTime();
  const newEndMs = newEnd.getTime();

  for (const evt of existingEvents) {
    if (excludeId && evt.id === excludeId) continue;
    // Игнорируем opening (можно создавать внутри окон приёма)
    if (evt.extendedProps?.type === "opening") continue;

    const evtStart = new Date(evt.start).getTime();
    const evtEnd = new Date(evt.end).getTime();

    // проверка буферной зоны
    if (newEndMs > evtStart - bufferMs && newStartMs < evtEnd + bufferMs) {
      return true;
    }
  }
  return false;
}

/* ===============================
   Пересечение с unavailability
   =============================== */
function hasUnavailabilityConflict(
  newStart: Date,
  newEnd: Date,
  existingEvents: CalendarEvent[]
): boolean {
  const newStartMs = newStart.getTime();
  const newEndMs = newEnd.getTime();

  for (const evt of existingEvents) {
    if (evt.extendedProps?.type !== "unavailability") continue;

    const evtStart = new Date(evt.start).getTime();
    const evtEnd = new Date(evt.end).getTime();

    if (newStartMs < evtEnd && newEndMs > evtStart) {
      return true;
    }
  }
  return false;
}

/* ===============================
   Валидация
   =============================== */
const openingSchema = z.object({
  startLocal: z.string().min(1, "Укажите начало"),
  endLocal: z.string().min(1, "Укажите конец"),
});
const exceptionSchema = openingSchema.extend({
  reason: z.string().max(200, "Макс. 200 символов").optional(),
});
const statusSchema = z.object({
  status: z.enum(["CONFIRMED", "CANCELED", "COMPLETED", "NO_SHOW"]),
});

/* ===============================
   API helpers
   =============================== */
async function mutateOpening(
  action: string,
  payload: Record<string, unknown>
): Promise<unknown> {
  const res = await fetch("/api/doctor/openings/edit", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ action, ...payload }),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok)
    throw new Error(
      (json as { error?: string })?.error || "Ошибка управления окном"
    );
  return json;
}

async function mutateException(
  action: string,
  payload: Record<string, unknown>
): Promise<unknown> {
  const res = await fetch("/api/doctor/exceptions/mutate", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ action, ...payload }),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok)
    throw new Error(
      (json as { error?: string })?.error || "Ошибка управления перерывом"
    );
  return json;
}

async function postJson(url: string, body: Record<string, unknown>): Promise<unknown> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok)
    throw new Error(
      (json as { error?: string; message?: string })?.error ||
        (json as { error?: string; message?: string })?.message ||
        res.statusText
    );
  return json;
}

/* ===============================
   Модалка в стиле проекта (Radix UI)
   =============================== */
function Modal({ open, onClose, title, children, footer }: ModalProps) {
  return (
    <Dialog.Root open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/30 backdrop-blur-sm z-[9999]" />
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-[clamp(1rem,0.8846rem+0.5128vw,1.5rem)] shadow-2xl z-[10000] w-[calc(100%-2rem)] max-w-[clamp(28rem,26rem+8vw,36rem)] max-h-[90vh] overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between gap-4 px-[clamp(1.5rem,1.2692rem+1.0256vw,2.5rem)] py-[clamp(1.25rem,1.0192rem+1.0256vw,2.25rem)] border-b border-[#E8E2D5]">
            <Dialog.Title className="flex-1 min-w-0 text-[clamp(1.25rem,1.1346rem+0.5128vw,1.75rem)] font-ManropeBold text-[#4F5338] truncate">
              {title}
            </Dialog.Title>
            <Dialog.Close asChild>
              <button
                className="flex-shrink-0 p-1 text-[#636846] hover:text-[#4F5338] transition-colors rounded-lg hover:bg-[#F5F0E4]"
                aria-label="Закрыть"
              >
                <svg
                  className="w-[clamp(1.5rem,1.3846rem+0.5128vw,2rem)] h-[clamp(1.5rem,1.3846rem+0.5128vw,2rem)]"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </Dialog.Close>
          </div>

          {/* Content */}
          <div className="overflow-y-auto max-h-[calc(90vh-12rem)] px-[clamp(1.5rem,1.2692rem+1.0256vw,2.5rem)] py-[clamp(1.5rem,1.2692rem+1.0256vw,2.5rem)]">
            <div className="space-y-[clamp(1rem,0.8846rem+0.5128vw,1.5rem)]">{children}</div>
          </div>

          {/* Footer */}
          {footer && (
            <div className="border-t border-[#E8E2D5] px-[clamp(1.5rem,1.2692rem+1.0256vw,2.5rem)] py-[clamp(1rem,0.8846rem+0.5128vw,1.5rem)] flex justify-end gap-[clamp(0.75rem,0.6346rem+0.5128vw,1.25rem)]">
              {footer}
            </div>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

/* ===============================
   Главный компонент (переверстано, функционал неизменён)
   =============================== */
export default function ClientCalendar({
  doctorId,
  tzid = "UTC",
  doctorName = "Врач",
  bufferMin = DEFAULT_BUFFER_MIN,
}: ClientCalendarProps) {
  const [loading, setLoading] = useState(false);
  const calendarRef = useRef<FullCalendar | null>(null);

  // состояние модалок
  const [selection, setSelection] = useState<SelectionState | null>(null);
  const [editTarget, setEditTarget] = useState<EditTargetState | null>(null);
  const [statusTarget, setStatusTarget] = useState<StatusTargetState | null>(
    null
  );
  const [whichCreate, setWhichCreate] = useState<WhichCreateState>(null);

  // NOTE: Кеш загруженных событий для валидации буфера
  const eventsCache = useRef<CalendarEvent[]>([]);

  // стабильные пропсы
  const plugins = useMemo(
    () => [timeGridPlugin, dayGridPlugin, interactionPlugin],
    []
  );
  const locales = useMemo(() => [ruLocale], []);
  // Динамический headerToolbar в зависимости от размера экрана
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Синхронизация горизонтального скролла заголовков и тела календаря
  useEffect(() => {
    if (!isMobile) return;

    const timer = setTimeout(() => {
      const scrollers = document.querySelectorAll('.fc-scroller');
      const scrollerArray = Array.from(scrollers);

      const bodyScroller = scrollerArray.find(s =>
        s.closest('.fc-timegrid-body')
      );
      const headerScroller = scrollerArray.find(s =>
        s.closest('.fc-col-header')
      );

      if (!bodyScroller || !headerScroller) return;

      let syncing = false;

      const syncFromBody = () => {
        if (syncing) return;
        syncing = true;
        headerScroller.scrollLeft = bodyScroller.scrollLeft;
        requestAnimationFrame(() => { syncing = false; });
      };

      const syncFromHeader = () => {
        if (syncing) return;
        syncing = true;
        bodyScroller.scrollLeft = headerScroller.scrollLeft;
        requestAnimationFrame(() => { syncing = false; });
      };

      bodyScroller.addEventListener('scroll', syncFromBody, { passive: true });
      headerScroller.addEventListener('scroll', syncFromHeader, { passive: true });

      return () => {
        bodyScroller.removeEventListener('scroll', syncFromBody);
        headerScroller.removeEventListener('scroll', syncFromHeader);
      };
    }, 800);

    return () => clearTimeout(timer);
  }, [isMobile]);

  const headerToolbar = useMemo(
    () => isMobile
      ? false // Скрываем стандартный toolbar на мобильных
      : {
          left: "prev,next today",
          center: "title",
          right: "dayGridMonth,timeGridWeek,timeGridDay"
        },
    [isMobile]
  );

  // защита от шторма
  const rangeCacheRef = useRef(new Map<string, CalendarEvent[]>());
  const inflightRef = useRef<AbortController | null>(null);
  const refetchTimerRef = useRef<NodeJS.Timeout | null>(null);

  const makeKey = useCallback(
    (info: { startStr: string; endStr: string }) =>
      `${info.startStr}|${info.endStr}|${tzid}`,
    [tzid]
  );

  const loadEvents = useCallback(
    async (
      info: { start: Date; end: Date; startStr: string; endStr: string },
      success: (events: CalendarEvent[]) => void,
      failure: (error: Error) => void
    ) => {
      const key = makeKey(info);
      const cached = rangeCacheRef.current.get(key);
      if (cached) {
        eventsCache.current = cached;
        return success(cached);
      }

      inflightRef.current?.abort?.();
      const ctrl = new AbortController();
      inflightRef.current = ctrl;

      const from = info.start.toISOString();
      const to = info.end.toISOString();
      const url = `/api/doctor/calendar?doctorId=${encodeURIComponent(
        doctorId
      )}&from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`;

      try {
        setLoading(true);
        const data = (await fetch(url, {
          cache: "no-store",
          signal: ctrl.signal,
        }).then((r) => r.json())) as CalendarApiResponse;

        const openings = normalizeOpenings(data.openings || []);
        const exceptions = normalizeExceptions(data.exceptions || []);
        const bookingsRaw = data.bookings || data.busy || [];
        const bookings = normalizeBookings(bookingsRaw);
        const unavailabilities = normalizeUnavailabilities(
          data.unavailabilities || []
        );

        const merged = [...openings, ...exceptions, ...bookings, ...unavailabilities];
        eventsCache.current = merged;
        rangeCacheRef.current.set(key, merged);
        success(merged);
      } catch (e) {
        const error = e as Error;
        if (error?.name !== "AbortError") {
          console.error(error);
          failure?.(error);
          toast.error(`Ошибка загрузки: ${error.message}`);
        }
      } finally {
        setLoading(false);
      }
    },
    [doctorId, tzid, makeKey]
  );

  const eventSources = useMemo(
    () => [{ id: "api", events: loadEvents, lazyFetching: true }],
    [loadEvents]
  );

  const refetchEvents = useCallback(() => {
    rangeCacheRef.current.clear();
    eventsCache.current = [];
    const api = calendarRef.current?.getApi?.();
    const src = api?.getEventSourceById?.("api");
    if (!src) return;
    if (refetchTimerRef.current) clearTimeout(refetchTimerRef.current);
    refetchTimerRef.current = setTimeout(() => src.refetch(), 120);
  }, []);

  /* ======== Валидация выделения (запрет прошлого и буфера) ======== */
  const selectAllow = useCallback(
    (selectInfo: { start: Date; end: Date }) => {
      const now = new Date();
      if (selectInfo.start < now) {
        return false;
      }
      if (hasUnavailabilityConflict(selectInfo.start, selectInfo.end, eventsCache.current)) {
        return false;
      }
      if (hasBufferViolation(selectInfo.start, selectInfo.end, eventsCache.current, bufferMin)) {
        return false;
      }
      return true;
    },
    [bufferMin]
  );

  /* ======== Валидация DnD/Resize ======== */
  const eventAllow = useCallback(
    (dropInfo: { start: Date; end: Date }, draggedEvent: { id: string; extendedProps?: { type?: string } } | null) => {
      const now = new Date();
      if (dropInfo.start < now) return false;

      const type = draggedEvent?.extendedProps?.type;
      if (type === "booking") return false;

      if (hasUnavailabilityConflict(dropInfo.start, dropInfo.end, eventsCache.current)) {
        return false;
      }
      if (hasBufferViolation(dropInfo.start, dropInfo.end, eventsCache.current, bufferMin, draggedEvent?.id)) {
        return false;
      }
      return true;
    },
    [bufferMin]
  );

  /* ======== создание по выделению ======== */
  const handleSelect = useCallback(
    (info: DateSelectArg) => {
      const now = new Date();
      if (info.start < now) {
        toast.error("Нельзя создать событие в прошлом");
        return;
      }
      if (hasUnavailabilityConflict(info.start, info.end, eventsCache.current)) {
        toast.error("Нельзя создать окно в период отпуска/выходного");
        return;
      }
      if (hasBufferViolation(info.start, info.end, eventsCache.current, bufferMin)) {
        const msg =
          bufferMin > 0
            ? `Нужен ${bufferMin}-минутный перерыв до/после соседнего приёма`
            : "Событие пересекается с другим";
        toast.error(msg);
        return;
      }

      const api = calendarRef.current?.getApi?.();
      api?.unselect();
      setSelection({ start: info.start, end: info.end });
      setWhichCreate("chooser");
    },
    [bufferMin]
  );

  /* ======== клик по событию ======== */
  const eventClick = useCallback((info: EventClickArg) => {
    const { extendedProps } = info.event;
    const type = extendedProps?.type as
      | "opening"
      | "exception"
      | "booking"
      | undefined;
    const backendId = extendedProps?.backendId as string;

    if (type === "booking") {
      setStatusTarget({
        id: backendId,
        current: (extendedProps?.status as BookingStatus) || "CONFIRMED",
      });
      return;
    }

    setEditTarget({
      type: type || "opening",
      id: backendId,
      start: info.event.start,
      end: info.event.end,
      title: info.event.title,
      reason: extendedProps?.reason as string | undefined,
    });
  }, []);

  /* ======== DnD / Resize ======== */
  const eventDrop = useCallback(
    async (info: EventDropArg) => {
      const { type, backendId } = info.event.extendedProps as {
        type: string;
        backendId: string;
      };
      if (!info.event.start || !info.event.end) {
        info.revert();
        return;
      }
      try {
        if (type === "opening") {
          await mutateOpening("update", {
            id: backendId,
            doctorId,
            start: info.event.start.toISOString(),
            end: info.event.end.toISOString(),
          });
          toast.success("Окно перемещено");
        } else if (type === "exception") {
          await mutateException("update", {
            id: backendId,
            doctorId,
            start: info.event.start.toISOString(),
            end: info.event.end.toISOString(),
          });
          toast.success("Перерыв перемещён");
        } else {
          info.revert();
          return;
        }
        refetchEvents();
      } catch (e) {
        info.revert();
        toast.error((e as Error).message);
      }
    },
    [doctorId, refetchEvents]
  );

  const eventResize = useCallback(
    async (info: any) => {
      const { type, backendId } = info.event.extendedProps as {
        type: string;
        backendId: string;
      };
      if (!info.event.start || !info.event.end) {
        info.revert();
        return;
      }
      try {
        if (type === "opening") {
          await mutateOpening("update", {
            id: backendId,
            doctorId,
            start: info.event.start.toISOString(),
            end: info.event.end.toISOString(),
          });
          toast.success("Окно изменено");
        } else if (type === "exception") {
          await mutateException("update", {
            id: backendId,
            doctorId,
            start: info.event.start.toISOString(),
            end: info.event.end.toISOString(),
          });
          toast.success("Перерыв изменён");
        } else {
          info.revert();
          return;
        }
        refetchEvents();
      } catch (e) {
        info.revert();
        toast.error((e as Error).message);
      }
    },
    [doctorId, refetchEvents]
  );

  // Шапка дней: выходные красные
  const dayHeaderContent = useCallback((arg: any) => {
    const day = arg.date.getUTCDay ? arg.date.getUTCDay() : arg.date.getDay();
    const isWeekend = day === 0 || day === 6;

    // Для мобильной недельной/дневной версии показываем простой формат как в макете
    if (isMobile && (arg.view.type === 'timeGridWeek' || arg.view.type === 'timeGridDay')) {
      const dayNames = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];
      const dayName = dayNames[day];
      const dayNum = arg.date.getDate();

      return {
        html: `<div class="mobile-week-header">
          <div class="week-day-name ${isWeekend ? "weekend" : ""}">${dayName}</div>
          <div class="week-day-num ${isWeekend ? "weekend" : ""}">${dayNum}</div>
        </div>`,
      };
    }

    return {
      html: `<span class="${isWeekend ? "fc-wknd" : "fc-wd"}">${arg.text}</span>`,
    };
  }, [isMobile]);

  // Классы для ячеек дня
  const dayCellClassNames = useCallback((arg: any) => {
    const d = arg.date.getUTCDay ? arg.date.getUTCDay() : arg.date.getDay();
    return [
      "cal-day",
      d === 0 || d === 6 ? "cal-wkend" : "cal-wday",
      arg.isOther ? "cal-other" : "",
      arg.isToday ? "cal-today" : "",
    ];
  }, []);

  // Навигация по месяцам для мобильной версии
  const handlePrevMonth = useCallback(() => {
    const api = calendarRef.current?.getApi();
    if (api) {
      api.prev();
    }
  }, []);

  const handleNextMonth = useCallback(() => {
    const api = calendarRef.current?.getApi();
    if (api) {
      api.next();
    }
  }, []);

  const handleToday = useCallback(() => {
    const api = calendarRef.current?.getApi();
    if (api) {
      api.today();
    }
  }, []);

  // Устанавливаем дневной вид для мобильных при загрузке
  useEffect(() => {
    if (!isMobile) return;

    const timer = setTimeout(() => {
      const api = calendarRef.current?.getApi();
      if (api) {
        api.changeView('timeGridDay');
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [isMobile]);

  // Получение текущего заголовка
  const [currentTitle, setCurrentTitle] = useState("");

  const handleDatesSet = useCallback((arg: any) => {
    setCurrentTitle(arg.view.title);
  }, []);

  return (
    <div className="min-h-screen bg-[#FFFCF3] pb-[clamp(4rem,3rem+4vw,6rem)]">
      <Toaster position="top-center" />
      <div className="mx-auto px-[clamp(0.75rem,0.5rem+1vw,1.5rem)] sm:px-6 lg:px-8 py-[clamp(1rem,0.5rem+2vw,2rem)]">
        {/* Десктопный заголовок */}
        {!isMobile && (
          <h1 className="text-2xl font-ManropeBold text-[#4F5338] mb-6">
            Управление расписанием
          </h1>
        )}

        <div className="rounded-[clamp(0.75rem,0.5rem+1vw,1.25rem)] border border-[#E8E2D5] bg-white overflow-hidden p-[clamp(0.5rem,0.25rem+1vw,1rem)] sm:p-4 lg:p-6">
          {/* Мобильный кастомный header */}
          {isMobile && (
            <div className="mb-4 space-y-3">
              <h1 className="text-lg font-ManropeBold text-[#4F5338]">
                Управление расписанием
              </h1>


              {/* Навигация по периоду */}
              <div className="flex items-center justify-between bg-[#F8F6F1] rounded-xl p-3">
                <button
                  onClick={handlePrevMonth}
                  className="p-2 hover:bg-white rounded-lg transition-colors active:scale-95"
                  aria-label="Назад"
                >
                  <svg className="w-5 h-5 text-[#4F5338]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>

                <button
                  onClick={handleToday}
                  className="text-center px-4 py-1 hover:bg-white rounded-lg transition-colors active:scale-95"
                >
                  <div className="text-base font-ManropeSemiBold text-[#4F5338]">
                    {currentTitle}
                  </div>
                  <div className="text-xs text-[#7c7467] font-ManropeRegular mt-0.5">
                    Нажмите для "Сегодня"
                  </div>
                </button>

                <button
                  onClick={handleNextMonth}
                  className="p-2 hover:bg-white rounded-lg transition-colors active:scale-95"
                  aria-label="Вперед"
                >
                  <svg className="w-5 h-5 text-[#4F5338]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>
          )}

          <FullCalendar
            ref={calendarRef}
            plugins={plugins}
            locales={locales}
            locale="ru"
            timeZone="Europe/Moscow"
            initialView="dayGridMonth"
            headerToolbar={headerToolbar}
            slotMinTime="07:00:00"
            slotMaxTime="22:00:00"
            slotDuration="00:15:00"
            slotLabelInterval="01:00:00"
            snapDuration="00:15:00"
            eventOverlap={false}
            allDaySlot={false}
            nowIndicator
            scrollTime="09:00:00"
            selectable
            selectAllow={selectAllow}
            eventAllow={eventAllow}
            selectMirror
            editable
            eventSources={eventSources}
            loading={(isLoading) => setLoading(isLoading)}
            eventClick={eventClick}
            eventDrop={eventDrop}
            eventResize={eventResize}
            select={handleSelect}
            height="auto"
            firstDay={1}
            dayHeaderContent={dayHeaderContent}
            dayCellClassNames={dayCellClassNames}
            contentHeight="auto"
            handleWindowResize={true}
            windowResizeDelay={100}
            datesSet={handleDatesSet}
          />
        </div>
      </div>

      {/* Выбор что создавать */}
      <Modal
        open={whichCreate === "chooser"}
        onClose={() => setWhichCreate(null)}
        title="Что создать?"
        footer={
          <>
            <button
              className="px-[clamp(1rem,0.8846rem+0.5128vw,1.5rem)] py-[clamp(0.75rem,0.6346rem+0.5128vw,1.25rem)] bg-[#5C6744] text-white rounded-[clamp(0.5rem,0.4423rem+0.2564vw,0.75rem)] text-[clamp(0.875rem,0.8077rem+0.2885vw,1.125rem)] font-ManropeMedium hover:bg-[#4F5938] transition-colors"
              onClick={() => setWhichCreate("opening")}
            >
              Окно приёма
            </button>
            <button
              className="px-[clamp(1rem,0.8846rem+0.5128vw,1.5rem)] py-[clamp(0.75rem,0.6346rem+0.5128vw,1.25rem)] bg-[#C74545] text-white rounded-[clamp(0.5rem,0.4423rem+0.2564vw,0.75rem)] text-[clamp(0.875rem,0.8077rem+0.2885vw,1.125rem)] font-ManropeMedium hover:bg-[#B03A3A] transition-colors"
              onClick={() => setWhichCreate("exception")}
            >
              Перерыв
            </button>
          </>
        }
      >
        <div className="text-[clamp(0.875rem,0.8077rem+0.2885vw,1.125rem)] font-ManropeRegular text-[#636846]">
          Выделено:{" "}
          <span className="font-ManropeMedium text-[#4F5338]">
            {selection ? dateToLocalInputValueTZ(selection.start, tzid) : ""}
          </span>
          {" — "}
          <span className="font-ManropeMedium text-[#4F5338]">
            {selection ? dateToLocalInputValueTZ(selection.end, tzid) : ""}
          </span>
        </div>
      </Modal>

      {/* Создание/редактирование окна */}
      <OpenFormModal
        open={
          whichCreate === "opening" ||
          (editTarget !== null && editTarget.type === "opening")
        }
        mode={editTarget ? "edit" : "create"}
        initialStart={editTarget ? editTarget.start : selection?.start}
        initialEnd={editTarget ? editTarget.end : selection?.end}
        tzid={tzid}
        onClose={() => {
          setWhichCreate(null);
          setEditTarget(null);
        }}
        onSubmit={async ({ startIso, endIso }) => {
          try {
            if (editTarget) {
              await mutateOpening("update", {
                id: editTarget.id,
                doctorId,
                start: startIso,
                end: endIso,
              });
              toast.success("Окно обновлено");
            } else {
              await mutateOpening("create", {
                doctorId,
                start: startIso,
                end: endIso,
              });
              toast.success("Окно создано");
            }
            setWhichCreate(null);
            setEditTarget(null);
            refetchEvents();
          } catch (e) {
            toast.error((e as Error).message || "Не удалось сохранить окно");
          }
        }}
        onDelete={
          editTarget
            ? async () => {
                try {
                  await mutateOpening("delete", { id: editTarget.id, doctorId });
                  toast.success("Окно удалено");
                  setEditTarget(null);
                  refetchEvents();
                } catch (e) {
                  toast.error((e as Error).message || "Не удалось удалить окно");
                }
              }
            : null
        }
      />

      {/* Создание/редактирование перерыва */}
      <ExceptionFormModal
        open={
          whichCreate === "exception" ||
          (editTarget !== null && editTarget.type === "exception")
        }
        mode={editTarget ? "edit" : "create"}
        initialStart={editTarget ? editTarget.start : selection?.start}
        initialEnd={editTarget ? editTarget.end : selection?.end}
        initialReason={
          editTarget?.reason || editTarget?.title?.replace(/^Перерыв:\s*/, "") || ""
        }
        tzid={tzid}
        onClose={() => {
          setWhichCreate(null);
          setEditTarget(null);
        }}
        onSubmit={async ({ startIso, endIso, reason }) => {
          try {
            if (editTarget) {
              await mutateException("update", {
                id: editTarget.id,
                doctorId,
                start: startIso,
                end: endIso,
                reason,
              });
              toast.success("Перерыв обновлён");
            } else {
              await mutateException("create", {
                doctorId,
                start: startIso,
                end: endIso,
                reason,
              });
              toast.success("Перерыв создан");
            }
            setWhichCreate(null);
            setEditTarget(null);
            refetchEvents();
          } catch (e) {
            toast.error(
              (e as Error).message || "Не удалось сохранить перерыв"
            );
          }
        }}
        onDelete={
          editTarget
            ? async () => {
                try {
                  await mutateException("delete", { id: editTarget.id, doctorId });
                  toast.success("Перерыв удалён");
                  setEditTarget(null);
                  refetchEvents();
                } catch (e) {
                  toast.error(
                    (e as Error).message || "Не удалось удалить перерыв"
                  );
                }
              }
            : null
        }
      />

      {/* Смена статуса брони */}
      <StatusModal
        open={Boolean(statusTarget)}
        current={statusTarget?.current || "CONFIRMED"}
        onClose={() => setStatusTarget(null)}
        onSubmit={async (status) => {
          try {
            await postJson("/api/doctor/bookings/status", {
              bookingId: statusTarget!.id,
              nextStatus: status,
            });
            toast.success("Статус обновлён");
            setStatusTarget(null);
            refetchEvents();
          } catch (e) {
            toast.error(
              (e as Error).message || "Не удалось обновить статус"
            );
          }
        }}
      />

      {/* Глобальные стили для ультра адаптивности */}
      <style jsx global>{`
        /* Общий фон и бордеры сетки */
        .fc .fc-scrollgrid,
        .fc .fc-scrollgrid-section,
        .fc .fc-scrollgrid-sync-table {
          background: #fff;
        }
        .fc-theme-standard td,
        .fc-theme-standard th {
          border-color: #eee6da;
        }

        /* Тулбар - адаптивный */
        .fc .fc-toolbar {
          padding: clamp(0.5rem, 0.25rem + 1vw, 1rem);
          flex-wrap: wrap;
          gap: clamp(0.5rem, 0.25rem + 1vw, 1rem);
        }

        .fc .fc-toolbar-chunk {
          display: flex;
          align-items: center;
          gap: clamp(0.25rem, 0.125rem + 0.5vw, 0.5rem);
          flex-wrap: wrap;
        }

        .fc .fc-toolbar-title {
          color: #4f5338;
          font-family: Manrope, ui-sans-serif, system-ui;
          font-weight: 600;
          font-size: clamp(0.875rem, 0.75rem + 0.5vw, 1.25rem);
          white-space: nowrap;
        }

        /* Кнопки - адаптивные */
        .fc .fc-prev-button,
        .fc .fc-next-button,
        .fc .fc-today-button,
        .fc .fc-dayGridMonth-button,
        .fc .fc-timeGridWeek-button,
        .fc .fc-timeGridDay-button {
          background: transparent;
          border: 1px solid #e6dfd3;
          color: #6b6e51;
          border-radius: clamp(0.375rem, 0.25rem + 0.5vw, 0.625rem);
          padding: clamp(0.375rem, 0.25rem + 0.5vw, 0.625rem) clamp(0.5rem, 0.375rem + 0.5vw, 0.875rem);
          font-size: clamp(0.75rem, 0.625rem + 0.5vw, 0.875rem);
          font-family: Manrope, ui-sans-serif, system-ui;
          transition: all 0.2s;
          white-space: nowrap;
          min-height: 2rem;
          touch-action: manipulation;
        }

        .fc .fc-prev-button:hover,
        .fc .fc-next-button:hover,
        .fc .fc-today-button:hover,
        .fc .fc-dayGridMonth-button:hover,
        .fc .fc-timeGridWeek-button:hover,
        .fc .fc-timeGridDay-button:hover {
          background: #fbf6ea;
          border-color: #a0a47a;
        }

        .fc .fc-button-active {
          background: #a0a47a !important;
          color: #fff !important;
          border-color: #a0a47a !important;
        }

        .fc .fc-toolbar .fc-button-group {
          gap: clamp(0.25rem, 0.125rem + 0.25vw, 0.375rem);
          flex-wrap: wrap;
        }

        /* Мобильная оптимизация - минималистичный стиль */
        @media (max-width: 640px) {
          /* Скрываем стандартный тулбар */
          .fc .fc-toolbar {
            display: none;
          }

          /* Контейнер календаря */
          .fc {
            scroll-behavior: smooth;
          }

          /* Минималистичный стиль ячеек */
          .fc .fc-daygrid-day-frame {
            padding: 0.5rem 0.25rem;
            background: transparent;
          }

          /* Упрощенные номера дней */
          .fc .fc-daygrid-day-number {
            padding: 0.5rem;
            font-size: 0.875rem;
            font-weight: 500;
            width: 100%;
            text-align: center;
          }

          /* Минималистичные границы */
          .fc-theme-standard td {
            border: none;
            border-bottom: 1px solid #f5f0e4;
          }

          .fc-theme-standard th {
            border: none;
            border-bottom: 2px solid #e8e2d5;
          }

          /* Убираем лишние отступы */
          .fc .fc-daygrid-day-top {
            justify-content: center;
          }

          /* Компактные ячейки */
          .cal-day {
            min-height: 3rem;
          }

          /* Скругление только у контейнера */
          .fc .fc-daygrid-day-frame {
            border-radius: 0;
          }

          /* События компактнее */
          .fc .fc-daygrid-event {
            margin: 0.125rem 0;
            padding: 0.125rem 0.25rem;
            font-size: 0.625rem;
          }
        }

        /* Шапка дней - адаптивная */
        .fc .fc-col-header-cell-cushion {
          padding: clamp(0.5rem, 0.375rem + 0.5vw, 0.875rem) 0;
          font-family: Manrope, ui-sans-serif, system-ui;
          font-size: clamp(0.75rem, 0.625rem + 0.5vw, 1rem);
          color: #4f5338;
        }

        /* Мобильная шапка дней */
        @media (max-width: 640px) {
          .fc .fc-col-header-cell-cushion {
            padding: 0.75rem 0;
            font-size: 0.75rem;
            font-weight: 400;
            color: #7c7467;
          }

          .fc-wknd {
            color: #d35a5a;
          }

          .fc .fc-col-header-cell {
            background: transparent;
          }

          /* Современный заголовок для недельного вида */
          .mobile-week-header {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 0.375rem;
            padding: 0.875rem 0.5rem;
            width: 100%;
            background: transparent;
          }

          .mobile-week-header .week-day-name {
            font-size: 0.8rem;
            font-weight: 600;
            color: #6B7280;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            line-height: 1;
          }

          .mobile-week-header .week-day-num {
            font-size: 1.25rem;
            font-weight: 700;
            color: #4F5338;
            line-height: 1;
          }

          .mobile-week-header .week-day-name.weekend {
            color: #EF4444;
          }

          .mobile-week-header .week-day-num.weekend {
            color: #EF4444;
          }
        }

        .fc-wknd {
          color: #d35a5a;
        }
        .fc-wd {
          color: #4f5338;
        }

        /* Ячейки месяца - адаптивные */
        .cal-day {
          background: #fff;
          min-height: clamp(3rem, 2rem + 4vw, 5rem);
        }

        .cal-other {
          background: #f5f5f5;
          color: #a0a0a0;
        }

        .cal-today .fc-daygrid-day-frame {
          box-shadow: inset 0 0 0 2px #a0a47a;
          border-radius: clamp(0.375rem, 0.25rem + 0.5vw, 0.625rem);
        }

        .fc .fc-daygrid-day-frame {
          padding: clamp(0.25rem, 0.125rem + 0.5vw, 0.5rem);
          border-radius: clamp(0.375rem, 0.25rem + 0.5vw, 0.625rem);
          min-height: clamp(2.5rem, 2rem + 2vw, 4rem);
        }

        .fc .fc-daygrid-day-top {
          flex-direction: row;
          align-items: center;
          gap: clamp(0.25rem, 0.125rem + 0.25vw, 0.375rem);
        }

        .fc .fc-daygrid-day-number {
          color: #4f5338;
          font-weight: 600;
          font-size: clamp(0.75rem, 0.625rem + 0.5vw, 0.875rem);
          padding: clamp(0.25rem, 0.125rem + 0.25vw, 0.375rem) clamp(0.375rem, 0.25rem + 0.5vw, 0.5rem);
          border-radius: clamp(0.25rem, 0.125rem + 0.25vw, 0.375rem);
        }

        /* События - адаптивные */
        .fc .fc-daygrid-event {
          margin: clamp(0.125rem, 0.0625rem + 0.25vw, 0.25rem) 0;
          border-radius: clamp(0.25rem, 0.125rem + 0.25vw, 0.375rem);
          padding: clamp(0.125rem, 0.0625rem + 0.25vw, 0.25rem) clamp(0.25rem, 0.125rem + 0.5vw, 0.5rem);
          border: 1px solid transparent;
          line-height: 1.2;
        }

        .fc .fc-event-title {
          font-size: clamp(0.625rem, 0.5rem + 0.5vw, 0.75rem);
          font-weight: 600;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .fc .fc-event-time {
          font-size: clamp(0.625rem, 0.5rem + 0.5vw, 0.75rem);
          font-weight: 600;
        }

        /* Мобильная оптимизация событий */
        @media (max-width: 640px) {
          .fc .fc-daygrid-event {
            font-size: 0.625rem;
            border-radius: 0.25rem;
          }

          .fc .fc-daygrid-event .fc-event-time {
            display: none;
          }

          .fc .fc-daygrid-event .fc-event-title {
            font-size: 0.625rem;
            text-overflow: ellipsis;
            overflow: hidden;
            white-space: nowrap;
          }

          .fc .fc-daygrid-day-events {
            margin-top: 0.125rem;
          }

          .fc .fc-daygrid-more-link {
            font-size: 0.625rem;
            padding: 0.125rem 0.25rem;
            background: transparent;
            color: #7c7467;
            text-decoration: underline;
          }

          /* Скрываем события за пределами ячейки на мобильных */
          .fc .fc-daygrid-day-bottom {
            margin-top: 0.25rem;
          }
        }

        /* Окна приёма — зелёные */
        .fc-event[style*="background-color: #DCFCE7"] {
          background-color: #e8f6e8 !important;
          border-color: #b7e3b7 !important;
          color: #39623f !important;
        }

        /* Перерывы — светло-красные */
        .fc-event[style*="background-color: #FEE2E2"] {
          background-color: #fdeaea !important;
          border-color: #f2c8c8 !important;
          color: #a24b4b !important;
        }

        /* timeGrid - адаптивный */
        .fc .fc-timegrid-slot {
          height: clamp(1.5rem, 1.25rem + 1vw, 2rem);
        }

        /* Узкая колонка времени для всех экранов */
        .fc .fc-timegrid-axis {
          width: 2.5rem !important;
          max-width: 2.5rem !important;
        }

        .fc .fc-timegrid-axis-cushion,
        .fc .fc-timegrid-slot-label {
          color: #9CA3AF;
          font-size: 0.7rem;
          padding: 0 0.25rem;
          font-weight: 500;
        }

        .fc .fc-timegrid-slot-label-cushion {
          text-align: right;
        }

        .fc .fc-timegrid-col-frame {
          min-width: clamp(2.5rem, 2rem + 2vw, 4rem);
        }

        /* Мобильная оптимизация timeGrid (неделя/день) */
        @media (max-width: 640px) {
          .fc .fc-timegrid-slot {
            height: 3.5rem;
          }

          /* УЗКАЯ колонка времени для мобильных */
          .fc-timegrid .fc-timegrid-axis,
          .fc .fc-timegrid-axis {
            width: 2.5rem !important;
            max-width: 2.5rem !important;
            min-width: 2.5rem !important;
          }

          .fc .fc-timegrid-axis-cushion,
          .fc .fc-timegrid-slot-label {
            font-size: 0.7rem !important;
            padding: 0 0.25rem !important;
            color: #9CA3AF !important;
            font-weight: 500 !important;
          }

          .fc .fc-timegrid-slot-label-cushion {
            padding: 0 0.25rem !important;
            text-align: right !important;
            font-size: 0.7rem !important;
          }

          .fc .fc-timegrid-col-frame {
            min-width: auto;
          }

          /* Красивые события с текстом для широких колонок */
          .fc .fc-timegrid-event {
            padding: 0.5rem 0.625rem;
            min-height: auto;
            border-radius: 0.5rem;
            border-width: 0;
            cursor: pointer;
            transition: all 0.2s ease;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
          }

          .fc .fc-timegrid-event:hover {
            transform: translateY(-1px);
            box-shadow: 0 2px 6px rgba(0, 0, 0, 0.12);
          }

          .fc .fc-timegrid-event .fc-event-main {
            display: flex;
            flex-direction: column;
            gap: 0.125rem;
            padding: 0;
          }

          .fc .fc-timegrid-event .fc-event-time {
            font-size: 0.75rem;
            font-weight: 700;
            line-height: 1.2;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }

          .fc .fc-timegrid-event .fc-event-title {
            font-size: 0.8rem;
            font-weight: 500;
            line-height: 1.3;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }

          .fc .fc-timegrid-event .fc-event-title-container {
            overflow: hidden;
          }

          /* Оптимизация колонок */
          .fc .fc-col-header-cell-cushion {
            padding: 0.5rem 0.25rem;
          }

          /* Ширина колонок для недельного вида - максимально широкие для скролла */
          .fc-timegrid .fc-col-header-cell {
            min-width: 8rem;
            width: 8rem;
          }

          .fc-timegrid .fc-timegrid-col {
            min-width: 8rem;
            width: 8rem;
          }

          /* Простой горизонтальный скролл */
          .fc .fc-scroller {
            overflow-x: auto !important;
            overflow-y: auto !important;
            -webkit-overflow-scrolling: touch;
          }

          .fc .fc-scroller-harness {
            overflow: auto !important;
          }

          /* Таблицы растягиваются на полную ширину колонок */
          .fc .fc-timegrid-body table,
          .fc .fc-col-header table {
            width: auto !important;
            min-width: 100%;
          }

          /* Убираем лишние границы */
          .fc .fc-timegrid-divider {
            display: none;
          }

          /* Полностью скрываем allDay слот в мобильном недельном виде */
          .fc-timegrid .fc-daygrid-body {
            display: none !important;
          }

          .fc-timegrid .fc-day-header-row {
            display: none !important;
          }

          .fc .fc-timegrid-body .fc-daygrid-day-events {
            display: none !important;
          }

          .fc .fc-col-header-cell .fc-daygrid-day-events {
            display: none !important;
          }

          /* Современный стиль заголовков */
          .fc .fc-col-header {
            border: none;
            background: linear-gradient(to bottom, #FAFAFA, #F8F8F8);
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
          }

          .fc .fc-timegrid .fc-col-header-cell {
            padding: 0;
            background: transparent;
            border: none;
            border-right: 1px solid #ECECEC;
          }

          .fc .fc-timegrid .fc-col-header-cell:last-child {
            border-right: none;
          }

          .fc .fc-timegrid .fc-col-header-cell-cushion {
            padding: 0 !important;
          }

          /* Чистая сетка времени */
          .fc .fc-scrollgrid {
            border: none;
            border-radius: 0.75rem;
            overflow: hidden;
          }

          .fc .fc-timegrid-slots table {
            background: white;
          }

          /* Скругления для контейнера календаря */
          .fc .fc-view-harness {
            border-radius: 0.75rem;
            overflow: hidden;
            background: white;
          }

          .fc-theme-standard td,
          .fc-theme-standard th {
            border-color: #F0F0F0;
          }

          .fc .fc-timegrid-col {
            border-right: 1px solid #ECECEC;
            background: white;
          }

          .fc .fc-timegrid-col:last-child {
            border-right: none;
          }

          .fc .fc-timegrid-slot {
            border-top: 1px solid #F8F8F8;
          }

          /* Компактный вид событий в timeGrid */
          .fc .fc-timegrid-event-harness {
            margin: 0.125rem 0.375rem;
          }

          /* Убираем ограничения по overflow для событий */
          .fc .fc-timegrid-event-harness-inset {
            top: 0.125rem;
            bottom: 0.125rem;
          }

          .fc-direction-ltr .fc-timegrid-col-events {
            margin: 0 0.375rem 0 0;
          }

          /* Оптимизация отображения коротких событий */
          .fc .fc-timegrid-event-short .fc-event-main {
            flex-grow: 1;
            overflow: visible;
          }

          .fc .fc-timegrid-event-short .fc-event-time {
            display: block !important;
          }

          .fc .fc-timegrid-event-short .fc-event-title {
            display: block !important;
            font-size: 0.75rem;
          }

          /* Улучшение читаемости времени */
          .fc .fc-timegrid-now-indicator-line {
            border-color: #d35a5a;
            border-width: 2px;
          }

          .fc .fc-timegrid-now-indicator-arrow {
            border-color: #d35a5a;
          }
        }

        /* Улучшение touch взаимодействия */
        .fc .fc-event {
          cursor: pointer;
          touch-action: manipulation;
        }

        .fc .fc-daygrid-day-frame {
          cursor: pointer;
          touch-action: manipulation;
        }

        /* Скрытие overflow для мобильных */
        @media (max-width: 640px) {
          .fc .fc-scrollgrid {
            overflow-x: auto;
            -webkit-overflow-scrolling: touch;
          }

          .fc table {
            min-width: 100%;
          }
        }

        /* Адаптивная высота календаря */
        .fc .fc-view-harness {
          min-height: clamp(20rem, 15rem + 20vw, 40rem);
        }

        /* Loading состояние */
        .fc .fc-loading-indicator {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          z-index: 999;
        }
      `}</style>
    </div>
  );
}

/* ===============================
   Модалки-формы
   =============================== */
function OpenFormModal({
  open,
  mode,
  initialStart,
  initialEnd,
  tzid,
  onClose,
  onSubmit,
  onDelete,
}: OpenFormModalProps) {
  const form = useForm({
    resolver: zodResolver(openingSchema),
    defaultValues: {
      startLocal: initialStart ? dateToLocalInputValueTZ(initialStart, tzid) : "",
      endLocal: initialEnd ? dateToLocalInputValueTZ(initialEnd, tzid) : "",
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        startLocal: initialStart ? dateToLocalInputValueTZ(initialStart, tzid) : "",
        endLocal: initialEnd ? dateToLocalInputValueTZ(initialEnd, tzid) : "",
      });
    }
  }, [open, initialStart, initialEnd, tzid, form]);

  const submit = form.handleSubmit(async (vals) => {
    const startIso = localValueTZToISOString(vals.startLocal, tzid);
    const endIso = localValueTZToISOString(vals.endLocal, tzid);
    await onSubmit({ startIso, endIso });
  });

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={mode === "edit" ? "Редактирование окна" : "Новое окно приёма"}
      footer={
        <>
          {onDelete && (
            <button
              onClick={onDelete}
              className="px-[clamp(1rem,0.8846rem+0.5128vw,1.5rem)] py-[clamp(0.75rem,0.6346rem+0.5128vw,1.25rem)] bg-[#C74545] text-white rounded-[clamp(0.5rem,0.4423rem+0.2564vw,0.75rem)] text-[clamp(0.875rem,0.8077rem+0.2885vw,1.125rem)] font-ManropeMedium hover:bg-[#B03A3A] transition-colors"
            >
              Удалить
            </button>
          )}
          <button
            onClick={onClose}
            className="px-[clamp(1rem,0.8846rem+0.5128vw,1.5rem)] py-[clamp(0.75rem,0.6346rem+0.5128vw,1.25rem)] bg-[#F5F0E4] text-[#967450] rounded-[clamp(0.5rem,0.4423rem+0.2564vw,0.75rem)] text-[clamp(0.875rem,0.8077rem+0.2885vw,1.125rem)] font-ManropeMedium hover:bg-[#E8E2D5] transition-colors"
          >
            Отмена
          </button>
          <button
            onClick={submit}
            className="px-[clamp(1rem,0.8846rem+0.5128vw,1.5rem)] py-[clamp(0.75rem,0.6346rem+0.5128vw,1.25rem)] bg-[#5C6744] text-white rounded-[clamp(0.5rem,0.4423rem+0.2564vw,0.75rem)] text-[clamp(0.875rem,0.8077rem+0.2885vw,1.125rem)] font-ManropeMedium hover:bg-[#4F5938] transition-colors"
          >
            {mode === "edit" ? "Сохранить" : "Создать"}
          </button>
        </>
      }
    >
      <FormRow label="Начало (в часах клиники)">
        <input
          type="datetime-local"
          className="w-full px-[clamp(1rem,0.8846rem+0.5128vw,1.5rem)] py-[clamp(0.75rem,0.6346rem+0.5128vw,1.25rem)] bg-[#F5F0E4] border-none rounded-[clamp(0.5rem,0.4423rem+0.2564vw,0.75rem)] text-[clamp(0.875rem,0.8077rem+0.2885vw,1.125rem)] font-ManropeRegular text-[#4F5338] focus:outline-none focus:ring-2 focus:ring-[#967450]"
          {...form.register("startLocal")}
        />
        <ErrorText msg={form.formState.errors.startLocal?.message} />
      </FormRow>
      <FormRow label="Конец (в часах клиники)">
        <input
          type="datetime-local"
          className="w-full px-[clamp(1rem,0.8846rem+0.5128vw,1.5rem)] py-[clamp(0.75rem,0.6346rem+0.5128vw,1.25rem)] bg-[#F5F0E4] border-none rounded-[clamp(0.5rem,0.4423rem+0.2564vw,0.75rem)] text-[clamp(0.875rem,0.8077rem+0.2885vw,1.125rem)] font-ManropeRegular text-[#4F5338] focus:outline-none focus:ring-2 focus:ring-[#967450]"
          {...form.register("endLocal")}
        />
        <ErrorText msg={form.formState.errors.endLocal?.message} />
      </FormRow>
    </Modal>
  );
}

function ExceptionFormModal({
  open,
  mode,
  initialStart,
  initialEnd,
  initialReason,
  tzid,
  onClose,
  onSubmit,
  onDelete,
}: ExceptionFormModalProps) {
  const form = useForm({
    resolver: zodResolver(exceptionSchema),
    defaultValues: {
      startLocal: initialStart ? dateToLocalInputValueTZ(initialStart, tzid) : "",
      endLocal: initialEnd ? dateToLocalInputValueTZ(initialEnd, tzid) : "",
      reason: initialReason || "",
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        startLocal: initialStart ? dateToLocalInputValueTZ(initialStart, tzid) : "",
        endLocal: initialEnd ? dateToLocalInputValueTZ(initialEnd, tzid) : "",
        reason: initialReason || "",
      });
    }
  }, [open, initialStart, initialEnd, initialReason, tzid, form]);

  const submit = form.handleSubmit(async (vals) => {
    const startIso = localValueTZToISOString(vals.startLocal, tzid);
    const endIso = localValueTZToISOString(vals.endLocal, tzid);
    await onSubmit({
      startIso,
      endIso,
      reason: vals.reason?.trim() || undefined,
    });
  });

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={mode === "edit" ? "Редактирование перерыва" : "Новый перерыв"}
      footer={
        <>
          {onDelete && (
            <button
              onClick={onDelete}
              className="px-[clamp(1rem,0.8846rem+0.5128vw,1.5rem)] py-[clamp(0.75rem,0.6346rem+0.5128vw,1.25rem)] bg-[#C74545] text-white rounded-[clamp(0.5rem,0.4423rem+0.2564vw,0.75rem)] text-[clamp(0.875rem,0.8077rem+0.2885vw,1.125rem)] font-ManropeMedium hover:bg-[#B03A3A] transition-colors"
            >
              Удалить
            </button>
          )}
          <button
            onClick={onClose}
            className="px-[clamp(1rem,0.8846rem+0.5128vw,1.5rem)] py-[clamp(0.75rem,0.6346rem+0.5128vw,1.25rem)] bg-[#F5F0E4] text-[#967450] rounded-[clamp(0.5rem,0.4423rem+0.2564vw,0.75rem)] text-[clamp(0.875rem,0.8077rem+0.2885vw,1.125rem)] font-ManropeMedium hover:bg-[#E8E2D5] transition-colors"
          >
            Отмена
          </button>
          <button
            onClick={submit}
            className="px-[clamp(1rem,0.8846rem+0.5128vw,1.5rem)] py-[clamp(0.75rem,0.6346rem+0.5128vw,1.25rem)] bg-[#5C6744] text-white rounded-[clamp(0.5rem,0.4423rem+0.2564vw,0.75rem)] text-[clamp(0.875rem,0.8077rem+0.2885vw,1.125rem)] font-ManropeMedium hover:bg-[#4F5938] transition-colors"
          >
            {mode === "edit" ? "Сохранить" : "Создать"}
          </button>
        </>
      }
    >
      <FormRow label="Начало (в часах клиники)">
        <input
          type="datetime-local"
          className="w-full px-[clamp(1rem,0.8846rem+0.5128vw,1.5rem)] py-[clamp(0.75rem,0.6346rem+0.5128vw,1.25rem)] bg-[#F5F0E4] border-none rounded-[clamp(0.5rem,0.4423rem+0.2564vw,0.75rem)] text-[clamp(0.875rem,0.8077rem+0.2885vw,1.125rem)] font-ManropeRegular text-[#4F5338] focus:outline-none focus:ring-2 focus:ring-[#967450]"
          {...form.register("startLocal")}
        />
        <ErrorText msg={form.formState.errors.startLocal?.message} />
      </FormRow>
      <FormRow label="Конец (в часах клиники)">
        <input
          type="datetime-local"
          className="w-full px-[clamp(1rem,0.8846rem+0.5128vw,1.5rem)] py-[clamp(0.75rem,0.6346rem+0.5128vw,1.25rem)] bg-[#F5F0E4] border-none rounded-[clamp(0.5rem,0.4423rem+0.2564vw,0.75rem)] text-[clamp(0.875rem,0.8077rem+0.2885vw,1.125rem)] font-ManropeRegular text-[#4F5338] focus:outline-none focus:ring-2 focus:ring-[#967450]"
          {...form.register("endLocal")}
        />
        <ErrorText msg={form.formState.errors.endLocal?.message} />
      </FormRow>
      <FormRow label="Причина (опционально)">
        <input
          type="text"
          className="w-full px-[clamp(1rem,0.8846rem+0.5128vw,1.5rem)] py-[clamp(0.75rem,0.6346rem+0.5128vw,1.25rem)] bg-[#F5F0E4] border-none rounded-[clamp(0.5rem,0.4423rem+0.2564vw,0.75rem)] text-[clamp(0.875rem,0.8077rem+0.2885vw,1.125rem)] font-ManropeRegular text-[#4F5338] placeholder:text-[#636846] focus:outline-none focus:ring-2 focus:ring-[#967450]"
          placeholder="Обед / совещание / кабинет занят…"
          {...form.register("reason")}
        />
        <ErrorText msg={form.formState.errors.reason?.message} />
      </FormRow>
    </Modal>
  );
}

function StatusModal({ open, current, onClose, onSubmit }: StatusModalProps) {
  const form = useForm({
    resolver: zodResolver(statusSchema) as any,
    defaultValues: { status: current },
  });

  useEffect(() => {
    if (open) form.reset({ status: current });
  }, [open, current, form]);

  const submit = form.handleSubmit(async (vals) =>
    onSubmit(vals.status as BookingStatus)
  );

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Смена статуса записи"
      footer={
        <>
          <button
            onClick={onClose}
            className="px-[clamp(1rem,0.8846rem+0.5128vw,1.5rem)] py-[clamp(0.75rem,0.6346rem+0.5128vw,1.25rem)] bg-[#F5F0E4] text-[#967450] rounded-[clamp(0.5rem,0.4423rem+0.2564vw,0.75rem)] text-[clamp(0.875rem,0.8077rem+0.2885vw,1.125rem)] font-ManropeMedium hover:bg-[#E8E2D5] transition-colors"
          >
            Отмена
          </button>
          <button
            onClick={submit}
            className="px-[clamp(1rem,0.8846rem+0.5128vw,1.5rem)] py-[clamp(0.75rem,0.6346rem+0.5128vw,1.25rem)] bg-[#5C6744] text-white rounded-[clamp(0.5rem,0.4423rem+0.2564vw,0.75rem)] text-[clamp(0.875rem,0.8077rem+0.2885vw,1.125rem)] font-ManropeMedium hover:bg-[#4F5938] transition-colors"
          >
            Сохранить
          </button>
        </>
      }
    >
      <div className="space-y-[clamp(0.75rem,0.6346rem+0.5128vw,1.25rem)]">
        {[
          ["CONFIRMED", "Подтверждено"],
          ["CANCELED", "Отменено"],
          ["COMPLETED", "Завершено"],
          ["NO_SHOW", "Не пришёл"],
        ].map(([val, label]) => (
          <label key={val} className="flex items-center gap-[clamp(0.75rem,0.6346rem+0.5128vw,1.25rem)] cursor-pointer group">
            <input
              type="radio"
              value={val}
              {...form.register("status")}
              className="w-[clamp(1.125rem,1.0096rem+0.5128vw,1.625rem)] h-[clamp(1.125rem,1.0096rem+0.5128vw,1.625rem)] text-[#5C6744] focus:ring-[#967450] focus:ring-2 cursor-pointer"
            />
            <span className="text-[clamp(0.875rem,0.8077rem+0.2885vw,1.125rem)] font-ManropeRegular text-[#4F5338] group-hover:text-[#5C6744] transition-colors">
              {label}
            </span>
          </label>
        ))}
      </div>
    </Modal>
  );
}

/* ===============================
   Мелочи UI
   =============================== */
function FormRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-[clamp(0.875rem,0.8077rem+0.2885vw,1.125rem)] font-ManropeMedium text-[#4F5338] mb-[clamp(0.5rem,0.4423rem+0.2564vw,0.75rem)]">
        {label}
      </label>
      {children}
    </div>
  );
}

function ErrorText({ msg }: { msg?: string }) {
  if (!msg) return null;
  return (
    <p className="mt-[clamp(0.25rem,0.2115rem+0.1731vw,0.5rem)] text-[clamp(0.75rem,0.6923rem+0.2564vw,1rem)] font-ManropeRegular text-[#C74545]">
      {msg}
    </p>
  );
}

/* ===============================
   Helpers для booking
   =============================== */
function bookingTitle(b: ApiBooking): string {
  const base = (b as any)?.title || "Запись";
  const who = (b as any)?.clientName || (b as any)?.clientEmail || "";
  const status = (b as any)?.status ? ` [${humanStatus((b as any).status)}]` : "";
  return `${base}${who ? " — " + who : ""}${status}`;
}

function humanStatus(s: BookingStatus): string {
  switch (s) {
    case "PENDING":
      return "ожидание";
    case "CONFIRMED":
      return "подтверждено";
    case "CANCELED":
      return "отменено";
    case "COMPLETED":
      return "завершено";
    case "NO_SHOW":
      return "не пришёл";
    default:
      return (s as string) || "";
  }
}

function bookingColor(s: BookingStatus): string {
  switch (s) {
    case "PENDING":
      return "#FEF9C3";
    case "CONFIRMED":
      return "#DBEAFE";
    case "CANCELED":
      return "#F3F4F6";
    case "COMPLETED":
      return "#D1FAE5";
    case "NO_SHOW":
      return "#FCE7F3";
    default:
      return "#E5E7EB";
  }
}

function bookingBorder(s: BookingStatus): string {
  switch (s) {
    case "PENDING":
      return "#F59E0B";
    case "CONFIRMED":
      return "#2563EB";
    case "CANCELED":
      return "#6B7280";
    case "COMPLETED":
      return "#10B981";
    case "NO_SHOW":
      return "#DB2777";
    default:
      return "#9CA3AF";
  }
}
