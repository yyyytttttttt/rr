"use client";

import { useState, useMemo } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import toast from "react-hot-toast";

type Props = {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
};

const doctorSchema = z
  .object({
    userId: z.string().transform((v) => (v?.trim() ? v.trim() : undefined)).optional(),
    email: z.string().transform((v) => (v?.trim() ? v.trim() : undefined)).optional()
      .refine((v) => !v || /.+@.+\..+/.test(v), { message: "Некорректный email" }),
    title: z.string().transform((v) => (v?.trim() ? v.trim() : undefined)).optional(),
    tzid: z.string().min(1, "Выберите таймзону"),
    minLeadMin: z.coerce.number().int().min(0),
    gridStepMin: z.coerce.number().int().min(1),
    slotDurationMin: z.coerce.number().int().min(1),
    bufferMin: z.coerce.number().int().min(0),
  })
  .refine((d) => !!d.userId || !!d.email, {
    message: "Укажите userId или email",
    path: ["userId"],
  });

type DoctorFormData = {
  userId?: string;
  email?: string;
  title?: string;
  tzid: string;
  minLeadMin: number;
  gridStepMin: number;
  slotDurationMin: number;
  bufferMin: number;
};

export default function AddDoctorModal({ open, onClose, onSuccess }: Props) {
  const [loading, setLoading] = useState(false);

  const defaultTz = useMemo(
    () => Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
    []
  );

  const preferredTzList = useMemo(
    () => [
      "UTC",
      "Europe/Moscow",
      "Europe/Kaliningrad",
      "Europe/Kiev",
      "Europe/Minsk",
      "Europe/Warsaw",
      "Asia/Jerusalem",
      "Asia/Almaty",
      "Asia/Tbilisi",
    ],
    []
  );

  const form = useForm<DoctorFormData>({
    resolver: zodResolver(doctorSchema) as any,
    defaultValues: {
      userId: "",
      email: "",
      title: "",
      tzid: defaultTz,
      minLeadMin: 60,
      gridStepMin: 10,
      slotDurationMin: 30,
      bufferMin: 0,
    },
    mode: "onBlur",
  });

  const onSubmit = async (values: DoctorFormData) => {
    const payload: any = { ...values };
    if (!payload.userId) delete payload.userId;
    if (!payload.email) delete payload.email;
    if (!payload.title) delete payload.title;

    setLoading(true);
    try {
      const res = await fetch("/api/doctors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (res.ok) {
        toast.success("Врач успешно создан");
        form.reset();
        onSuccess?.();
        onClose();
      } else {
        toast.error(data?.error || "Ошибка создания врача");
      }
    } catch (error) {
      console.error("Failed to create doctor:", error);
      toast.error("Ошибка создания");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={(open) => !open && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content className="fixed left-[50%] top-[50%] z-50 max-h-[85vh] w-[90vw] max-w-[600px] translate-x-[-50%] translate-y-[-50%] bg-white rounded-2xl shadow-lg overflow-y-auto data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%]">
          <div className="sticky top-0 bg-white z-10 px-6 py-4 border-b border-[#E8E2D5]">
            <Dialog.Title className="text-xl font-ManropeBold text-[#4F5338]">
              Добавить специалиста
            </Dialog.Title>
            <Dialog.Close className="absolute right-4 top-4 rounded-lg p-2 hover:bg-[#F5F0E4] transition-colors">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M15 5L5 15M5 5L15 15" stroke="#4F5338" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </Dialog.Close>
          </div>

          <form onSubmit={form.handleSubmit(onSubmit)} className="p-6 space-y-4">
            {/* userId or email */}
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col">
                <label className="block text-sm font-ManropeMedium text-[#4F5338] mb-2 h-10 flex items-start">
                  User ID (если пользователь существует)
                </label>
                <input
                  {...form.register("userId")}
                  className="w-full px-4 py-3 border border-[#E8E2D5] rounded-lg text-sm font-ManropeRegular text-[#636846] outline-none focus:border-[#5C6744] transition"
                  placeholder="usr_123"
                />
                <div className="h-5 mt-1">
                  {form.formState.errors.userId && (
                    <p className="text-red-600 text-xs">
                      {form.formState.errors.userId.message}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex flex-col">
                <label className="block text-sm font-ManropeMedium text-[#4F5338] mb-2 h-10 flex items-start">
                  Email (создать нового пользователя)
                </label>
                <input
                  {...form.register("email")}
                  className="w-full px-4 py-3 border border-[#E8E2D5] rounded-lg text-sm font-ManropeRegular text-[#636846] outline-none focus:border-[#5C6744] transition"
                  placeholder="doctor@example.com"
                />
                <div className="h-5 mt-1">
                  {form.formState.errors.email && (
                    <p className="text-red-600 text-xs">
                      {form.formState.errors.email.message}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Title */}
            <div>
              <label className="block text-sm font-ManropeMedium text-[#4F5338] mb-2">
                Должность/специализация
              </label>
              <input
                {...form.register("title")}
                className="w-full px-4 py-3 border border-[#E8E2D5] rounded-lg text-sm font-ManropeRegular text-[#636846] outline-none focus:border-[#5C6744] transition"
                placeholder="Косметолог"
              />
            </div>

            {/* Timezone */}
            <div>
              <label className="block text-sm font-ManropeMedium text-[#4F5338] mb-2">
                Часовой пояс <span className="text-red-600">*</span>
              </label>
              <div className="relative">
                <select
                  {...form.register("tzid")}
                  className="w-full px-4 py-3 border border-[#E8E2D5] rounded-lg text-sm font-ManropeRegular text-[#636846] outline-none focus:border-[#5C6744] transition appearance-none cursor-pointer pr-10"
                >
                  {[...new Set([defaultTz, ...preferredTzList])].map((tz) => (
                    <option key={tz} value={tz}>
                      {tz}
                    </option>
                  ))}
                </select>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M4 6L8 10L12 6" stroke="#4F5338" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              </div>
              {form.formState.errors.tzid && (
                <p className="text-red-600 text-xs mt-1">
                  {form.formState.errors.tzid.message}
                </p>
              )}
            </div>

            {/* Settings Grid */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-ManropeMedium text-[#4F5338] mb-2">
                  Минимальный срок записи (мин)
                </label>
                <input
                  type="number"
                  {...form.register("minLeadMin")}
                  className="w-full px-4 py-3 border border-[#E8E2D5] rounded-lg text-sm font-ManropeRegular text-[#636846] outline-none focus:border-[#5C6744] transition"
                />
              </div>

              <div>
                <label className="block text-sm font-ManropeMedium text-[#4F5338] mb-2">
                  Шаг сетки (мин)
                </label>
                <input
                  type="number"
                  {...form.register("gridStepMin")}
                  className="w-full px-4 py-3 border border-[#E8E2D5] rounded-lg text-sm font-ManropeRegular text-[#636846] outline-none focus:border-[#5C6744] transition"
                />
              </div>

              <div>
                <label className="block text-sm font-ManropeMedium text-[#4F5338] mb-2">
                  Длительность слота (мин)
                </label>
                <input
                  type="number"
                  {...form.register("slotDurationMin")}
                  className="w-full px-4 py-3 border border-[#E8E2D5] rounded-lg text-sm font-ManropeRegular text-[#636846] outline-none focus:border-[#5C6744] transition"
                />
              </div>

              <div>
                <label className="block text-sm font-ManropeMedium text-[#4F5338] mb-2">
                  Буфер между приёмами (мин)
                </label>
                <input
                  type="number"
                  {...form.register("bufferMin")}
                  className="w-full px-4 py-3 border border-[#E8E2D5] rounded-lg text-sm font-ManropeRegular text-[#636846] outline-none focus:border-[#5C6744] transition"
                />
              </div>
            </div>

            {/* Buttons */}
            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-5 py-3 bg-[#5C6744] text-white rounded-lg text-sm font-ManropeMedium hover:bg-[#4F5338] disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                {loading ? "Создание..." : "Создать специалиста"}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-3 bg-[#F5F0E4] text-[#967450] rounded-lg text-sm font-ManropeMedium hover:bg-[#E8E2D5] transition"
              >
                Отмена
              </button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
