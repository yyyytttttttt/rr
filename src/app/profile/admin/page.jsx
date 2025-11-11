'use client'
import React, { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

/**
 * Admin · Doctors & Services (RHF + Zod) — JavaScript version (no TS)
 * + раздел "Проверка расписания (слоты)" — выпадающий список без календаря
 */

// ——— утилиты вывода ———
const fmtMinutes = (m) => `${m} мин`;
const fmtMoney = (cents, currency = "RUB") => {
  const value = (Number(cents || 0) / 100);
  try {
    return new Intl.NumberFormat("ru-RU", { style: "currency", currency }).format(value);
  } catch {
    return `${value.toFixed(2)} ${currency}`;
  }
};
const todayStr = () => {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
};

// ——— схемы ———
const DoctorSchema = z
  .object({
    userId: z.string().transform(v => (v?.trim() ? v.trim() : undefined)).optional(),
    email: z.string().transform(v => (v?.trim() ? v.trim() : undefined)).optional()
      .refine(v => !v || /.+@.+\..+/.test(v), { message: "Некорректный email" }),
    title: z.string().transform(v => (v?.trim() ? v.trim() : undefined)).optional(),
    tzid: z.string().min(1, "Выбери таймзону"),
    minLeadMin: z.coerce.number().int().min(0),
    gridStepMin: z.coerce.number().int().min(1),
    slotDurationMin: z.coerce.number().int().min(1),
    bufferMin: z.coerce.number().int().min(0),
  })
  .refine(d => !!d.userId || !!d.email, {
    message: "Укажи userId или email",
    path: ["userId"],
  });

const ServiceSchema = z.object({
  doctorId: z.string().min(1, "Выбери врача"),
  name: z.string().min(1, "Название обязательно"),
  description: z.string().transform(v => (v?.trim() ? v.trim() : undefined)).optional(),
  priceCents: z.coerce.number().int().min(0),
  currency: z.string().min(1),
  durationMin: z.coerce.number().int().min(1),
  bufferMinOverride: z.union([z.coerce.number().int().min(0), z.literal("")]).optional()
    .transform(v => (v === "" ? undefined : v)),
});

export default function AdminSetupRHF() {
  // ——— списки ———
  const [doctors, setDoctors] = useState([]);
  const [services, setServices] = useState([]);

  // ——— таймзоны ———
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

  // ——— форма врача ———
  const {
    register: registerDoctor,
    handleSubmit: submitDoctor,
    reset: resetDoctor,
    formState: { errors: docErrors, isSubmitting: creatingDoctor },
  } = useForm({
    resolver: zodResolver(DoctorSchema),
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

  async function onCreateDoctor(values) {
    const payload = { ...values };
    if (!payload.userId) delete payload.userId;
    if (!payload.email) delete payload.email;
    if (!payload.title) delete payload.title;

    const res = await fetch("/api/doctors", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.error || "Ошибка создания врача");
    await loadDoctors();
    alert("Врач создан");
    resetDoctor();
  }

  // ——— форма услуги ———
  const {
    register: registerService,
    handleSubmit: submitService,
    reset: resetService,
    watch: watchService,
    setValue: setServiceValue,
    formState: { errors: svcErrors, isSubmitting: creatingService },
  } = useForm({
    resolver: zodResolver(ServiceSchema),
    defaultValues: {
      doctorId: "",
      name: "",
      description: "",
      priceCents: 0,
      currency: "RUB",
      durationMin: 30,
      bufferMinOverride: undefined,
    },
    mode: "onBlur",
  });
  const selectedDoctorId = watchService("doctorId");

  async function onCreateService(values) {
    const payload = { ...values };
    if (payload.bufferMinOverride == null) delete payload.bufferMinOverride;
    if (!payload.description) delete payload.description;

    const res = await fetch("/api/services", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.error || "Ошибка создания услуги");
    alert("Услуга создана");
    await loadServices(values.doctorId);
    resetService({ ...values, name: "", description: "", priceCents: 0, bufferMinOverride: undefined });
  }

  // ——— загрузка списков ———
  async function loadDoctors() {
    const res = await fetch("/api/doctors/list", { cache: "no-store" });
    if (!res.ok) return;
    const data = await res.json();
    setDoctors(data?.items || []);
    if (!watchService("doctorId") && data?.items?.[0]?.id) {
      setServiceValue("doctorId", data.items[0].id, { shouldDirty: true });
      await loadServices(data.items[0].id);
    }
  }
  async function loadServices(docId) {
    const id = docId || watchService("doctorId");
    if (!id) return setServices([]);
    const res = await fetch(`/api/services/list?doctorId=${encodeURIComponent(id)}`, { cache: "no-store" });
    if (!res.ok) return setServices([]);
    const data = await res.json();
    setServices(data?.items || []);
  }

  useEffect(() => { loadDoctors(); }, []);
  useEffect(() => { if (selectedDoctorId) loadServices(selectedDoctorId); }, [selectedDoctorId]);

  const Field = ({ label, error, children }) => (
    <div className="space-y-1">
      {label && <label className="text-sm text-gray-600">{label}</label>}
      {children}
      {error && <div className="text-xs text-red-600">{String(error.message || error)}</div>}
    </div>
  );

  /* ===================================================================
     РАЗДЕЛ: ПРОСМОТР СЛОТОВ БЕЗ КАЛЕНДАРЯ (выпадающее меню)
     =================================================================== */
  const [slotDocId, setSlotDocId] = useState("");
  const [slotSvcId, setSlotSvcId] = useState("");
  const [slotDay, setSlotDay] = useState(todayStr());
  const [slotTz, setSlotTz] = useState(defaultTz);
  const [gridStepMin, setGridStepMin] = useState(10);
  const [minLeadMin, setMinLeadMin] = useState(60);

  const [slots, setSlots] = useState([]);
  const [chosenSlot, setChosenSlot] = useState("");
  const [slotsMeta, setSlotsMeta] = useState(null);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [slotsErr, setSlotsErr] = useState("");

  // когда выбираем врача для слотов — автоматически подставлять первую услугу
  useEffect(() => {
    if (!slotDocId) { setSlotSvcId(""); return; }
    const list = services.filter(s => s.doctorId === slotDocId);
    if (list.length) setSlotSvcId(list[0].id);
    else setSlotSvcId("");
  }, [slotDocId, services]);

  async function fetchSlots() {
    if (!slotDocId || !slotSvcId || !slotDay) return;
    setLoadingSlots(true);
    setSlotsErr("");
    setChosenSlot("");
    try {
      const qs = new URLSearchParams({
        doctorId: slotDocId,
        serviceId: slotSvcId,
        day: slotDay,
        tzid: slotTz,
        gridStepMin: String(gridStepMin || 10),
        minLeadMin: String(minLeadMin || 0),
      }).toString();
      const res = await fetch(`/api/slots?${qs}`, { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Не удалось загрузить слоты");
      setSlots(data?.slots || []);
      setSlotsMeta(data?.meta || null);
    } catch (e) {
      setSlots([]);
      setSlotsMeta(null);
      setSlotsErr(e.message);
    } finally {
      setLoadingSlots(false);
    }
  }

  function copySelectedSlot() {
    if (!chosenSlot) return;
    const obj = slots.find(s => s.startUtc === chosenSlot || s.startLocal === chosenSlot);
    const text = obj?.startUtc || chosenSlot;
    navigator.clipboard?.writeText(text);
    alert(`Слот скопирован:\n${text}`);
  }

  return (
    <div className="mx-auto max-w-5xl p-6 space-y-10">
      <h1 className="text-2xl font-semibold">Админ · Врачи и услуги (RHF + Zod, JS)</h1>

      {/* Create Doctor */}
      <section className="rounded-2xl border bg-white p-5 shadow-sm">
        <h2 className="text-lg font-medium mb-4">Создать врача</h2>
        <form onSubmit={submitDoctor(onCreateDoctor)} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="userId (если уже есть)" error={docErrors.userId}>
            <input className="w-full rounded border px-3 py-2" placeholder="usr_123" {...registerDoctor("userId")} />
          </Field>
          <Field label="email (если создать нового)" error={docErrors.email}>
            <input className="w-full rounded border px-3 py-2" placeholder="doc@example.com" {...registerDoctor("email")} />
          </Field>
          <Field label="Должность/титул" error={docErrors.title}>
            <input className="w-full rounded border px-3 py-2" placeholder="Косметолог" {...registerDoctor("title")} />
          </Field>
          <Field label="Таймзона" error={docErrors.tzid}>
            <select className="w-full rounded border px-3 py-2" {...registerDoctor("tzid")}>
              {[...new Set([defaultTz, ...preferredTzList])].map((tz) => (
                <option key={tz} value={tz}>{tz}</option>
              ))}
            </select>
          </Field>
          <Field label="Min lead (мин)" error={docErrors.minLeadMin}>
            <input type="number" className="w-full rounded border px-3 py-2" {...registerDoctor("minLeadMin")} />
          </Field>
          <Field label="Шаг сетки (мин)" error={docErrors.gridStepMin}>
            <input type="number" className="w-full rounded border px-3 py-2" {...registerDoctor("gridStepMin")} />
          </Field>
          <Field label="Длит. слота (мин)" error={docErrors.slotDurationMin}>
            <input type="number" className="w-full rounded border px-3 py-2" {...registerDoctor("slotDurationMin")} />
          </Field>
          <Field label="Буфер врача (мин)" error={docErrors.bufferMin}>
            <input type="number" className="w-full rounded border px-3 py-2" {...registerDoctor("bufferMin")} />
          </Field>

          <div className="md:col-span-2 mt-2 flex gap-2">
            <button type="submit" className="rounded-lg bg-black px-4 py-2 text-white disabled:opacity-60" disabled={creatingDoctor}>
              {creatingDoctor ? "Создание…" : "Создать врача"}
            </button>
            <button type="button" onClick={loadDoctors} className="rounded-lg border px-4 py-2">
              Обновить список
            </button>
          </div>
        </form>
      </section>

      {/* Doctors list */}
      <section className="rounded-2xl border bg-white p-5 shadow-sm">
        <h2 className="text-lg font-medium mb-4">Врачи</h2>
        {doctors.length === 0 ? (
          <div className="text-gray-500">Пока пусто</div>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {doctors.map((d) => {
              const displayName = d.user?.name || d.title || "Врач";
              const subtitle = d.user?.email ? `${d.tzid} • ${d.user.email}` : d.tzid;
              return (
                <div key={d.id} className="rounded-xl border p-4">
                  <div className="font-medium capitalize">{displayName}</div>
                  <div className="text-sm text-gray-600">{subtitle}</div>
                  <div className="mt-2 space-y-1 text-sm text-gray-700">
                    <div>Минимальный срок записи: <b>{fmtMinutes(d.minLeadMin)}</b></div>
                    <div>Шаг сетки: <b>{fmtMinutes(d.gridStepMin)}</b></div>
                    <div>Стандартная длительность приёма: <b>{fmtMinutes(d.slotDurationMin)}</b></div>
                    <div>Технический буфер между визитами: <b>{fmtMinutes(d.bufferMin)}</b></div>
                  </div>
                  <details className="mt-2 text-xs text-gray-500">
                    <summary className="cursor-pointer select-none">Технические детали</summary>
                    <div className="mt-1">ID: <span className="font-mono break-all">{d.id}</span></div>
                  </details>
                  <div className="mt-3">
                    <button
                      className={`rounded border px-3 py-1 ${selectedDoctorId===d.id?"bg-black text-white":""}`}
                      onClick={() => setServiceValue("doctorId", d.id, { shouldDirty: true, shouldValidate: true })}
                    >
                      Выбрать врача для создания услуги
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Create Service */}
      <section className="rounded-2xl border bg-white p-5 shadow-sm">
        <h2 className="text-lg font-medium mb-4">Создать услугу</h2>
        <form onSubmit={submitService(onCreateService)} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Врач" error={svcErrors.doctorId}>
            <select className="w-full rounded border px-3 py-2" {...registerService("doctorId")}>
              <option value="">— выбери врача —</option>
              {doctors.map((d) => (
                <option key={d.id} value={d.id}>{d.title || d.id}</option>
              ))}
            </select>
          </Field>
          <Field label="Название" error={svcErrors.name}>
            <input className="w-full rounded border px-3 py-2" placeholder="Ультразвуковая чистка" {...registerService("name")} />
          </Field>
          <Field label="Валюта" error={svcErrors.currency}>
            <input className="w-full rounded border px-3 py-2" placeholder="RUB" {...registerService("currency")} />
          </Field>
          <Field label="Описание" error={svcErrors.description}>
            <textarea className="w-full rounded border px-3 py-2 md:col-span-2" rows={3} placeholder="Короткое описание" {...registerService("description")} />
          </Field>
          <Field label="Цена (в копейках/центах)" error={svcErrors.priceCents}>
            <input type="number" className="w-full rounded border px-3 py-2" {...registerService("priceCents")} />
          </Field>
          <Field label="Длительность (мин)" error={svcErrors.durationMin}>
            <input type="number" className="w-full rounded border px-3 py-2" {...registerService("durationMin")} />
          </Field>
          <Field label="Буфер услуги (мин, опц.)" error={svcErrors.bufferMinOverride}>
            <input type="number" className="w-full rounded border px-3 py-2" placeholder="например, 15" {...registerService("bufferMinOverride")} />
          </Field>

          <div className="md:col-span-2 mt-2 flex gap-2">
            <button type="submit" className="rounded-lg bg-black px-4 py-2 text-white disabled:opacity-60" disabled={creatingService}>
              {creatingService ? "Создание…" : "Создать услугу"}
            </button>
            <button type="button" onClick={() => loadServices()} className="rounded-lg border px-4 py-2" disabled={!selectedDoctorId}>
              Обновить услуги
            </button>
          </div>
        </form>

        {/* Services list */}
        <div className="mt-6">
          <h3 className="font-medium mb-2">Услуги выбранного врача</h3>
          {services.length === 0 ? (
            <div className="text-gray-500">Пока услуг нет</div>
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {services.map((s) => (
                <div key={s.id} className="rounded-xl border p-4">
                  <div className="font-medium">{s.name}</div>
                  {s.description && <div className="text-sm text-gray-700 mt-1">{s.description}</div>}
                  <div className="text-sm text-gray-600 mt-2">Длительность: <b>{fmtMinutes(s.durationMin)}</b></div>
                  <div className="text-sm text-gray-600">Стоимость: <b>{fmtMoney(s.priceCents, s.currency)}</b></div>
                  {s.bufferMinOverride != null && (
                    <div className="text-sm text-gray-600">Буфер услуги: <b>{fmtMinutes(s.bufferMinOverride)}</b></div>
                  )}
                  <details className="mt-2 text-xs text-gray-500">
                    <summary className="cursor-pointer select-none">Технические детали</summary>
                    <div className="mt-1">ID услуги: <span className="font-mono break-all">{s.id}</span></div>
                  </details>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ======================= СЛОТЫ (без календаря) ======================= */}
      <section className="rounded-2xl border bg-white p-5 shadow-sm">
        <h2 className="text-lg font-medium mb-4">Проверка расписания (слоты)</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-sm text-gray-600">Врач</label>
            <select className="w-full rounded border px-3 py-2"
              value={slotDocId}
              onChange={(e) => setSlotDocId(e.target.value)}
            >
              <option value="">— выбери врача —</option>
              {doctors.map((d) => (
                <option key={d.id} value={d.id}>
                  {(d.user?.name || d.title || "Врач")} — {d.tzid}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-sm text-gray-600">Услуга</label>
            <select className="w-full rounded border px-3 py-2"
              value={slotSvcId}
              onChange={(e) => setSlotSvcId(e.target.value)}
              disabled={!slotDocId}
            >
              <option value="">— выбери услугу —</option>
              {services.filter(s => s.doctorId === slotDocId).map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} · {fmtMinutes(s.durationMin)}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-sm text-gray-600">День</label>
            <input type="date" className="w-full rounded border px-3 py-2"
              value={slotDay}
              onChange={(e) => setSlotDay(e.target.value)}
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm text-gray-600">Таймзона</label>
            <select className="w-full rounded border px-3 py-2"
              value={slotTz}
              onChange={(e) => setSlotTz(e.target.value)}
            >
              {[...new Set([defaultTz, ...preferredTzList])].map((tz) => (
                <option key={tz} value={tz}>{tz}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-sm text-gray-600">Шаг сетки (мин, опц.)</label>
            <input type="number" className="w-full rounded border px-3 py-2"
              value={gridStepMin} onChange={(e) => setGridStepMin(Number(e.target.value || 10))}
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm text-gray-600">Мин. lead time (мин, опц.)</label>
            <input type="number" className="w-full rounded border px-3 py-2"
              value={minLeadMin} onChange={(e) => setMinLeadMin(Number(e.target.value || 0))}
            />
          </div>
        </div>

        <div className="mt-3 flex gap-2">
          <button
            className="rounded-lg bg-black px-4 py-2 text-white disabled:opacity-60"
            onClick={fetchSlots}
            disabled={!slotDocId || !slotSvcId || !slotDay || loadingSlots}
          >
            {loadingSlots ? "Загрузка…" : "Показать слоты"}
          </button>
          <button
            className="rounded-lg border px-4 py-2 disabled:opacity-60"
            onClick={copySelectedSlot}
            disabled={!chosenSlot}
          >
            Скопировать выбранный слот (UTC)
          </button>
        </div>

        {slotsErr && <div className="mt-3 text-sm text-rose-600">Ошибка: {slotsErr}</div>}

        <div className="mt-4 space-y-3">
          <div className="space-y-1">
            <label className="text-sm text-gray-600">Доступные слоты</label>
            <select
              className="w-full rounded border px-3 py-2"
              size={Math.min(10, Math.max(3, slots.length))}
              value={chosenSlot}
              onChange={(e) => setChosenSlot(e.target.value)}
            >
              {slots.length === 0 && <option value="">— нет слотов —</option>}
              {slots.map((s) => (
                // value — UTC ISO (удобно использовать для создания booking)
                <option key={s.startUtc} value={s.startUtc}>
                  {s.label} ({s.startLocal})
                </option>
              ))}
            </select>
          </div>

          {slotsMeta && (
            <div className="text-sm text-gray-600">
              <div>Таймзона: <b>{slotsMeta.tzid}</b></div>
              <div>Длительность услуги: <b>{fmtMinutes(slotsMeta.durationMin)}</b></div>
              <div>Буфер врача: <b>{fmtMinutes(slotsMeta.bufferMin)}</b></div>
              <div>Шаг сетки: <b>{fmtMinutes(slotsMeta.gridStepMin)}</b></div>
              <div>Мин. lead time: <b>{fmtMinutes(slotsMeta.minLeadMin)}</b></div>
              <div>Найдено слотов: <b>{slots.length}</b></div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
