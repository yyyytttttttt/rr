"use client";

import { useState, useEffect } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import toast from "react-hot-toast";

type Doctor = {
  id: string;
  name: string;
  title: string | null;
  image: string | null;
};

type LinkedService = {
  id: string;
  name: string;
};

type Props = {
  serviceId: string;
  serviceName: string;
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
};

export default function ManageDoctorsModal({
  serviceId,
  serviceName,
  open,
  onClose,
  onSuccess,
}: Props) {
  const [allDoctors, setAllDoctors] = useState<Doctor[]>([]);
  const [linkedDoctorIds, setLinkedDoctorIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      loadData();
    }
  }, [open, serviceId]);

  const loadData = async () => {
    setLoading(true);
    try {
      // Загружаем всех врачей
      const doctorsRes = await fetch("/api/doctors/list");
      if (doctorsRes.ok) {
        const doctorsData = await doctorsRes.json();
        setAllDoctors(doctorsData.doctors || []);
      }

      // Загружаем связанных врачей для этой услуги
      const linkedRes = await fetch(`/api/services/${serviceId}/doctors`);
      if (linkedRes.ok) {
        const linkedData = await linkedRes.json();
        const ids = new Set(linkedData.doctors.map((d: Doctor) => d.id));
        setLinkedDoctorIds(ids);
      }
    } catch (error) {
      console.error("Failed to load data:", error);
      toast.error("Ошибка загрузки");
    } finally {
      setLoading(false);
    }
  };

  const toggleDoctor = async (doctorId: string) => {
    const isLinked = linkedDoctorIds.has(doctorId);
    setSaving(true);

    try {
      if (isLinked) {
        // Удаляем связь
        const res = await fetch(`/api/admin/doctors/${doctorId}/services/${serviceId}`, {
          method: "DELETE",
        });

        if (res.ok) {
          setLinkedDoctorIds((prev) => {
            const newSet = new Set(prev);
            newSet.delete(doctorId);
            return newSet;
          });
          toast.success("Связь удалена");
        } else {
          throw new Error("Failed to unlink");
        }
      } else {
        // Создаем связь
        const res = await fetch(`/api/admin/doctors/${doctorId}/services`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ serviceId }),
        });

        if (res.ok) {
          setLinkedDoctorIds((prev) => new Set(prev).add(doctorId));
          toast.success("Связь создана");
        } else {
          throw new Error("Failed to link");
        }
      }
    } catch (error) {
      console.error("Toggle error:", error);
      toast.error("Ошибка сохранения");
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    onSuccess();
    onClose();
  };

  return (
    <Dialog.Root open={open} onOpenChange={(open) => !open && handleClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content className="fixed left-[50%] top-[50%] z-50 max-h-[85vh] w-[90vw] max-w-[650px] translate-x-[-50%] translate-y-[-50%] bg-white rounded-2xl shadow-lg overflow-hidden data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%]">
          <div className="sticky top-0 bg-white z-10 px-6 py-4 border-b border-[#E8E2D5]">
            <Dialog.Title className="text-xl font-ManropeBold text-[#4F5338]">
              Назначить врачей
            </Dialog.Title>
            <p className="text-sm text-[#636846] mt-1">
              Услуга: <span className="font-ManropeMedium">{serviceName}</span>
            </p>
            <Dialog.Close className="absolute right-4 top-4 rounded-lg p-2 hover:bg-[#F5F0E4] transition-colors">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M15 5L5 15M5 5L15 15" stroke="#4F5338" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </Dialog.Close>
          </div>

          <div className="p-6 overflow-y-auto max-h-[calc(85vh-140px)]">
            {loading ? (
              <div className="flex justify-center items-center py-12 text-[#636846]">
                <div className="w-5 h-5 border-2 border-[#E8E2D5] border-t-[#5C6744] rounded-full animate-spin mr-3" />
                <span className="text-sm font-ManropeRegular">Загрузка...</span>
              </div>
            ) : allDoctors.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-sm text-[#636846] font-ManropeRegular">
                  Нет врачей в системе. Добавьте врачей сначала.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {allDoctors.map((doctor) => {
                  const isLinked = linkedDoctorIds.has(doctor.id);
                  return (
                    <div
                      key={doctor.id}
                      className={`flex items-center justify-between p-4 border rounded-xl transition-all ${
                        isLinked
                          ? "border-[#5C6744] bg-gradient-to-br from-[#F5F0E4] to-[#FFFCF3]"
                          : "border-[#E8E2D5] bg-white hover:border-[#967450]"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        {doctor.image ? (
                          <img
                            src={doctor.image}
                            alt={doctor.name}
                            className="w-12 h-12 rounded-full object-cover ring-2 ring-white"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-[#F5F0E4] flex items-center justify-center text-xl">
                            👨‍⚕️
                          </div>
                        )}
                        <div>
                          <div className="font-ManropeMedium text-[#4F5338]">{doctor.name}</div>
                          {doctor.title && (
                            <div className="text-xs text-[#636846] font-ManropeRegular">{doctor.title}</div>
                          )}
                        </div>
                      </div>

                      <button
                        onClick={() => toggleDoctor(doctor.id)}
                        disabled={saving}
                        className={`px-4 py-2 rounded-lg font-ManropeMedium text-sm transition-all ${
                          isLinked
                            ? "bg-[#CF5E5E] text-white hover:bg-[#B84E4E]"
                            : "bg-[#5C6744] text-white hover:bg-[#4F5338]"
                        } disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105`}
                      >
                        {isLinked ? "Отвязать" : "Привязать"}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="sticky bottom-0 bg-white px-6 py-4 border-t border-[#E8E2D5]">
            <button
              onClick={handleClose}
              className="w-full px-5 py-3 bg-[#F5F0E4] text-[#967450] rounded-lg text-sm font-ManropeMedium hover:bg-[#E8E2D5] transition-colors"
            >
              Закрыть
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
