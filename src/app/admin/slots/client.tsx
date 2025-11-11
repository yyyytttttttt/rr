"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

type Doctor = {
  id: string;
  title: string | null;
  tzid: string;
  user?: { name: string | null };
};

type Service = {
  id: string;
  name: string;
  durationMin: number;
};

type Slot = {
  startUtc: string;
  startLocal: string;
  label: string;
};

type SlotMeta = {
  tzid: string;
  durationMin: number;
  bufferMin: number;
  gridStepMin: number;
  minLeadMin: number;
};

export default function AdminSlotsClient() {
  const router = useRouter();
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [allServices, setAllServices] = useState<Service[]>([]);
  const [slotDocId, setSlotDocId] = useState("");
  const [slotSvcId, setSlotSvcId] = useState("");
  const [slotDay, setSlotDay] = useState(todayStr());
  const [slotTz, setSlotTz] = useState(defaultTz());
  const [gridStepMin, setGridStepMin] = useState(10);
  const [minLeadMin, setMinLeadMin] = useState(60);

  const [slots, setSlots] = useState<Slot[]>([]);
  const [chosenSlot, setChosenSlot] = useState("");
  const [slotsMeta, setSlotsMeta] = useState<SlotMeta | null>(null);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [slotsErr, setSlotsErr] = useState("");

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

  useEffect(() => {
    loadDoctors();
  }, []);

  useEffect(() => {
    if (slotDocId) {
      loadServices(slotDocId);
    } else {
      setAllServices([]);
      setSlotSvcId("");
    }
  }, [slotDocId]);

  const loadDoctors = async () => {
    try {
      const res = await fetch("/api/doctors/list", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        setDoctors(data?.items || []);
      }
    } catch (error) {
      console.error("Failed to load doctors:", error);
    }
  };

  const loadServices = async (doctorId: string) => {
    try {
      const res = await fetch(`/api/doctors/${doctorId}/services`, { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        setAllServices(data?.services || []);
        if (data?.services?.length > 0) {
          setSlotSvcId(data.services[0].id);
        }
      }
    } catch (error) {
      console.error("Failed to load services:", error);
      setAllServices([]);
    }
  };

  const fetchSlots = async () => {
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
      toast.success(`Найдено слотов: ${data?.slots?.length || 0}`);
    } catch (e: any) {
      setSlots([]);
      setSlotsMeta(null);
      setSlotsErr(e.message);
      toast.error(e.message);
    } finally {
      setLoadingSlots(false);
    }
  };

  const copySelectedSlot = () => {
    if (!chosenSlot) return;
    const obj = slots.find((s) => s.startUtc === chosenSlot);
    const text = obj?.startUtc || chosenSlot;
    navigator.clipboard?.writeText(text);
    toast.success(`Слот скопирован: ${text}`);
  };

  const fmtMinutes = (m: number) => `${m} мин`;

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        <button
          onClick={() => router.push("/admin")}
          className="text-blue-600 hover:underline mb-4"
        >
          ← Назад в админку
        </button>

        <h1 className="text-3xl font-bold">Проверка расписания (слоты)</h1>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Врач</label>
          <div className="relative">
            <select
                className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none w-full pr-12 cursor-pointer"
                value={slotDocId}
                onChange={(e) => setSlotDocId(e.target.value)}
              >
                <option value="">— выберите врача —</option>
                {doctors.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.user?.name || d.title || "Врач"} — {d.tzid}
                  </option>
                ))}
              </select>
            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M4 6L8 10L12 6" stroke="#4F5338" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
          </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Услуга</label>
          <div className="relative">
            <select
                className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none w-full pr-12 cursor-pointer"
                value={slotSvcId}
                onChange={(e) => setSlotSvcId(e.target.value)}
                disabled={!slotDocId}
              >
                <option value="">— выберите услугу —</option>
                {allServices.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} · {fmtMinutes(s.durationMin)}
                  </option>
                ))}
              </select>
            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M4 6L8 10L12 6" stroke="#4F5338" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
          </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">День</label>
              <input
                type="date"
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={slotDay}
                onChange={(e) => setSlotDay(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Таймзона</label>
          <div className="relative">
            <select
                className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none w-full pr-12 cursor-pointer"
                value={slotTz}
                onChange={(e) => setSlotTz(e.target.value)}
              >
                {[...new Set([defaultTz(), ...preferredTzList])].map((tz) => (
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
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Шаг сетки (мин, опционально)
              </label>
              <input
                type="number"
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={gridStepMin}
                onChange={(e) => setGridStepMin(Number(e.target.value || 10))}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Min lead time (мин, опционально)
              </label>
              <input
                type="number"
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={minLeadMin}
                onChange={(e) => setMinLeadMin(Number(e.target.value || 0))}
              />
            </div>
          </div>

          <div className="mt-4 flex gap-2">
            <button
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-60"
              onClick={fetchSlots}
              disabled={!slotDocId || !slotSvcId || !slotDay || loadingSlots}
            >
              {loadingSlots ? "Загрузка..." : "Показать слоты"}
            </button>
            <button
              className="px-4 py-2 border rounded-lg hover:bg-gray-50 disabled:opacity-60"
              onClick={copySelectedSlot}
              disabled={!chosenSlot}
            >
              Скопировать выбранный слот (UTC)
            </button>
          </div>

          {slotsErr && (
            <div className="mt-3 text-sm text-red-600">Ошибка: {slotsErr}</div>
          )}

          <div className="mt-4 space-y-3">
            <div>
              <label className="block text-sm font-medium mb-1">Доступные слоты</label>
          <div className="relative">
            <select
                className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none w-full pr-12 cursor-pointer"
                size={Math.min(10, Math.max(3, slots.length))}
                value={chosenSlot}
                onChange={(e) => setChosenSlot(e.target.value)}
              >
                {slots.length === 0 && <option value="">— нет слотов —</option>}
                {slots.map((s) => (
                  <option key={s.startUtc} value={s.startUtc}>
                    {s.label} ({s.startLocal})
                  </option>
                ))}
              </select>
            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M4 6L8 10L12 6" stroke="#4F5338" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
          </div>
            </div>

            {slotsMeta && (
              <div className="text-sm text-gray-600 space-y-1">
                <div>
                  Таймзона: <b>{slotsMeta.tzid}</b>
                </div>
                <div>
                  Длительность услуги: <b>{fmtMinutes(slotsMeta.durationMin)}</b>
                </div>
                <div>
                  Буфер врача: <b>{fmtMinutes(slotsMeta.bufferMin)}</b>
                </div>
                <div>
                  Шаг сетки: <b>{fmtMinutes(slotsMeta.gridStepMin)}</b>
                </div>
                <div>
                  Min lead time: <b>{fmtMinutes(slotsMeta.minLeadMin)}</b>
                </div>
                <div>
                  Найдено слотов: <b>{slots.length}</b>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function todayStr() {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function defaultTz() {
  return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
}
