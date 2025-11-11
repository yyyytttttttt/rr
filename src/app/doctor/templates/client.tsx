"use client";
import React, { useState, useEffect, useCallback } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import toast, { Toaster } from "react-hot-toast";

// ================= Типы =================

interface TemplateSlot {
  id?: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  slotDurationMin: number;
  bufferMinOverride: number | null;
}

interface WeeklyTemplate {
  id: string;
  name: string;
  description: string | null;
  isActive: boolean;
  createdAt: string;
  slots: TemplateSlot[];
}

interface ClientTemplatesProps {
  doctorId: string;
  doctorName: string;
}

// ================= Схемы валидации =================

const slotSchema = z.object({
  dayOfWeek: z.number().int().min(0).max(6),
  startTime: z.string().regex(/^\d{2}:\d{2}$/),
  endTime: z.string().regex(/^\d{2}:\d{2}$/),
  slotDurationMin: z.number().int().min(5).max(480),
  bufferMinOverride: z.number().int().min(0).nullable(),
});

const templateFormSchema = z.object({
  name: z.string().min(1, "Укажите название").max(100),
  description: z.string().max(500).optional(),
});

// ================= Константы =================

const DAYS_OF_WEEK = [
  "Понедельник",
  "Вторник",
  "Среда",
  "Четверг",
  "Пятница",
  "Суббота",
  "Воскресенье",
];

// ================= Вспомогательные функции =================

function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

// ================= Главный компонент =================

