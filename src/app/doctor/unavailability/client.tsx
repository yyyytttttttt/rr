"use client";
import React, { useState, useEffect, useCallback } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import toast, { Toaster } from "react-hot-toast";
import { format, addDays, startOfMonth, endOfMonth } from "date-fns";

// ================= Типы =================

type UnavailabilityType = "VACATION" | "DAY_OFF" | "NO_BOOKINGS";

interface Unavailability {
  id: string;
  parentId?: string;
  type: UnavailabilityType;
  tzid: string;
  start: string; // ISO
  end: string; // ISO
  reason?: string | null;
  isRecurring: boolean;
  rrule?: string | null;
  createdBy?: string | null;
  createdAt?: string;
}

interface ClientUnavailabilityProps {
  doctorId: string;
  doctorName: string;
  doctorTzid: string;
  userRole: string;
}

// ================= Схемы валидации =================

const createUnavailabilitySchema = z.object({
  type: z.enum(["VACATION", "DAY_OFF", "NO_BOOKINGS"]),
  startDate: z.string().min(1, "Укажите дату начала"),
  startTime: z.string().regex(/^\d{2}:\d{2}$/),
  endDate: z.string().min(1, "Укажите дату окончания"),
  endTime: z.string().regex(/^\d{2}:\d{2}$/),
  reason: z.string().max(500).optional(),
  isRecurring: z.boolean(),
  recurringFreq: z.enum(["WEEKLY", "MONTHLY"]).optional(),
  recurringDays: z.array(z.string()).optional(), // ["MO", "TU", ...]
  recurringMonthDays: z.array(z.number()).optional(), // [1, 15, ...]
  recurringCount: z.number().min(1).optional(),
  recurringUntil: z.string().optional(),
  cancelPending: z.boolean().optional(),
});

// ================= Константы =================

const TYPE_LABELS: Record<UnavailabilityType, string> = {
  VACATION: "Отпуск",
  DAY_OFF: "Выходной",
  NO_BOOKINGS: "День без записей (админ)",
};

const TYPE_COLORS: Record<UnavailabilityType, string> = {
  VACATION: "bg-[#E8F3E8] border-[#5C6744]",
  DAY_OFF: "bg-[#FFF5E8] border-[#967450]",
  NO_BOOKINGS: "bg-[#FFE5E5] border-[#C63D3D]",
};

const WEEKDAY_OPTIONS = [
  { code: "MO", label: "Пн" },
  { code: "TU", label: "Вт" },
  { code: "WE", label: "Ср" },
  { code: "TH", label: "Чт" },
  { code: "FR", label: "Пт" },
  { code: "SA", label: "Сб" },
  { code: "SU", label: "Вс" },
];

// ================= Главный компонент =================

