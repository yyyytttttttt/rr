"use client";

import { useState, useEffect } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import toast from "react-hot-toast";

type Props = {
  open: boolean;
  onClose: () => void;
  doctorId: string;
  doctorName: string;
};

type Service = {
  id: string;
  name: string;
  description: string | null;
  priceCents: number;
  currency: string;
  durationMin: number;
  bufferMin: number | null;
  category: { id: string; name: string } | null;
};

type DoctorService = {
  serviceId: string;
  service: Service;
};

type AvailableService = {
  id: string;
  name: string;
  description: string | null;
  priceCents: number;
  currency: string;
  durationMin: number;
  category: { id: string; name: string } | null;
};

export default function DoctorServicesModal({ open, onClose, doctorId, doctorName }: Props) {
  const [doctorServices, setDoctorServices] = useState<DoctorService[]>([]);
  const [availableServices, setAvailableServices] = useState<AvailableService[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [showAddServices, setShowAddServices] = useState(false);
  const [selectedServices, setSelectedServices] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (open && doctorId) {
      loadServices();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, doctorId]);

  const loadServices = async () => {
    setLoading(true);
    try {
      // Загружаем услуги врача
      const doctorRes = await fetch(`/api/doctors/${doctorId}/services`);
      if (!doctorRes.ok) throw new Error("Failed to fetch doctor services");
      const doctorData = await doctorRes.json();
      setDoctorServices(doctorData.services || []);

      // Загружаем все доступные услуги
      const allRes = await fetch("/api/services/catalog");
      if (!allRes.ok) throw new Error("Failed to fetch all services");
      const allData = await allRes.json();

      // Фильтруем услуги, которые еще не привязаны к врачу
      const doctorServiceIds = new Set((doctorData.services || []).map((ds: DoctorService) => ds.serviceId));
      const available = (allData.services || []).filter((s: AvailableService) => !doctorServiceIds.has(s.id));
      setAvailableServices(available);
    } catch (error) {
      console.error("Failed to load services:", error);
      toast.error("Не удалось загрузить услуги");
    } finally {
      setLoading(false);
    }
  };

  const handleAddServices = async () => {
    if (selectedServices.size === 0) {
      toast.error("Выберите хотя бы одну услугу");
      return;
    }

    setUpdating(true);
    try {
      const res = await fetch(`/api/doctors/${doctorId}/services`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ serviceIds: Array.from(selectedServices) }),
      });

      if (!res.ok) throw new Error("Failed to add services");

      toast.success("Услуги добавлены");
      setSelectedServices(new Set());
      setShowAddServices(false);
      loadServices();
    } catch (error) {
      console.error("Failed to add services:", error);
      toast.error("Не удалось добавить услуги");
    } finally {
      setUpdating(false);
    }
  };

  const handleRemoveService = async (serviceId: string) => {
    if (!confirm("Вы уверены что хотите удалить эту услугу?")) return;

    setUpdating(true);
    try {
      const res = await fetch(`/api/doctors/${doctorId}/services/${serviceId}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Failed to remove service");

      toast.success("Услуга удалена");
      loadServices();
    } catch (error) {
      console.error("Failed to remove service:", error);
      toast.error("Не удалось удалить услугу");
    } finally {
      setUpdating(false);
    }
  };

  const toggleServiceSelection = (serviceId: string) => {
    const newSelection = new Set(selectedServices);
    if (newSelection.has(serviceId)) {
      newSelection.delete(serviceId);
    } else {
      newSelection.add(serviceId);
    }
    setSelectedServices(newSelection);
  };

  return (
    <Dialog.Root open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50" />
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-[clamp(1rem,0.8846rem+0.5128vw,1.5rem)] shadow-2xl z-50 w-[calc(100%-2rem)] max-w-[clamp(36rem,32rem+16vw,52rem)] max-h-[95vh] overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between gap-4 px-[clamp(1.5rem,1.2692rem+1.0256vw,2.5rem)] py-[clamp(1.25rem,1.0192rem+1.0256vw,2.25rem)] border-b border-[#E8E2D5]">
            <Dialog.Title className="flex-1 min-w-0 text-[clamp(1.25rem,1.1346rem+0.5128vw,1.75rem)] font-ManropeBold text-[#4F5338] truncate">
              Услуги - {doctorName}
            </Dialog.Title>
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
            {loading ? (
              <div className="flex justify-center items-center py-[clamp(3rem,2.5385rem+2.0513vw,5rem)]">
                <div className="w-8 h-8 border-2 border-[#E8E2D5] border-t-[var(--admin-text-accent)] rounded-full animate-spin" />
              </div>
            ) : (
              <div className="space-y-[clamp(1.25rem,1.0192rem+1.0256vw,2.25rem)]">
                {/* Кнопка добавления */}
                {!showAddServices && (
                  <button
                    onClick={() => setShowAddServices(true)}
                    className="w-full px-[clamp(1rem,0.8846rem+0.5128vw,1.5rem)] py-[clamp(0.75rem,0.6346rem+0.5128vw,1.25rem)] bg-[#5C6744] text-white rounded-[clamp(0.5rem,0.4423rem+0.2564vw,0.75rem)] text-[clamp(0.875rem,0.8077rem+0.2885vw,1.125rem)] font-ManropeMedium hover:bg-[#4F5938] transition-colors"
                  >
                    + Добавить услуги
                  </button>
                )}

                {/* Форма добавления услуг */}
                {showAddServices && (
                  <div className="bg-[#FFFCF3] rounded-[clamp(0.75rem,0.6346rem+0.5128vw,1.25rem)] p-[clamp(1rem,0.8846rem+0.5128vw,1.5rem)] border border-[#E8E2D5]">
                    <h3 className="text-[clamp(0.875rem,0.8077rem+0.2885vw,1.125rem)] font-ManropeBold text-[#4F5338] mb-[clamp(0.75rem,0.6346rem+0.5128vw,1.25rem)]">
                      Выберите услуги для добавления
                    </h3>

                    {availableServices.length === 0 ? (
                      <p className="text-[clamp(0.875rem,0.8077rem+0.2885vw,1.125rem)] font-ManropeRegular text-[#636846] text-center py-4">
                        Все доступные услуги уже добавлены
                      </p>
                    ) : (
                      <>
                        <div className="space-y-2 max-h-64 overflow-y-auto mb-4">
                          {availableServices.map((service) => (
                            <label
                              key={service.id}
                              className="flex items-start gap-3 p-3 bg-white rounded-lg border border-[#E8E2D5] hover:border-[#967450] cursor-pointer transition-colors"
                            >
                              <input
                                type="checkbox"
                                checked={selectedServices.has(service.id)}
                                onChange={() => toggleServiceSelection(service.id)}
                                className="mt-1 w-4 h-4 text-[#5C6744] rounded focus:ring-[#967450]"
                              />
                              <div className="flex-1 min-w-0">
                                <div className="font-ManropeMedium text-[clamp(0.875rem,0.8077rem+0.2885vw,1.125rem)] text-[#4F5338]">
                                  {service.name}
                                </div>
                                {service.description && (
                                  <div className="text-[clamp(0.75rem,0.6923rem+0.2564vw,1rem)] font-ManropeRegular text-[#636846] mt-1 line-clamp-2">
                                    {service.description}
                                  </div>
                                )}
                                <div className="flex items-center gap-3 mt-2 text-[clamp(0.75rem,0.6923rem+0.2564vw,1rem)] font-ManropeRegular text-[#636846]">
                                  <span>{service.durationMin} мин</span>
                                  <span>•</span>
                                  <span className="font-ManropeMedium text-[#4F5338]">
                                    {(service.priceCents / 100).toLocaleString("ru-RU")} {service.currency}
                                  </span>
                                </div>
                              </div>
                            </label>
                          ))}
                        </div>

                        <div className="flex gap-3">
                          <button
                            onClick={handleAddServices}
                            disabled={updating || selectedServices.size === 0}
                            className="flex-1 px-[clamp(1rem,0.8846rem+0.5128vw,1.5rem)] py-[clamp(0.625rem,0.5096rem+0.5128vw,1.125rem)] bg-[#5C6744] text-white rounded-[clamp(0.5rem,0.4423rem+0.2564vw,0.75rem)] text-[clamp(0.875rem,0.8077rem+0.2885vw,1.125rem)] font-ManropeMedium hover:bg-[#4F5938] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {updating ? "Добавление..." : `Добавить (${selectedServices.size})`}
                          </button>
                          <button
                            onClick={() => {
                              setShowAddServices(false);
                              setSelectedServices(new Set());
                            }}
                            disabled={updating}
                            className="flex-1 px-[clamp(1rem,0.8846rem+0.5128vw,1.5rem)] py-[clamp(0.625rem,0.5096rem+0.5128vw,1.125rem)] bg-[#F5F0E4] text-[#967450] rounded-[clamp(0.5rem,0.4423rem+0.2564vw,0.75rem)] text-[clamp(0.875rem,0.8077rem+0.2885vw,1.125rem)] font-ManropeMedium hover:bg-[#E8E2D5] transition-colors"
                          >
                            Отмена
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                )}

                {/* Список добавленных услуг */}
                {doctorServices.length === 0 ? (
                  <div className="text-center py-[clamp(2rem,1.7692rem+1.0256vw,3rem)]">
                    <p className="text-[clamp(0.875rem,0.8077rem+0.2885vw,1.125rem)] font-ManropeRegular text-[#636846]">
                      У специалиста пока нет привязанных услуг
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <h3 className="text-[clamp(0.875rem,0.8077rem+0.2885vw,1.125rem)] font-ManropeBold text-[#4F5338]">
                      Текущие услуги ({doctorServices.length})
                    </h3>
                    {doctorServices.map(({ service }) => (
                      <div
                        key={service.id}
                        className="bg-white rounded-[clamp(0.75rem,0.6346rem+0.5128vw,1.25rem)] p-[clamp(1rem,0.8846rem+0.5128vw,1.5rem)] border border-[#E8E2D5]"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <h4 className="font-ManropeMedium text-[clamp(0.875rem,0.8077rem+0.2885vw,1.125rem)] text-[#4F5338] mb-1">
                              {service.name}
                            </h4>
                            {service.description && (
                              <p className="text-[clamp(0.75rem,0.6923rem+0.2564vw,1rem)] font-ManropeRegular text-[#636846] mb-2 line-clamp-2">
                                {service.description}
                              </p>
                            )}
                            <div className="flex flex-wrap items-center gap-3 text-[clamp(0.75rem,0.6923rem+0.2564vw,1rem)] font-ManropeRegular text-[#636846]">
                              <span>⏱️ {service.durationMin} мин</span>
                              {service.bufferMin && <span>🔄 Буфер: {service.bufferMin} мин</span>}
                              <span className="font-ManropeMedium text-[#4F5338]">
                                💰 {(service.priceCents / 100).toLocaleString("ru-RU")} {service.currency}
                              </span>
                              {service.category && (
                                <span className="px-2 py-0.5 bg-[#F5F0E4] rounded text-[#967450]">
                                  {service.category.name}
                                </span>
                              )}
                            </div>
                          </div>
                          <button
                            onClick={() => handleRemoveService(service.id)}
                            disabled={updating}
                            className="flex-shrink-0 p-2 text-[#C74545] hover:bg-[#F5E6E6] rounded-lg transition-colors disabled:opacity-50"
                            aria-label="Удалить услугу"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-[#E8E2D5] px-[clamp(1.5rem,1.2692rem+1.0256vw,2.5rem)] py-[2%] flex justify-center">
            <Dialog.Close asChild>
              <button className="px-[clamp(1.5rem,1.2692rem+1.0256vw,2.5rem)] py-[clamp(0.625rem,0.5096rem+0.5128vw,1.125rem)] text-[clamp(0.875rem,0.8077rem+0.2885vw,1.125rem)] font-ManropeMedium text-[#967450] bg-[#F5F0E4] border border-[#E8E2D5] rounded-[clamp(0.5rem,0.4423rem+0.2564vw,0.75rem)] hover:bg-[#E8E2D5] transition-colors">
                Закрыть
              </button>
            </Dialog.Close>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
