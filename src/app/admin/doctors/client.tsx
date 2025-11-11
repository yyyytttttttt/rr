"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import toast from "react-hot-toast";

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

type Doctor = {
  id: string;
  title: string | null;
  tzid: string;
  minLeadMin: number;
  gridStepMin: number;
  slotDurationMin: number;
  bufferMin: number;
  user?: {
    name: string | null;
    email: string | null;
  };
};

export default function AdminDoctorsClient() {
  const router = useRouter();
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);

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
    resolver: zodResolver(doctorSchema),
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

  useEffect(() => {
    loadDoctors();
  }, []);

  const loadDoctors = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/doctors/list", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        setDoctors(data?.items || []);
      } else {
        toast.error("Не удалось загрузить врачей");
      }
    } catch (error) {
      console.error("Failed to load doctors:", error);
      toast.error("Ошибка загрузки");
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (values: DoctorFormData) => {
    const payload: any = { ...values };
    if (!payload.userId) delete payload.userId;
    if (!payload.email) delete payload.email;
    if (!payload.title) delete payload.title;

    try {
      const res = await fetch("/api/doctors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (res.ok) {
        toast.success("Врач создан");
        form.reset();
        loadDoctors();
      } else {
        toast.error(data?.error || "Ошибка создания врача");
      }
    } catch (error) {
      console.error("Failed to create doctor:", error);
      toast.error("Ошибка создания");
    }
  };

  const fmtMinutes = (m: number) => `${m} мин`;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8 flex items-center justify-center">
        <p className="text-gray-600">Загрузка...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <button
          onClick={() => router.push("/admin")}
          className="text-blue-600 hover:underline mb-4"
        >
          ← Назад в админку
        </button>

        <h1 className="text-3xl font-bold">Управление врачами</h1>

        {/* Create doctor form */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Создать врача</h2>
          <form onSubmit={form.handleSubmit(onSubmit)} className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                userId (если уже есть User)
              </label>
              <input
                {...form.register("userId")}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="usr_123"
              />
              {form.formState.errors.userId && (
                <p className="text-red-500 text-sm mt-1">
                  {form.formState.errors.userId.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                email (если создать нового User)
              </label>
              <input
                {...form.register("email")}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="doc@example.com"
              />
              {form.formState.errors.email && (
                <p className="text-red-500 text-sm mt-1">
                  {form.formState.errors.email.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Должность/титул</label>
              <input
                {...form.register("title")}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Косметолог"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Таймзона <span className="text-red-500">*</span>
              </label>
          <div className="relative">
            <select
                {...form.register("tzid")}
                className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none w-full pr-12 cursor-pointer"
              >
                {[...new Set([defaultTz, ...preferredTzList])].map((tz) => (
                  <option key={tz} value={tz}>
                    {tz}
                  </option>
                ))}
              </select>
            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M4 6L8 10L12 6" stroke="#4F5338" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
          </div>
              {form.formState.errors.tzid && (
                <p className="text-red-500 text-sm mt-1">
                  {form.formState.errors.tzid.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Минимальный срок записи (мин)
              </label>
              <input
                type="number"
                {...form.register("minLeadMin")}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Шаг сетки (мин)</label>
              <input
                type="number"
                {...form.register("gridStepMin")}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Длительность слота (мин)
              </label>
              <input
                type="number"
                {...form.register("slotDurationMin")}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Буфер между приёмами (мин)
              </label>
              <input
                type="number"
                {...form.register("bufferMin")}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="md:col-span-2 flex gap-2">
              <button
                type="submit"
                disabled={form.formState.isSubmitting}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-60"
              >
                {form.formState.isSubmitting ? "Создание..." : "Создать врача"}
              </button>
              <button
                type="button"
                onClick={loadDoctors}
                className="px-4 py-2 border rounded-lg hover:bg-gray-50"
              >
                Обновить список
              </button>
            </div>
          </form>
        </div>

        {/* Doctors list */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Врачи</h2>
          {doctors.length === 0 ? (
            <p className="text-gray-500">Пока нет врачей</p>
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              {doctors.map((d) => {
                const displayName = d.user?.name || d.title || "Врач";
                const subtitle = d.user?.email ? `${d.tzid} • ${d.user.email}` : d.tzid;

                return (
                  <div key={d.id} className="border rounded-lg p-4">
                    <div className="font-semibold text-lg">{displayName}</div>
                    <div className="text-sm text-gray-600">{subtitle}</div>
                    <div className="mt-3 space-y-1 text-sm">
                      <div>
                        Минимальный срок записи: <b>{fmtMinutes(d.minLeadMin)}</b>
                      </div>
                      <div>
                        Шаг сетки: <b>{fmtMinutes(d.gridStepMin)}</b>
                      </div>
                      <div>
                        Длительность приёма: <b>{fmtMinutes(d.slotDurationMin)}</b>
                      </div>
                      <div>
                        Буфер: <b>{fmtMinutes(d.bufferMin)}</b>
                      </div>
                    </div>
                    <div className="mt-4 flex gap-2">
                      <button
                        onClick={() => router.push(`/admin/doctors/${d.id}/services`)}
                        className="text-sm px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                      >
                        Управление услугами
                      </button>
                      <button
                        onClick={() => router.push(`/doctor/calendar`)}
                        className="text-sm px-3 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200"
                      >
                        Календарь
                      </button>
                    </div>
                    <details className="mt-2 text-xs text-gray-500">
                      <summary className="cursor-pointer">ID</summary>
                      <div className="mt-1 font-mono break-all">{d.id}</div>
                    </details>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
