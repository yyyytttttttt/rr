"use client";

import { useState, useEffect } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import toast from "react-hot-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

type Props = {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
};

type Doctor = {
  id: string;
  name: string;
};

type Service = {
  id: string;
  name: string;
  durationMin: number;
  priceCents: number;
};

type TimeSlot = {
  startUtc: string;
  endUtc: string;
};

// Zod schema для валидации формы
const clientInfoSchema = z.object({
  clientName: z.string().min(1, "Введите имя клиента").max(100, "Имя слишком длинное"),
  clientEmail: z
    .string()
    .email("Введите корректный email")
    .optional()
    .or(z.literal("")),
  clientPhone: z
    .string()
    .regex(/^\+7 \(\d{3}\) \d{3}-\d{2}-\d{2}$/, "Введите телефон в формате +7 (XXX) XXX-XX-XX")
    .optional()
    .or(z.literal("")),
  comment: z.string().max(500, "Комментарий слишком длинный").optional(),
});

type ClientInfoForm = z.infer<typeof clientInfoSchema>;

// Функция форматирования телефона
function formatPhoneNumber(value: string): string {
  // Убираем все символы кроме цифр
  const digits = value.replace(/\D/g, "");

  // Если пусто, возвращаем пусто
  if (!digits) return "";

  // Если начинается с 8, заменяем на 7
  let cleaned = digits;
  if (cleaned.startsWith("8")) {
    cleaned = "7" + cleaned.slice(1);
  }

  // Если не начинается с 7, добавляем 7
  if (!cleaned.startsWith("7")) {
    cleaned = "7" + cleaned;
  }

  // Форматируем: +7 (XXX) XXX-XX-XX
  const match = cleaned.match(/^7(\d{0,3})(\d{0,3})(\d{0,2})(\d{0,2})$/);

  if (!match) return value;

  let formatted = "+7";
  if (match[1]) formatted += ` (${match[1]}`;
  if (match[1].length === 3) formatted += ")";
  if (match[2]) formatted += ` ${match[2]}`;
  if (match[3]) formatted += `-${match[3]}`;
  if (match[4]) formatted += `-${match[4]}`;

  return formatted;
}