export default function ClientUnavailability({
  doctorId,
  doctorName,
  doctorTzid,
  userRole,
}: ClientUnavailabilityProps) {
  const [unavailabilities, setUnavailabilities] = useState<Unavailability[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [quickCreateType, setQuickCreateType] = useState<UnavailabilityType | null>(null);

  const isAdmin = userRole === "ADMIN";

  // Загрузка блокировок
  const loadUnavailabilities = useCallback(async () => {
    try {
      setLoading(true);
      // Загружаем на месяц вперёд и назад
      const from = format(addDays(new Date(), -30), "yyyy-MM-dd");
      const to = format(addDays(new Date(), 90), "yyyy-MM-dd");

      const res = await fetch(
        `/api/unavailability?doctorId=${encodeURIComponent(doctorId)}&from=${from}&to=${to}`
      );
      const data = await res.json();

      if (res.ok) {
        setUnavailabilities(data.unavailabilities || []);
      } else {
        toast.error("Ошибка загрузки блокировок");
      }
    } catch (e) {
      toast.error("Ошибка загрузки блокировок");
    } finally {
      setLoading(false);
    }
  }, [doctorId]);

  useEffect(() => {
    loadUnavailabilities();
  }, [loadUnavailabilities]);

  // Удаление блокировки
  const handleDelete = async (id: string) => {
    if (!confirm("Удалить эту блокировку?")) return;

    try {
      const res = await fetch(`/api/unavailability/${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        toast.success("Блокировка удалена");
        loadUnavailabilities();
      } else {
        const data = await res.json();
        toast.error(data.error || "Ошибка удаления");
      }
    } catch (e) {
      toast.error("Ошибка удаления блокировки");
    }
  };

  // Быстрое создание
  const handleQuickCreate = (type: UnavailabilityType) => {
    setQuickCreateType(type);
    setShowCreateModal(true);
  };

  // Группировка по типу
  const groupedByType = unavailabilities.reduce((acc, item) => {
    if (!acc[item.type]) acc[item.type] = [];
    acc[item.type].push(item);
    return acc;
  }, {} as Record<UnavailabilityType, Unavailability[]>);

  return (
    <div className="min-h-screen bg-[#FFFCF3]">
      <Toaster position="top-center" />

      <div className="mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Заголовок */}
        <h1 className="text-xl sm:text-2xl font-ManropeBold text-[#4F5338] mb-6">
          Блокировки расписания
        </h1>

        {/* Быстрые действия */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          <button
            onClick={() => handleQuickCreate("VACATION")}
            className="p-4 border-2 border-[#5C6744] rounded-xl bg-white hover:bg-[#F5F0E4] text-left transition-colors"
          >
            <div className="text-base sm:text-lg font-ManropeSemiBold text-[#5C6744] mb-1">
              🏖️ Отпуск
            </div>
            <div className="text-sm font-ManropeRegular text-[#636846]">
              Длительный период отсутствия
            </div>
          </button>

          <button
            onClick={() => handleQuickCreate("DAY_OFF")}
            className="p-4 border-2 border-[#967450] rounded-xl bg-white hover:bg-[#F5F0E4] text-left transition-colors"
          >
            <div className="text-base sm:text-lg font-ManropeSemiBold text-[#967450] mb-1">
              🏠 Выходной
            </div>
            <div className="text-sm font-ManropeRegular text-[#636846]">
              Один день или повторяющиеся
            </div>
          </button>

          {isAdmin && (
            <button
              onClick={() => handleQuickCreate("NO_BOOKINGS")}
              className="p-4 border-2 border-[#C63D3D] rounded-xl bg-white hover:bg-[#FFE5E5] text-left transition-colors"
            >
              <div className="text-base sm:text-lg font-ManropeSemiBold text-[#C63D3D] mb-1">
                🚫 Без записей
              </div>
              <div className="text-sm font-ManropeRegular text-[#636846]">
                Админ-блокировка
              </div>
            </button>
          )}
        </div>

        {/* Список блокировок */}
        {loading ? (
          <div className="text-center py-12 text-base font-ManropeRegular text-[#636846]">
            Загрузка...
          </div>
        ) : unavailabilities.length === 0 ? (
          <div className="text-center py-12 border-2 border-dashed border-[#E8E2D5] rounded-xl bg-white">
            <p className="text-base font-ManropeRegular text-[#636846] mb-4">
              Нет активных блокировок
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {(Object.keys(groupedByType) as UnavailabilityType[]).map((type) => (
              <div key={type}>
                <h2 className="text-base sm:text-lg font-ManropeSemiBold text-[#4F5338] mb-4">
                  {TYPE_LABELS[type]}
                </h2>
                <div className="space-y-3">
                  {groupedByType[type].map((item) => (
                    <UnavailabilityCard
                      key={item.id}
                      item={item}
                      onDelete={() => handleDelete(item.parentId || item.id)}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Отступ снизу */}
        <div className="h-16 sm:h-20" />
      </div>

      {/* Модалка создания */}
      {showCreateModal && (
        <CreateUnavailabilityModal
          doctorId={doctorId}
          doctorTzid={doctorTzid}
          initialType={quickCreateType}
          isAdmin={isAdmin}
          onClose={() => {
            setShowCreateModal(false);
            setQuickCreateType(null);
          }}
          onSuccess={() => {
            setShowCreateModal(false);
            setQuickCreateType(null);
            loadUnavailabilities();
          }}
        />
      )}
    </div>
  );
}

// ================= Карточка блокировки =================

function UnavailabilityCard({
  item,
  onDelete,
}: {
  item: Unavailability;
  onDelete: () => void;
}) {
  const startDate = new Date(item.start);
  const endDate = new Date(item.end);

  return (
    <div className={`border-2 rounded-xl p-4 sm:p-5 ${TYPE_COLORS[item.type]}`}>
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className="text-sm sm:text-base font-ManropeSemiBold text-[#4F5338] break-all">
              {format(startDate, "dd.MM.yyyy HH:mm")} - {format(endDate, "dd.MM.yyyy HH:mm")}
            </span>
            {item.isRecurring && (
              <span className="text-xs font-ManropeRegular px-2 py-1 bg-white text-[#636846] rounded-lg whitespace-nowrap">
                🔁 Повторяется
              </span>
            )}
          </div>
          {item.reason && (
            <p className="text-sm font-ManropeRegular text-[#636846] break-words">
              {item.reason}
            </p>
          )}
          {item.rrule && (
            <p className="text-xs font-ManropeRegular text-[#8A8A7A] mt-1 break-all">
              Правило: {item.rrule}
            </p>
          )}
        </div>
        <button
          onClick={onDelete}
          className="text-sm font-ManropeRegular text-[#C63D3D] hover:text-[#A32E2E] px-3 py-2 hover:bg-white rounded-lg transition-colors self-start whitespace-nowrap"
        >
          Удалить
        </button>
      </div>
    </div>
  );
}

// ================= Модалка создания блокировки =================

function CreateUnavailabilityModal({
  doctorId,
  doctorTzid,
  initialType,
  isAdmin,
  onClose,
  onSuccess,
}: {
  doctorId: string;
  doctorTzid: string;
  initialType: UnavailabilityType | null;
  isAdmin: boolean;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurringFreq, setRecurringFreq] = useState<"WEEKLY" | "MONTHLY">("WEEKLY");
  const [selectedWeekdays, setSelectedWeekdays] = useState<string[]>([]);
  const [selectedMonthDays, setSelectedMonthDays] = useState<number[]>([]);
  const [recurringEndType, setRecurringEndType] = useState<"count" | "until">("count");

  const form = useForm({
    resolver: zodResolver(createUnavailabilitySchema),
    defaultValues: {
      type: initialType || "VACATION",
      startDate: format(new Date(), "yyyy-MM-dd"),
      startTime: "09:00",
      endDate: format(addDays(new Date(), 1), "yyyy-MM-dd"),
      endTime: "18:00",
      reason: "",
      isRecurring: false,
      cancelPending: false,
    },
  });

  const handleSubmit = form.handleSubmit(async (data) => {
    // Валидация повторений
    if (isRecurring) {
      if (recurringFreq === "WEEKLY" && selectedWeekdays.length === 0) {
        toast.error("Выберите хотя бы один день недели");
        return;
      }
      if (recurringFreq === "MONTHLY" && selectedMonthDays.length === 0) {
        toast.error("Выберите хотя бы один день месяца");
        return;
      }
    }

    // Формирование RRULE
    let rrule: string | null = null;
    let rruleUntil: string | null = null;

    if (isRecurring) {
      const parts: string[] = [`FREQ=${recurringFreq}`];

      if (recurringFreq === "WEEKLY") {
        parts.push(`BYDAY=${selectedWeekdays.join(",")}`);
      } else if (recurringFreq === "MONTHLY") {
        parts.push(`BYMONTHDAY=${selectedMonthDays.join(",")}`);
      }

      if (recurringEndType === "count" && data.recurringCount) {
        parts.push(`COUNT=${data.recurringCount}`);
      } else if (recurringEndType === "until" && data.recurringUntil) {
        const untilDate = new Date(`${data.recurringUntil}T23:59:59`);
        rruleUntil = untilDate.toISOString();
      }

      rrule = parts.join(";");
    }

    // Формирование дат
    const start = new Date(`${data.startDate}T${data.startTime}:00`);
    const end = new Date(`${data.endDate}T${data.endTime}:00`);

    try {
      const res = await fetch("/api/unavailability", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          doctorId,
          type: data.type,
          tzid: doctorTzid,
          start: start.toISOString(),
          end: end.toISOString(),
          rrule,
          rruleUntil,
          reason: data.reason || null,
          cancelPending: data.cancelPending,
        }),
      });

      const result = await res.json();

      if (res.ok) {
        const { affected } = result;
        toast.success(
          `Блокировка создана. ${
            affected
              ? `Затронуто: ${affected.pending} PENDING, ${affected.confirmed} CONFIRMED. ${
                  affected.canceledPending > 0
                    ? `Отменено PENDING: ${affected.canceledPending}`
                    : ""
                }`
              : ""
          }`,
          { duration: 5000 }
        );
        onSuccess();
      } else {
        toast.error(result.error || "Ошибка создания блокировки");
      }
    } catch (e) {
      toast.error("Ошибка создания блокировки");
    }
  });

  const toggleWeekday = (code: string) => {
    setSelectedWeekdays((prev) =>
      prev.includes(code) ? prev.filter((d) => d !== code) : [...prev, code]
    );
  };

  const toggleMonthDay = (day: number) => {
    setSelectedMonthDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-[clamp(36rem,32rem+16vw,64rem)] bg-white rounded-[clamp(1rem,0.8846rem+0.5128vw,1.5rem)] shadow-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-[#E8E2D5] px-[clamp(1.5rem,1.2692rem+1.0256vw,2.5rem)] py-[clamp(1.25rem,1.0192rem+1.0256vw,2.25rem)] flex items-center justify-between">
          <h2 className="flex-1 min-w-0 text-[clamp(1.25rem,1.1346rem+0.5128vw,1.75rem)] font-ManropeBold text-[#4F5338] truncate">
            Создать блокировку
          </h2>
          <button
            onClick={onClose}
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
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-[clamp(1.5rem,1.2692rem+1.0256vw,2.5rem)] py-[clamp(1.5rem,1.2692rem+1.0256vw,2.5rem)] space-y-[clamp(1.25rem,1.0192rem+1.0256vw,2.25rem)]">
          {/* Тип блокировки */}
          <div>
            <label className="block text-[clamp(0.875rem,0.8077rem+0.2885vw,1.125rem)] font-ManropeMedium text-[#4F5338] mb-[clamp(0.375rem,0.3173rem+0.2564vw,0.625rem)]">
              Тип блокировки
            </label>
            <select
              className="w-full rounded-[clamp(0.5rem,0.4423rem+0.2564vw,0.75rem)] border border-[#E8E2D5] px-[clamp(0.75rem,0.6346rem+0.5128vw,1.25rem)] py-[clamp(0.625rem,0.5096rem+0.5128vw,1.125rem)] text-[clamp(0.875rem,0.8077rem+0.2885vw,1.125rem)] font-ManropeRegular text-[#4F5338] focus:outline-none focus:ring-2 focus:ring-[#5C6744] focus:border-transparent transition-all"
              {...form.register("type")}
            >
              <option value="VACATION">Отпуск</option>
              <option value="DAY_OFF">Выходной</option>
              {isAdmin && <option value="NO_BOOKINGS">Без записей (админ)</option>}
            </select>
          </div>

          {/* Даты */}
          <div className="grid grid-cols-2 gap-[clamp(0.75rem,0.6346rem+0.5128vw,1.25rem)]">
            <div>
              <label className="block text-[clamp(0.875rem,0.8077rem+0.2885vw,1.125rem)] font-ManropeMedium text-[#4F5338] mb-[clamp(0.375rem,0.3173rem+0.2564vw,0.625rem)]">
                Дата начала
              </label>
              <input
                type="date"
                className="w-full rounded-[clamp(0.5rem,0.4423rem+0.2564vw,0.75rem)] border border-[#E8E2D5] px-[clamp(0.75rem,0.6346rem+0.5128vw,1.25rem)] py-[clamp(0.625rem,0.5096rem+0.5128vw,1.125rem)] text-[clamp(0.875rem,0.8077rem+0.2885vw,1.125rem)] font-ManropeRegular text-[#4F5338] focus:outline-none focus:ring-2 focus:ring-[#5C6744] focus:border-transparent transition-all"
                {...form.register("startDate")}
              />
            </div>
            <div>
              <label className="block text-[clamp(0.875rem,0.8077rem+0.2885vw,1.125rem)] font-ManropeMedium text-[#4F5338] mb-[clamp(0.375rem,0.3173rem+0.2564vw,0.625rem)]">
                Время начала
              </label>
              <input
                type="time"
                className="w-full rounded-[clamp(0.5rem,0.4423rem+0.2564vw,0.75rem)] border border-[#E8E2D5] px-[clamp(0.75rem,0.6346rem+0.5128vw,1.25rem)] py-[clamp(0.625rem,0.5096rem+0.5128vw,1.125rem)] text-[clamp(0.875rem,0.8077rem+0.2885vw,1.125rem)] font-ManropeRegular text-[#4F5338] focus:outline-none focus:ring-2 focus:ring-[#5C6744] focus:border-transparent transition-all"
                {...form.register("startTime")}
              />
            </div>
            <div>
              <label className="block text-[clamp(0.875rem,0.8077rem+0.2885vw,1.125rem)] font-ManropeMedium text-[#4F5338] mb-[clamp(0.375rem,0.3173rem+0.2564vw,0.625rem)]">
                Дата окончания
              </label>
              <input
                type="date"
                className="w-full rounded-[clamp(0.5rem,0.4423rem+0.2564vw,0.75rem)] border border-[#E8E2D5] px-[clamp(0.75rem,0.6346rem+0.5128vw,1.25rem)] py-[clamp(0.625rem,0.5096rem+0.5128vw,1.125rem)] text-[clamp(0.875rem,0.8077rem+0.2885vw,1.125rem)] font-ManropeRegular text-[#4F5338] focus:outline-none focus:ring-2 focus:ring-[#5C6744] focus:border-transparent transition-all"
                {...form.register("endDate")}
              />
            </div>
            <div>
              <label className="block text-[clamp(0.875rem,0.8077rem+0.2885vw,1.125rem)] font-ManropeMedium text-[#4F5338] mb-[clamp(0.375rem,0.3173rem+0.2564vw,0.625rem)]">
                Время окончания
              </label>
              <input
                type="time"
                className="w-full rounded-[clamp(0.5rem,0.4423rem+0.2564vw,0.75rem)] border border-[#E8E2D5] px-[clamp(0.75rem,0.6346rem+0.5128vw,1.25rem)] py-[clamp(0.625rem,0.5096rem+0.5128vw,1.125rem)] text-[clamp(0.875rem,0.8077rem+0.2885vw,1.125rem)] font-ManropeRegular text-[#4F5338] focus:outline-none focus:ring-2 focus:ring-[#5C6744] focus:border-transparent transition-all"
                {...form.register("endTime")}
              />
            </div>
          </div>

          {/* Причина */}
          <div>
            <label className="block text-[clamp(0.875rem,0.8077rem+0.2885vw,1.125rem)] font-ManropeMedium text-[#4F5338] mb-[clamp(0.375rem,0.3173rem+0.2564vw,0.625rem)]">
              Причина (опционально)
            </label>
            <textarea
              className="w-full rounded-[clamp(0.5rem,0.4423rem+0.2564vw,0.75rem)] border border-[#E8E2D5] px-[clamp(0.75rem,0.6346rem+0.5128vw,1.25rem)] py-[clamp(0.625rem,0.5096rem+0.5128vw,1.125rem)] text-[clamp(0.875rem,0.8077rem+0.2885vw,1.125rem)] font-ManropeRegular text-[#4F5338] focus:outline-none focus:ring-2 focus:ring-[#5C6744] focus:border-transparent transition-all"
              rows={2}
              placeholder="Например: Ежегодный отпуск"
              {...form.register("reason")}
            />
          </div>

          {/* Повторение */}
          <div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isRecurring}
                onChange={(e) => {
                  setIsRecurring(e.target.checked);
                  form.setValue("isRecurring", e.target.checked);
                }}
                className="w-[clamp(1rem,0.9423rem+0.2564vw,1.25rem)] h-[clamp(1rem,0.9423rem+0.2564vw,1.25rem)] rounded border-[#E8E2D5] text-[#5C6744] focus:ring-[#5C6744]"
              />
              <span className="text-[clamp(0.875rem,0.8077rem+0.2885vw,1.125rem)] font-ManropeMedium text-[#4F5338]">
                Сделать повторяющимся
              </span>
            </label>
          </div>

          {isRecurring && (
            <div className="border border-[#E8E2D5] rounded-[clamp(0.75rem,0.6346rem+0.5128vw,1.25rem)] p-[clamp(1rem,0.8846rem+0.5128vw,1.5rem)] space-y-[clamp(1rem,0.8846rem+0.5128vw,1.5rem)] bg-[#FFFCF6]">
              {/* Частота */}
              <div>
                <label className="block text-[clamp(0.875rem,0.8077rem+0.2885vw,1.125rem)] font-ManropeMedium text-[#4F5338] mb-[clamp(0.5rem,0.4423rem+0.2564vw,0.75rem)]">
                  Частота
                </label>
                <div className="flex gap-[clamp(1rem,0.8846rem+0.5128vw,1.5rem)]">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      checked={recurringFreq === "WEEKLY"}
                      onChange={() => setRecurringFreq("WEEKLY")}
                      className="w-[clamp(1rem,0.9423rem+0.2564vw,1.25rem)] h-[clamp(1rem,0.9423rem+0.2564vw,1.25rem)] text-[#5C6744] focus:ring-[#5C6744]"
                    />
                    <span className="text-[clamp(0.875rem,0.8077rem+0.2885vw,1.125rem)] font-ManropeRegular text-[#4F5338]">
                      Еженедельно
                    </span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      checked={recurringFreq === "MONTHLY"}
                      onChange={() => setRecurringFreq("MONTHLY")}
                      className="w-[clamp(1rem,0.9423rem+0.2564vw,1.25rem)] h-[clamp(1rem,0.9423rem+0.2564vw,1.25rem)] text-[#5C6744] focus:ring-[#5C6744]"
                    />
                    <span className="text-[clamp(0.875rem,0.8077rem+0.2885vw,1.125rem)] font-ManropeRegular text-[#4F5338]">
                      Ежемесячно
                    </span>
                  </label>
                </div>
              </div>

              {/* Дни недели */}
              {recurringFreq === "WEEKLY" && (
                <div>
                  <label className="block text-[clamp(0.875rem,0.8077rem+0.2885vw,1.125rem)] font-ManropeMedium text-[#4F5338] mb-[clamp(0.5rem,0.4423rem+0.2564vw,0.75rem)]">
                    Дни недели
                  </label>
                  <div className="flex gap-[clamp(0.5rem,0.4423rem+0.2564vw,0.75rem)] flex-wrap">
                    {WEEKDAY_OPTIONS.map((day) => (
                      <button
                        key={day.code}
                        type="button"
                        onClick={() => toggleWeekday(day.code)}
                        className={`px-[clamp(0.75rem,0.6346rem+0.5128vw,1.25rem)] py-[clamp(0.5rem,0.4423rem+0.2564vw,0.75rem)] rounded-[clamp(0.5rem,0.4423rem+0.2564vw,0.75rem)] border text-[clamp(0.875rem,0.8077rem+0.2885vw,1.125rem)] font-ManropeRegular transition-colors ${
                          selectedWeekdays.includes(day.code)
                            ? "bg-[#5C6744] text-white border-[#5C6744]"
                            : "bg-white text-[#636846] border-[#E8E2D5] hover:bg-[#F5F0E4]"
                        }`}
                      >
                        {day.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Дни месяца */}
              {recurringFreq === "MONTHLY" && (
                <div>
                  <label className="block text-[clamp(0.875rem,0.8077rem+0.2885vw,1.125rem)] font-ManropeMedium text-[#4F5338] mb-[clamp(0.5rem,0.4423rem+0.2564vw,0.75rem)]">
                    Дни месяца
                  </label>
                  <div className="grid grid-cols-7 gap-[clamp(0.5rem,0.4423rem+0.2564vw,0.75rem)]">
                    {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                      <button
                        key={day}
                        type="button"
                        onClick={() => toggleMonthDay(day)}
                        className={`px-[clamp(0.5rem,0.4423rem+0.2564vw,0.75rem)] py-[clamp(0.5rem,0.4423rem+0.2564vw,0.75rem)] rounded-[clamp(0.5rem,0.4423rem+0.2564vw,0.75rem)] border text-[clamp(0.875rem,0.8077rem+0.2885vw,1.125rem)] font-ManropeRegular transition-colors ${
                          selectedMonthDays.includes(day)
                            ? "bg-[#5C6744] text-white border-[#5C6744]"
                            : "bg-white text-[#636846] border-[#E8E2D5] hover:bg-[#F5F0E4]"
                        }`}
                      >
                        {day}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Окончание повторения */}
              <div>
                <label className="block text-[clamp(0.875rem,0.8077rem+0.2885vw,1.125rem)] font-ManropeMedium text-[#4F5338] mb-[clamp(0.5rem,0.4423rem+0.2564vw,0.75rem)]">
                  Окончание
                </label>
                <div className="space-y-[clamp(0.5rem,0.4423rem+0.2564vw,0.75rem)]">
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      checked={recurringEndType === "count"}
                      onChange={() => setRecurringEndType("count")}
                      className="w-[clamp(1rem,0.9423rem+0.2564vw,1.25rem)] h-[clamp(1rem,0.9423rem+0.2564vw,1.25rem)] text-[#5C6744] focus:ring-[#5C6744]"
                    />
                    <span className="text-[clamp(0.875rem,0.8077rem+0.2885vw,1.125rem)] font-ManropeRegular text-[#4F5338]">
                      После
                    </span>
                    <input
                      type="number"
                      min="1"
                      max="100"
                      defaultValue="4"
                      className="w-20 rounded-[clamp(0.5rem,0.4423rem+0.2564vw,0.75rem)] border border-[#E8E2D5] px-[clamp(0.5rem,0.4423rem+0.2564vw,0.75rem)] py-[clamp(0.375rem,0.3173rem+0.2564vw,0.625rem)] text-[clamp(0.875rem,0.8077rem+0.2885vw,1.125rem)] font-ManropeRegular text-[#4F5338] focus:outline-none focus:ring-2 focus:ring-[#5C6744] transition-all disabled:opacity-50"
                      {...form.register("recurringCount", { valueAsNumber: true })}
                      disabled={recurringEndType !== "count"}
                    />
                    <span className="text-[clamp(0.875rem,0.8077rem+0.2885vw,1.125rem)] font-ManropeRegular text-[#4F5338]">
                      повторений
                    </span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      checked={recurringEndType === "until"}
                      onChange={() => setRecurringEndType("until")}
                      className="w-[clamp(1rem,0.9423rem+0.2564vw,1.25rem)] h-[clamp(1rem,0.9423rem+0.2564vw,1.25rem)] text-[#5C6744] focus:ring-[#5C6744]"
                    />
                    <span className="text-[clamp(0.875rem,0.8077rem+0.2885vw,1.125rem)] font-ManropeRegular text-[#4F5338]">
                      До даты
                    </span>
                    <input
                      type="date"
                      className="rounded-[clamp(0.5rem,0.4423rem+0.2564vw,0.75rem)] border border-[#E8E2D5] px-[clamp(0.5rem,0.4423rem+0.2564vw,0.75rem)] py-[clamp(0.375rem,0.3173rem+0.2564vw,0.625rem)] text-[clamp(0.875rem,0.8077rem+0.2885vw,1.125rem)] font-ManropeRegular text-[#4F5338] focus:outline-none focus:ring-2 focus:ring-[#5C6744] transition-all disabled:opacity-50"
                      {...form.register("recurringUntil")}
                      disabled={recurringEndType !== "until"}
                    />
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* Автоотмена PENDING */}
          <div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                {...form.register("cancelPending")}
                className="w-[clamp(1rem,0.9423rem+0.2564vw,1.25rem)] h-[clamp(1rem,0.9423rem+0.2564vw,1.25rem)] rounded border-[#E8E2D5] text-[#5C6744] focus:ring-[#5C6744]"
              />
              <span className="text-[clamp(0.875rem,0.8077rem+0.2885vw,1.125rem)] font-ManropeRegular text-[#4F5338]">
                Автоматически отменить пересекающиеся PENDING брони
              </span>
            </label>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white border-t border-[#E8E2D5] px-6 py-4 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="rounded-lg bg-[#F5F0E4] px-5 py-2.5 text-sm font-ManropeMedium text-[#967450] hover:bg-[#EBE5D6] transition-colors"
          >
            Отмена
          </button>
          <button
            onClick={handleSubmit}
            className="rounded-lg bg-[#5C6744] px-5 py-2.5 text-sm font-ManropeMedium text-white hover:bg-[#4F5938] transition-colors"
          >
            Создать блокировку
          </button>
        </div>
      </div>
    </div>
  );
}