export default function ClientTemplates({ doctorId, doctorName }: ClientTemplatesProps) {
  const [templates, setTemplates] = useState<WeeklyTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingTemplate, setEditingTemplate] = useState<WeeklyTemplate | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [applyingTemplate, setApplyingTemplate] = useState<WeeklyTemplate | null>(null);

  // Загрузка шаблонов
  const loadTemplates = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/doctor/templates?doctorId=${encodeURIComponent(doctorId)}`);
      const data = await res.json();
      if (res.ok) {
        setTemplates(data.templates || []);
      } else {
        toast.error("Ошибка загрузки шаблонов");
      }
    } catch (e) {
      toast.error("Ошибка загрузки шаблонов");
    } finally {
      setLoading(false);
    }
  }, [doctorId]);

  useEffect(() => {
    loadTemplates();
  }, [loadTemplates]);

  // Удаление шаблона
  const handleDelete = async (id: string) => {
    if (!confirm("Удалить этот шаблон?")) return;
    try {
      const res = await fetch("/api/doctor/templates", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action: "delete", id, doctorId }),
      });
      if (res.ok) {
        toast.success("Шаблон удален");
        loadTemplates();
      } else {
        const data = await res.json();
        toast.error(data.error || "Ошибка удаления");
      }
    } catch (e) {
      toast.error("Ошибка удаления шаблона");
    }
  };

  return (
    <div className="min-h-screen bg-[#FFFCF3]">
      <Toaster position="top-center" />

      <div className=" mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Шапка */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <h1 className="text-xl sm:text-2xl font-ManropeBold text-[#4F5338]">
            Шаблоны расписания
          </h1>
          <button
            onClick={() => setShowCreateModal(true)}
            className="rounded-lg bg-[#5C6744] px-4 py-2 text-sm font-ManropeMedium text-white hover:bg-[#4F5938] transition-colors whitespace-nowrap self-start sm:self-auto"
          >
            + Создать шаблон
          </button>
        </div>

        {/* Список шаблонов */}
        {loading ? (
          <div className="text-center py-12 text-base font-ManropeRegular text-[#636846]">
            Загрузка...
          </div>
        ) : templates.length === 0 ? (
          <div className="text-center py-12 border-2 border-dashed border-[#E8E2D5] rounded-xl bg-white">
            <p className="text-base font-ManropeRegular text-[#636846] mb-4">
              У вас пока нет шаблонов
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="rounded-lg bg-[#5C6744] px-4 py-2 text-sm font-ManropeMedium text-white hover:bg-[#4F5938] transition-colors"
            >
              Создать первый шаблон
            </button>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {templates.map((template) => (
              <TemplateCard
                key={template.id}
                template={template}
                onEdit={() => setEditingTemplate(template)}
                onDelete={() => handleDelete(template.id)}
                onApply={() => setApplyingTemplate(template)}
              />
            ))}
          </div>
        )}

        {/* Отступ снизу */}
        <div className="h-16 sm:h-20" />
      </div>

      {/* Модалка создания/редактирования */}
      {(showCreateModal || editingTemplate) && (
        <TemplateModal
          doctorId={doctorId}
          template={editingTemplate}
          onClose={() => {
            setShowCreateModal(false);
            setEditingTemplate(null);
          }}
          onSuccess={() => {
            setShowCreateModal(false);
            setEditingTemplate(null);
            loadTemplates();
          }}
        />
      )}

      {/* Модалка применения шаблона */}
      {applyingTemplate && (
        <ApplyTemplateModal
          doctorId={doctorId}
          template={applyingTemplate}
          onClose={() => setApplyingTemplate(null)}
        />
      )}
    </div>
  );
}

// ================= Карточка шаблона =================

function TemplateCard({
  template,
  onEdit,
  onDelete,
  onApply,
}: {
  template: WeeklyTemplate;
  onEdit: () => void;
  onDelete: () => void;
  onApply: () => void;
}) {
  // Группировка слотов по дням
  const slotsByDay = template.slots.reduce((acc, slot) => {
    if (!acc[slot.dayOfWeek]) acc[slot.dayOfWeek] = [];
    acc[slot.dayOfWeek].push(slot);
    return acc;
  }, {} as Record<number, TemplateSlot[]>);

  return (
    <div className="bg-white border border-[#E8E2D5] rounded-xl p-4 sm:p-10 hover:shadow-md transition-shadow">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4">
        <div className="flex-1 min-w-0">
          <h3 className="text-base sm:text-lg font-ManropeSemiBold text-[#4F5338] break-words">
            {template.name}
          </h3>
          {template.description && (
            <p className="text-sm font-ManropeRegular text-[#636846] mt-1 break-words">
              {template.description}
            </p>
          )}
        </div>
        <div className="flex gap-3 shrink-0 self-start">
          <button
            onClick={onEdit}
            className="text-sm font-ManropeRegular text-[#5C6744] hover:text-[#4F5938] whitespace-nowrap"
          >
            Изменить
          </button>
          <button
            onClick={onDelete}
            className="text-sm font-ManropeRegular text-[#C63D3D] hover:text-[#A32E2E] whitespace-nowrap"
          >
            Удалить
          </button>
        </div>
      </div>

      {/* Слоты */}
      <div className="space-y-1.5 mb-4">
        {Object.entries(slotsByDay)
          .sort(([a], [b]) => Number(a) - Number(b))
          .map(([day, slots]) => (
            <div key={day} className="text-sm font-ManropeRegular">
              <span className="font-ManropeSemiBold text-[#4F5338]">{DAYS_OF_WEEK[Number(day)]}:</span>{" "}
              {slots.map((slot, idx) => (
                <span key={idx} className="text-[#636846]">
                  {slot.startTime}-{slot.endTime}
                  <span className="text-xs text-[#8A8A7A]">
                    {" "}
                    (приём {slot.slotDurationMin} мин
                    {slot.bufferMinOverride !== null && `, буфер ${slot.bufferMinOverride} мин`})
                  </span>
                  {idx < slots.length - 1 && ", "}
                </span>
              ))}
            </div>
          ))}
      </div>

      <button
        onClick={onApply}
        className="w-full rounded-lg bg-[#5C6744] px-4 py-2.5 text-sm font-ManropeMedium text-white hover:bg-[#4F5938] transition-colors"
      >
        Применить к неделе
      </button>
    </div>
  );
}

// ================= Модалка создания/редактирования =================

function TemplateModal({
  doctorId,
  template,
  onClose,
  onSuccess,
}: {
  doctorId: string;
  template: WeeklyTemplate | null;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [slots, setSlots] = useState<TemplateSlot[]>(
    template?.slots || []
  );

  const form = useForm({
    resolver: zodResolver(templateFormSchema),
    defaultValues: {
      name: template?.name || "",
      description: template?.description || "",
    },
  });

  const addSlot = () => {
    setSlots([
      ...slots,
      { dayOfWeek: 0, startTime: "09:00", endTime: "18:00", slotDurationMin: 30, bufferMinOverride: null },
    ]);
  };

  const removeSlot = (index: number) => {
    setSlots(slots.filter((_, i) => i !== index));
  };

  const updateSlot = (index: number, field: keyof TemplateSlot, value: any) => {
    const newSlots = [...slots];
    newSlots[index] = { ...newSlots[index], [field]: value };
    setSlots(newSlots);
  };

  const handleSubmit = form.handleSubmit(async (data) => {
    if (slots.length === 0) {
      toast.error("Добавьте хотя бы один слот");
      return;
    }

    // Валидация временных диапазонов
    for (let i = 0; i < slots.length; i++) {
      const slot = slots[i];
      if (slot.startTime >= slot.endTime) {
        toast.error(`Слот ${i + 1}: время начала должно быть меньше времени окончания`);
        return;
      }
    }

    // Валидация пересечений слотов с учетом буфера
    const slotsByDay = slots.reduce((acc, slot, idx) => {
      if (!acc[slot.dayOfWeek]) acc[slot.dayOfWeek] = [];
      acc[slot.dayOfWeek].push({ ...slot, originalIndex: idx });
      return acc;
    }, {} as Record<number, Array<TemplateSlot & { originalIndex: number }>>);

    for (const [day, daySlots] of Object.entries(slotsByDay)) {
      // Сортируем слоты по времени начала
      const sorted = [...daySlots].sort((a, b) => a.startTime.localeCompare(b.startTime));

      for (let i = 0; i < sorted.length - 1; i++) {
        const curr = sorted[i];
        const next = sorted[i + 1];

        // Преобразуем время в минуты для удобства сравнения
        const currEndMin = timeToMinutes(curr.endTime);
        const nextStartMin = timeToMinutes(next.startTime);
        const bufferMin = curr.bufferMinOverride ?? 15; // По умолчанию 15 минут

        if (currEndMin + bufferMin > nextStartMin) {
          toast.error(
            `${DAYS_OF_WEEK[Number(day)]}: Слот ${curr.originalIndex + 1} (${curr.startTime}-${curr.endTime}) ` +
            `и Слот ${next.originalIndex + 1} (${next.startTime}-${next.endTime}) должны иметь буфер минимум ${bufferMin} мин`
          );
          return;
        }
      }
    }

    try {
      const action = template ? "update" : "create";
      const payload = {
        action,
        doctorId,
        name: data.name,
        description: data.description || null,
        slots: slots.map((s) => ({
          dayOfWeek: s.dayOfWeek,
          startTime: s.startTime,
          endTime: s.endTime,
          slotDurationMin: s.slotDurationMin,
          bufferMinOverride: s.bufferMinOverride,
        })),
        ...(template ? { id: template.id } : {}),
      };

      const res = await fetch("/api/doctor/templates", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        toast.success(template ? "Шаблон обновлен" : "Шаблон создан");
        onSuccess();
      } else {
        const errorData = await res.json();
        toast.error(errorData.error || "Ошибка сохранения");
      }
    } catch (e) {
      toast.error("Ошибка сохранения шаблона");
    }
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-2xl bg-white rounded-xl sm:rounded-2xl shadow-2xl max-h-[95vh] sm:max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between gap-3 px-4 sm:px-6 py-3 sm:py-4 border-b border-[#E8E2D5] shrink-0">
          <h2 className="flex-1 min-w-0 text-lg sm:text-xl font-ManropeBold text-[#4F5338] truncate">
            {template ? "Редактирование шаблона" : "Новый шаблон"}
          </h2>
          <button onClick={onClose} className="flex-shrink-0 p-1 text-[#636846] hover:text-[#4F5338] transition-colors rounded-lg hover:bg-[#F5F0E4]" aria-label="Закрыть">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="overflow-y-auto flex-1 px-4 sm:px-6 py-4 sm:py-6 space-y-4 sm:space-y-5">
          {/* Название */}
          <div>
            <label className="block text-sm font-ManropeMedium text-[#4F5338] mb-2">Название</label>
            <input
              type="text"
              className="w-full rounded-lg border border-[#E8E2D5] px-3 py-2.5 text-sm font-ManropeRegular text-[#4F5338] focus:outline-none focus:ring-2 focus:ring-[#5C6744] focus:border-transparent transition-all"
              placeholder="Обычная неделя"
              {...form.register("name")}
            />
            {form.formState.errors.name && (
              <p className="text-[clamp(0.75rem,0.6923rem+0.2564vw,1rem)] text-[#C74545] mt-[clamp(0.25rem,0.1923rem+0.2564vw,0.5rem)] font-ManropeRegular">
                {form.formState.errors.name.message}
              </p>
            )}
          </div>

          {/* Описание */}
          <div>
            <label className="block text-sm font-ManropeMedium text-[#4F5338] mb-2">Описание (опционально)</label>
            <textarea
              className="w-full rounded-lg border border-[#E8E2D5] px-3 py-2.5 text-sm font-ManropeRegular text-[#4F5338] focus:outline-none focus:ring-2 focus:ring-[#5C6744] focus:border-transparent transition-all resize-none"
              rows={2}
              placeholder="Рабочие дни с 9 до 18"
              {...form.register("description")}
            />
          </div>

          {/* Слоты */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="block text-sm font-ManropeMedium text-[#4F5338]">Временные слоты</label>
              <button
                type="button"
                onClick={addSlot}
                className="text-sm text-[#5C6744] hover:text-[#4F5938] font-ManropeMedium transition-colors whitespace-nowrap"
              >
                + Добавить слот
              </button>
            </div>

            {slots.length === 0 ? (
              <div className="text-center py-8 sm:py-12 border-2 border-dashed border-[#E8E2D5] rounded-lg bg-[#FFFCF6]">
                <p className="text-sm text-[#636846] font-ManropeRegular mb-2">Нет слотов</p>
                <button
                  type="button"
                  onClick={addSlot}
                  className="text-sm text-[#5C6744] hover:text-[#4F5938] font-ManropeMedium transition-colors"
                >
                  Добавить первый слот
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {slots.map((slot, index) => (
                  <div key={index} className="border border-[#E8E2D5] rounded-lg p-3 sm:p-4 space-y-3 bg-[#FFFCF6]">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-ManropeMedium text-[#4F5338]">Слот {index + 1}</span>
                      <button
                        type="button"
                        onClick={() => removeSlot(index)}
                        className="text-sm text-[#C74545] hover:text-[#A33939] font-ManropeRegular transition-colors"
                      >
                        Удалить
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[clamp(0.875rem,0.8077rem+0.2885vw,1.125rem)] font-ManropeMedium text-[#4F5338] mb-[clamp(0.375rem,0.3173rem+0.2564vw,0.625rem)]">
                          День недели
                        </label>
                        <select
                          className="w-full rounded-[clamp(0.5rem,0.4423rem+0.2564vw,0.75rem)] border border-[#E8E2D5] px-[clamp(0.75rem,0.6346rem+0.5128vw,1.25rem)] py-[clamp(0.625rem,0.5096rem+0.5128vw,1.125rem)] text-[clamp(0.875rem,0.8077rem+0.2885vw,1.125rem)] font-ManropeRegular text-[#4F5338] focus:outline-none focus:ring-2 focus:ring-[#5C6744] focus:border-transparent transition-all"
                          value={slot.dayOfWeek}
                          onChange={(e) =>
                            updateSlot(index, "dayOfWeek", Number(e.target.value))
                          }
                        >
                          {DAYS_OF_WEEK.map((day, i) => (
                            <option key={i} value={i}>
                              {day}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-[clamp(0.875rem,0.8077rem+0.2885vw,1.125rem)] font-ManropeMedium text-[#4F5338] mb-[clamp(0.375rem,0.3173rem+0.2564vw,0.625rem)]">
                          Длительность приёма (мин)
                        </label>
                        <input
                          type="number"
                          className="w-full rounded-[clamp(0.5rem,0.4423rem+0.2564vw,0.75rem)] border border-[#E8E2D5] px-[clamp(0.75rem,0.6346rem+0.5128vw,1.25rem)] py-[clamp(0.625rem,0.5096rem+0.5128vw,1.125rem)] text-[clamp(0.875rem,0.8077rem+0.2885vw,1.125rem)] font-ManropeRegular text-[#4F5338] focus:outline-none focus:ring-2 focus:ring-[#5C6744] focus:border-transparent transition-all"
                          placeholder="30"
                          min="5"
                          max="480"
                          value={slot.slotDurationMin}
                          onChange={(e) =>
                            updateSlot(
                              index,
                              "slotDurationMin",
                              e.target.value ? Number(e.target.value) : 30
                            )
                          }
                        />
                      </div>

                      <div>
                        <label className="block text-[clamp(0.875rem,0.8077rem+0.2885vw,1.125rem)] font-ManropeMedium text-[#4F5338] mb-[clamp(0.375rem,0.3173rem+0.2564vw,0.625rem)]">Начало</label>
                        <input
                          type="time"
                          className="w-full rounded-[clamp(0.5rem,0.4423rem+0.2564vw,0.75rem)] border border-[#E8E2D5] px-[clamp(0.75rem,0.6346rem+0.5128vw,1.25rem)] py-[clamp(0.625rem,0.5096rem+0.5128vw,1.125rem)] text-[clamp(0.875rem,0.8077rem+0.2885vw,1.125rem)] font-ManropeRegular text-[#4F5338] focus:outline-none focus:ring-2 focus:ring-[#5C6744] focus:border-transparent transition-all"
                          value={slot.startTime}
                          onChange={(e) => updateSlot(index, "startTime", e.target.value)}
                        />
                      </div>

                      <div>
                        <label className="block text-[clamp(0.875rem,0.8077rem+0.2885vw,1.125rem)] font-ManropeMedium text-[#4F5338] mb-[clamp(0.375rem,0.3173rem+0.2564vw,0.625rem)]">Конец</label>
                        <input
                          type="time"
                          className="w-full rounded-[clamp(0.5rem,0.4423rem+0.2564vw,0.75rem)] border border-[#E8E2D5] px-[clamp(0.75rem,0.6346rem+0.5128vw,1.25rem)] py-[clamp(0.625rem,0.5096rem+0.5128vw,1.125rem)] text-[clamp(0.875rem,0.8077rem+0.2885vw,1.125rem)] font-ManropeRegular text-[#4F5338] focus:outline-none focus:ring-2 focus:ring-[#5C6744] focus:border-transparent transition-all"
                          value={slot.endTime}
                          onChange={(e) => updateSlot(index, "endTime", e.target.value)}
                        />
                      </div>

                      <div>
                        <label className="block text-[clamp(0.875rem,0.8077rem+0.2885vw,1.125rem)] font-ManropeMedium text-[#4F5338] mb-[clamp(0.375rem,0.3173rem+0.2564vw,0.625rem)]">
                          Буфер (мин, опционально)
                        </label>
                        <input
                          type="number"
                          className="w-full rounded-[clamp(0.5rem,0.4423rem+0.2564vw,0.75rem)] border border-[#E8E2D5] px-[clamp(0.75rem,0.6346rem+0.5128vw,1.25rem)] py-[clamp(0.625rem,0.5096rem+0.5128vw,1.125rem)] text-[clamp(0.875rem,0.8077rem+0.2885vw,1.125rem)] font-ManropeRegular text-[#4F5338] focus:outline-none focus:ring-2 focus:ring-[#5C6744] focus:border-transparent transition-all"
                          placeholder="15"
                          min="0"
                          value={slot.bufferMinOverride ?? ""}
                          onChange={(e) =>
                            updateSlot(
                              index,
                              "bufferMinOverride",
                              e.target.value ? Number(e.target.value) : null
                            )
                          }
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Футер */}
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
            {template ? "Сохранить" : "Создать шаблон"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ================= Модалка применения шаблона =================

function ApplyTemplateModal({
  doctorId,
  template,
  onClose,
}: {
  doctorId: string;
  template: WeeklyTemplate;
  onClose: () => void;
}) {
  const [weekStart, setWeekStart] = useState("");
  const [applying, setApplying] = useState(false);

  // Вычисление следующего понедельника
  useEffect(() => {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const daysUntilMonday = dayOfWeek === 0 ? 1 : 8 - dayOfWeek;
    const nextMonday = new Date(today);
    nextMonday.setDate(today.getDate() + daysUntilMonday);
    setWeekStart(nextMonday.toISOString().split("T")[0]);
  }, []);

  const handleApply = async () => {
    if (!weekStart) {
      toast.error("Выберите дату начала недели");
      return;
    }

    try {
      setApplying(true);
      const res = await fetch("/api/doctor/templates/apply", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          templateId: template.id,
          doctorId,
          weekStartDate: weekStart,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        toast.success(
          `Создано окон: ${data.created}, ошибок: ${data.errors}`,
          { duration: 5000 }
        );
        if (data.errors > 0) {
          console.log("Детали ошибок:", data.errorDetails);
        }
        onClose();
      } else {
        toast.error(data.error || "Ошибка применения шаблона");
      }
    } catch (e) {
      toast.error("Ошибка применения шаблона");
    } finally {
      setApplying(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-[clamp(36rem,32rem+16vw,52rem)] bg-white rounded-[clamp(1rem,0.8846rem+0.5128vw,1.5rem)] shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between gap-4 px-[clamp(1.5rem,1.2692rem+1.0256vw,2.5rem)] py-[clamp(1.25rem,1.0192rem+1.0256vw,2.25rem)] border-b border-[#E8E2D5]">
          <h2 className="flex-1 min-w-0 text-[clamp(1.25rem,1.1346rem+0.5128vw,1.75rem)] font-ManropeBold text-[#4F5338] truncate">
            Применить шаблон
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
        <div className="px-[clamp(1.5rem,1.2692rem+1.0256vw,2.5rem)] py-[clamp(1.5rem,1.2692rem+1.0256vw,2.5rem)] space-y-[clamp(1.25rem,1.0192rem+1.0256vw,2.25rem)]">
          <div className="space-y-[clamp(0.75rem,0.6346rem+0.5128vw,1.25rem)]">
            <div className="flex items-center gap-2">
              <span className="text-[clamp(0.875rem,0.8077rem+0.2885vw,1.125rem)] font-ManropeRegular text-[#636846]">
                Шаблон:
              </span>
              <span className="text-[clamp(0.875rem,0.8077rem+0.2885vw,1.125rem)] font-ManropeSemiBold text-[#4F5338]">
                {template.name}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[clamp(0.875rem,0.8077rem+0.2885vw,1.125rem)] font-ManropeRegular text-[#636846]">
                Слотов:
              </span>
              <span className="text-[clamp(0.875rem,0.8077rem+0.2885vw,1.125rem)] font-ManropeSemiBold text-[#4F5338]">
                {template.slots.length}
              </span>
            </div>
          </div>

          <div>
            <label className="block text-[clamp(0.875rem,0.8077rem+0.2885vw,1.125rem)] font-ManropeMedium text-[#4F5338] mb-[clamp(0.375rem,0.3173rem+0.2564vw,0.625rem)]">
              Дата начала недели (понедельник)
            </label>
            <input
              type="date"
              className="w-full rounded-[clamp(0.5rem,0.4423rem+0.2564vw,0.75rem)] border border-[#E8E2D5] px-[clamp(0.75rem,0.6346rem+0.5128vw,1.25rem)] py-[clamp(0.625rem,0.5096rem+0.5128vw,1.125rem)] text-[clamp(0.875rem,0.8077rem+0.2885vw,1.125rem)] font-ManropeRegular text-[#4F5338] focus:outline-none focus:ring-2 focus:ring-[#5C6744] focus:border-transparent transition-all"
              value={weekStart}
              onChange={(e) => setWeekStart(e.target.value)}
            />
            <p className="text-[clamp(0.75rem,0.6923rem+0.2564vw,1rem)] font-ManropeRegular text-[#636846] mt-[clamp(0.375rem,0.3173rem+0.2564vw,0.625rem)]">
              Выберите понедельник недели, на которую хотите применить шаблон
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white border-t border-[#E8E2D5] px-6 py-4 flex justify-end gap-3">
          <button
            onClick={onClose}
            disabled={applying}
            className="rounded-lg bg-[#F5F0E4] px-5 py-2.5 text-sm font-ManropeMedium text-[#967450] hover:bg-[#EBE5D6] transition-colors disabled:opacity-50"
          >
            Отмена
          </button>
          <button
            onClick={handleApply}
            disabled={applying}
            className="rounded-lg bg-[#5C6744] px-5 py-2.5 text-sm font-ManropeMedium text-white hover:bg-[#4F5938] transition-colors disabled:opacity-50"
          >
            {applying ? "Применение..." : "Применить"}
          </button>
        </div>
      </div>
    </div>
  );
}