export default function AddBookingModal({ open, onClose, onSuccess }: Props) {
  const [step, setStep] = useState(1);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [loading, setLoading] = useState(false);

  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedDate, setSelectedDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm<ClientInfoForm>({
    resolver: zodResolver(clientInfoSchema),
    defaultValues: {
      clientName: "",
      clientEmail: "",
      clientPhone: "",
      comment: "",
    },
  });

  const phoneValue = watch("clientPhone");

  useEffect(() => {
    if (open) {
      loadDoctors();
    } else {
      resetForm();
    }
  }, [open]);

  useEffect(() => {
    if (selectedDoctor) {
      loadServices();
    }
  }, [selectedDoctor]);

  useEffect(() => {
    if (selectedDoctor && selectedService && selectedDate) {
      loadSlots();
    }
  }, [selectedDoctor, selectedService, selectedDate]);

  const resetForm = () => {
    setStep(1);
    setSelectedDoctor(null);
    setSelectedService(null);
    setSelectedDate(format(new Date(), "yyyy-MM-dd"));
    setSelectedSlot(null);
    reset();
  };

  const loadDoctors = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/doctors/list");
      const data = await res.json();
      setDoctors(data.doctors || []);
    } catch (error) {
      console.error("Failed to load doctors:", error);
      toast.error("Не удалось загрузить врачей");
    } finally {
      setLoading(false);
    }
  };

  const loadServices = async () => {
    if (!selectedDoctor) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/doctors/${selectedDoctor.id}/services`);
      const data = await res.json();
      setServices(data.services || []);
    } catch (error) {
      console.error("Failed to load services:", error);
      toast.error("Не удалось загрузить услуги");
    } finally {
      setLoading(false);
    }
  };

  const loadSlots = async () => {
    if (!selectedDoctor || !selectedService) return;
    setLoading(true);
    try {
      const params = new URLSearchParams({
        serviceId: selectedService.id,
        date: selectedDate,
        doctorId: selectedDoctor.id,
      });
      const res = await fetch(`/api/availability?${params}`);
      const data = await res.json();

      // API returns doctors array with slots
      if (data.doctors && data.doctors.length > 0) {
        setSlots(
          data.doctors[0].slots.map((slot: any) => ({
            startUtc: slot.start,
            endUtc: slot.end,
          }))
        );
      } else {
        setSlots([]);
      }
    } catch (error) {
      console.error("Failed to load slots:", error);
      toast.error("Не удалось загрузить слоты");
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: ClientInfoForm) => {
    if (!selectedDoctor || !selectedService || !selectedSlot) {
      toast.error("Заполните все обязательные поля");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        doctorId: selectedDoctor.id,
        serviceId: selectedService.id,
        start: selectedSlot.startUtc,
        note: data.comment || undefined,
        clientName: data.clientName || undefined,
        clientEmail: data.clientEmail || undefined,
        clientPhone: data.clientPhone || undefined,
      };

      const res = await fetch("/api/admin/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const error = await res.json();
        console.log("API error response:", error);
        const errorMessage = error.message || error.error || "Не удалось создать запись";
        toast.error(errorMessage);
        setLoading(false);
        return;
      }

      toast.success("Запись создана успешно");
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error("Failed to create booking:", error);
      const message = error instanceof Error ? error.message : "Не удалось создать запись";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  // Обработчик изменения телефона с автоформатированием
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value);
    setValue("clientPhone", formatted, { shouldValidate: true });
  };

  return (
    <Dialog.Root open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50" />
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-[clamp(1rem,0.8846rem+0.5128vw,1.5rem)] shadow-2xl z-50 w-[calc(100%-2rem)] max-w-[clamp(36rem,32rem+16vw,52rem)] max-h-[90vh] overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between gap-4 px-[clamp(1.5rem,1.2692rem+1.0256vw,2.5rem)] py-[clamp(1.25rem,1.0192rem+1.0256vw,2.25rem)] border-b border-[#E8E2D5]">
            <Dialog.Title className="flex-1 min-w-0 text-[clamp(1.25rem,1.1346rem+0.5128vw,1.75rem)] font-ManropeBold text-[#4F5338] truncate">Добавить запись</Dialog.Title>
            <Dialog.Close asChild>
              <button
                className="flex-shrink-0 p-1 text-[#636846] hover:text-[#4F5338] transition-colors rounded-lg hover:bg-[#F5F0E4]"
                aria-label="Закрыть"
              >
                <svg className="w-[clamp(1.5rem,1.3846rem+0.5128vw,2rem)] h-[clamp(1.5rem,1.3846rem+0.5128vw,2rem)]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </Dialog.Close>
          </div>

          {/* Content */}
          <div className="overflow-y-auto max-h-[calc(90vh-12rem)] px-[clamp(1.5rem,1.2692rem+1.0256vw,2.5rem)] py-[clamp(1.5rem,1.2692rem+1.0256vw,2.5rem)]">
            {/* Steps */}
            <div className="mb-[clamp(1.5rem,1.2692rem+1.0256vw,2.5rem)] flex items-center gap-2">
              {[1, 2, 3, 4].map((s) => (
                <div key={s} className="flex items-center flex-1">
                  <div
                    className={`w-[clamp(2rem,1.8846rem+0.5128vw,2.5rem)] h-[clamp(2rem,1.8846rem+0.5128vw,2.5rem)] rounded-full flex items-center justify-center text-[clamp(0.875rem,0.8077rem+0.2885vw,1.125rem)] font-ManropeMedium ${
                      step >= s ? "bg-[#5C6744] text-white" : "bg-[#F5F0E4] text-[#9A8F7D]"
                    }`}
                  >
                    {s}
                  </div>
                  {s < 4 && <div className={`flex-1 h-[2px] mx-2 ${step > s ? "bg-[#5C6744]" : "bg-[var(--admin-border)]"}`} />}
                </div>
              ))}
            </div>

          {/* Step 1: Doctor */}
          {step === 1 && (
            <div className="space-y-[clamp(1rem,0.8846rem+0.5128vw,1.5rem)]">
              <h3 className="font-ManropeBold text-[clamp(1rem,0.9423rem+0.2564vw,1.25rem)] text-[#4F5338]">Выберите врача</h3>
              {loading ? (
                <div className="flex justify-center py-[clamp(2rem,1.7692rem+1.0256vw,3rem)]">
                  <div className="w-8 h-8 border-2 border-[#E8E2D5] border-t-[var(--admin-text-accent)] rounded-full animate-spin" />
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-[clamp(0.75rem,0.6346rem+0.5128vw,1.25rem)] max-h-96 overflow-y-auto">
                  {doctors.map((doctor) => (
                    <button
                      key={doctor.id}
                      onClick={() => {
                        setSelectedDoctor(doctor);
                        setStep(2);
                      }}
                      className="p-[clamp(1rem,0.8846rem+0.5128vw,1.5rem)] border border-[#E8E2D5] rounded-[clamp(0.75rem,0.6346rem+0.5128vw,1.25rem)] hover:border-[var(--admin-text-accent)] hover:bg-[#FFFCF3] transition-colors text-left"
                    >
                      <div className="font-ManropeMedium text-[clamp(0.875rem,0.8077rem+0.2885vw,1.125rem)] text-[#4F5338]">{doctor.name}</div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Step 2: Service */}
          {step === 2 && selectedDoctor && (
            <div className="space-y-[clamp(1rem,0.8846rem+0.5128vw,1.5rem)]">
              <div className="flex items-center gap-2">
                <button onClick={() => setStep(1)} className="text-[clamp(0.875rem,0.8077rem+0.2885vw,1.125rem)] font-ManropeRegular text-[#967450] hover:text-[#4F5338] transition-colors">
                  ← {selectedDoctor.name}
                </button>
              </div>
              <h3 className="font-ManropeBold text-[clamp(1rem,0.9423rem+0.2564vw,1.25rem)] text-[#4F5338]">Выберите услугу</h3>
              {loading ? (
                <div className="flex justify-center py-[clamp(2rem,1.7692rem+1.0256vw,3rem)]">
                  <div className="w-8 h-8 border-2 border-[#E8E2D5] border-t-[var(--admin-text-accent)] rounded-full animate-spin" />
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-[clamp(0.75rem,0.6346rem+0.5128vw,1.25rem)] max-h-96 overflow-y-auto">
                  {services.map((service) => (
                    <button
                      key={service.id}
                      onClick={() => {
                        setSelectedService(service);
                        setStep(3);
                      }}
                      className="p-[clamp(1rem,0.8846rem+0.5128vw,1.5rem)] border border-[#E8E2D5] rounded-[clamp(0.75rem,0.6346rem+0.5128vw,1.25rem)] hover:border-[var(--admin-text-accent)] hover:bg-[#FFFCF3] transition-colors text-left"
                    >
                      <div className="font-ManropeMedium text-[clamp(0.875rem,0.8077rem+0.2885vw,1.125rem)] text-[#4F5338]">{service.name}</div>
                      <div className="text-[clamp(0.75rem,0.6923rem+0.2564vw,1rem)] font-ManropeRegular text-[#636846] mt-1">
                        {service.durationMin} мин · {(service.priceCents / 100).toFixed(0)} ₽
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Step 3: Date & Time */}
          {step === 3 && selectedService && (
            <div className="space-y-[clamp(1rem,0.8846rem+0.5128vw,1.5rem)]">
              <div className="flex items-center gap-2">
                <button onClick={() => setStep(2)} className="text-[clamp(0.875rem,0.8077rem+0.2885vw,1.125rem)] font-ManropeRegular text-[#967450] hover:text-[#4F5338] transition-colors">
                  ← {selectedService.name}
                </button>
              </div>
              <h3 className="font-ManropeBold text-[clamp(1rem,0.9423rem+0.2564vw,1.25rem)] text-[#4F5338]">Выберите дату и время</h3>

              <div>
                <label className="block text-[clamp(0.875rem,0.8077rem+0.2885vw,1.125rem)] font-ManropeMedium text-[#4F5338] mb-[clamp(0.5rem,0.4423rem+0.2564vw,0.75rem)]">Дата</label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  min={format(new Date(), "yyyy-MM-dd")}
                  className="w-full px-[clamp(1rem,0.8846rem+0.5128vw,1.5rem)] py-[clamp(0.75rem,0.6346rem+0.5128vw,1.25rem)] bg-[#F5F0E4] border-none rounded-[clamp(0.5rem,0.4423rem+0.2564vw,0.75rem)] text-[clamp(0.875rem,0.8077rem+0.2885vw,1.125rem)] font-ManropeRegular text-[#4F5338] focus:outline-none focus:ring-2 focus:ring-[#967450]"
                />
              </div>

              {loading ? (
                <div className="flex justify-center py-[clamp(2rem,1.7692rem+1.0256vw,3rem)]">
                  <div className="w-8 h-8 border-2 border-[#E8E2D5] border-t-[var(--admin-text-accent)] rounded-full animate-spin" />
                </div>
              ) : slots.length === 0 ? (
                <div className="text-center py-[clamp(2rem,1.7692rem+1.0256vw,3rem)]">
                  <p className="text-[clamp(0.875rem,0.8077rem+0.2885vw,1.125rem)] font-ManropeRegular text-[#636846]">На выбранную дату нет доступных слотов</p>
                </div>
              ) : (
                <div className="grid grid-cols-4 gap-[clamp(0.5rem,0.4423rem+0.2564vw,0.75rem)] max-h-64 overflow-y-auto">
                  {slots.map((slot, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        setSelectedSlot(slot);
                        setStep(4);
                      }}
                      className="px-[clamp(0.75rem,0.6346rem+0.5128vw,1.25rem)] py-[clamp(0.5rem,0.4423rem+0.2564vw,0.75rem)] border border-[#E8E2D5] rounded-[clamp(0.5rem,0.4423rem+0.2564vw,0.75rem)] hover:border-[var(--admin-text-accent)] hover:bg-[#FFFCF3] transition-colors text-[clamp(0.875rem,0.8077rem+0.2885vw,1.125rem)] font-ManropeRegular text-[#4F5338]"
                    >
                      {format(new Date(slot.startUtc), "HH:mm")}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Step 4: Client Info with React Hook Form */}
          {step === 4 && selectedSlot && (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-[clamp(1rem,0.8846rem+0.5128vw,1.5rem)]">
              <div className="flex items-center gap-2">
                <button type="button" onClick={() => setStep(3)} className="text-[clamp(0.875rem,0.8077rem+0.2885vw,1.125rem)] font-ManropeRegular text-[#967450] hover:text-[#4F5338] transition-colors">
                  ← {format(new Date(selectedSlot.startUtc), "d MMM, HH:mm", { locale: ru })}
                </button>
              </div>
              <h3 className="font-ManropeBold text-[clamp(1rem,0.9423rem+0.2564vw,1.25rem)] text-[#4F5338]">Данные клиента</h3>

              {/* Имя */}
              <div>
                <label className="block text-[clamp(0.875rem,0.8077rem+0.2885vw,1.125rem)] font-ManropeMedium text-[#4F5338] mb-[clamp(0.5rem,0.4423rem+0.2564vw,0.75rem)]">
                  Имя <span className="text-[#C74545]">*</span>
                </label>
                <input
                  type="text"
                  {...register("clientName")}
                  placeholder="Иван Иванов"
                  className={`w-full px-[clamp(1rem,0.8846rem+0.5128vw,1.5rem)] py-[clamp(0.75rem,0.6346rem+0.5128vw,1.25rem)] bg-[#F5F0E4] border-none rounded-[clamp(0.5rem,0.4423rem+0.2564vw,0.75rem)] text-[clamp(0.875rem,0.8077rem+0.2885vw,1.125rem)] font-ManropeRegular text-[#4F5338] placeholder:text-[#636846] focus:outline-none focus:ring-2 ${
                    errors.clientName ? "ring-2 ring-[#C74545]" : "focus:ring-[#967450]"
                  }`}
                />
                {errors.clientName && (
                  <p className="mt-1 text-[clamp(0.75rem,0.6923rem+0.2564vw,1rem)] font-ManropeRegular text-[#C74545]">{errors.clientName.message}</p>
                )}
              </div>

              {/* Email */}
              <div>
                <label className="block text-[clamp(0.875rem,0.8077rem+0.2885vw,1.125rem)] font-ManropeMedium text-[#4F5338] mb-[clamp(0.5rem,0.4423rem+0.2564vw,0.75rem)]">Email</label>
                <input
                  type="email"
                  {...register("clientEmail")}
                  placeholder="client@example.com"
                  className={`w-full px-[clamp(1rem,0.8846rem+0.5128vw,1.5rem)] py-[clamp(0.75rem,0.6346rem+0.5128vw,1.25rem)] bg-[#F5F0E4] border-none rounded-[clamp(0.5rem,0.4423rem+0.2564vw,0.75rem)] text-[clamp(0.875rem,0.8077rem+0.2885vw,1.125rem)] font-ManropeRegular text-[#4F5338] placeholder:text-[#636846] focus:outline-none focus:ring-2 ${
                    errors.clientEmail ? "ring-2 ring-[#C74545]" : "focus:ring-[#967450]"
                  }`}
                />
                {errors.clientEmail && (
                  <p className="mt-1 text-[clamp(0.75rem,0.6923rem+0.2564vw,1rem)] font-ManropeRegular text-[#C74545]">{errors.clientEmail.message}</p>
                )}
              </div>

              {/* Телефон с автоформатированием */}
              <div>
                <label className="block text-[clamp(0.875rem,0.8077rem+0.2885vw,1.125rem)] font-ManropeMedium text-[#4F5338] mb-[clamp(0.5rem,0.4423rem+0.2564vw,0.75rem)]">Телефон</label>
                <input
                  type="tel"
                  value={phoneValue || ""}
                  onChange={handlePhoneChange}
                  placeholder="+7 (900) 123-45-67"
                  className={`w-full px-[clamp(1rem,0.8846rem+0.5128vw,1.5rem)] py-[clamp(0.75rem,0.6346rem+0.5128vw,1.25rem)] bg-[#F5F0E4] border-none rounded-[clamp(0.5rem,0.4423rem+0.2564vw,0.75rem)] text-[clamp(0.875rem,0.8077rem+0.2885vw,1.125rem)] font-ManropeRegular text-[#4F5338] placeholder:text-[#636846] focus:outline-none focus:ring-2 ${
                    errors.clientPhone ? "ring-2 ring-[#C74545]" : "focus:ring-[#967450]"
                  }`}
                />
                {errors.clientPhone && (
                  <p className="mt-1 text-[clamp(0.75rem,0.6923rem+0.2564vw,1rem)] font-ManropeRegular text-[#C74545]">{errors.clientPhone.message}</p>
                )}
              </div>

              {/* Комментарий */}
              <div>
                <label className="block text-[clamp(0.875rem,0.8077rem+0.2885vw,1.125rem)] font-ManropeMedium text-[#4F5338] mb-[clamp(0.5rem,0.4423rem+0.2564vw,0.75rem)]">Комментарий</label>
                <textarea
                  {...register("comment")}
                  placeholder="Дополнительная информация"
                  rows={3}
                  className={`w-full px-[clamp(1rem,0.8846rem+0.5128vw,1.5rem)] py-[clamp(0.75rem,0.6346rem+0.5128vw,1.25rem)] bg-[#F5F0E4] border-none rounded-[clamp(0.5rem,0.4423rem+0.2564vw,0.75rem)] text-[clamp(0.875rem,0.8077rem+0.2885vw,1.125rem)] font-ManropeRegular text-[#4F5338] placeholder:text-[#636846] focus:outline-none focus:ring-2 resize-none ${
                    errors.comment ? "ring-2 ring-[#C74545]" : "focus:ring-[#967450]"
                  }`}
                />
                {errors.comment && <p className="mt-1 text-[clamp(0.75rem,0.6923rem+0.2564vw,1rem)] font-ManropeRegular text-[#C74545]">{errors.comment.message}</p>}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-[clamp(0.75rem,0.6346rem+0.5128vw,1.25rem)] pt-[clamp(1rem,0.8846rem+0.5128vw,1.5rem)]">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-[clamp(0.75rem,0.6346rem+0.5128vw,1.25rem)] bg-[#5C6744] text-white rounded-[clamp(0.5rem,0.4423rem+0.2564vw,0.75rem)] text-[clamp(0.875rem,0.8077rem+0.2885vw,1.125rem)] font-ManropeMedium hover:bg-[#4F5938] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? "Создание..." : "Создать запись"}
                </button>
                <Dialog.Close asChild>
                  <button
                    type="button"
                    disabled={loading}
                    className="flex-1 py-[clamp(0.75rem,0.6346rem+0.5128vw,1.25rem)] bg-[#F5F0E4] text-[#967450] rounded-[clamp(0.5rem,0.4423rem+0.2564vw,0.75rem)] text-[clamp(0.875rem,0.8077rem+0.2885vw,1.125rem)] font-ManropeMedium hover:bg-[#E8E2D5] transition-colors"
                  >
                    Отмена
                  </button>
                </Dialog.Close>
              </div>
            </form>
          )}

          {/* Actions для остальных шагов */}
          {step !== 4 && (
            <div className="pt-[clamp(1rem,0.8846rem+0.5128vw,1.5rem)] pb-[clamp(1rem,0.8846rem+0.5128vw,1.5rem)] flex items-center justify-end">
              <Dialog.Close asChild>
                <button className="px-[clamp(1rem,0.8846rem+0.5128vw,1.5rem)] py-[clamp(0.625rem,0.5096rem+0.5128vw,1.125rem)] text-[clamp(0.875rem,0.8077rem+0.2885vw,1.125rem)] font-ManropeMedium text-[#967450] bg-[#F5F0E4] border border-[#E8E2D5] rounded-[clamp(0.5rem,0.4423rem+0.2564vw,0.75rem)] hover:bg-[#E8E2D5] transition-colors">
                  Отмена
                </button>
              </Dialog.Close>
            </div>
          )}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
