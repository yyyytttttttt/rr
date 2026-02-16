"use client";

import { useState, useEffect, useMemo, useRef } from "react";
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

  // Search & filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [catDropdownOpen, setCatDropdownOpen] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);
  const catDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open && doctorId) {
      loadServices();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, doctorId]);

  // Focus search on open add panel
  useEffect(() => {
    if (showAddServices) {
      setTimeout(() => searchRef.current?.focus(), 100);
    } else {
      setSearchQuery("");
      setSelectedCategory(null);
      setCatDropdownOpen(false);
    }
  }, [showAddServices]);

  // Close category dropdown on click outside
  useEffect(() => {
    if (!catDropdownOpen) return;
    const handler = (e: MouseEvent) => {
      if (catDropdownRef.current && !catDropdownRef.current.contains(e.target as Node)) {
        setCatDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [catDropdownOpen]);

  const loadServices = async () => {
    setLoading(true);
    try {
      const doctorRes = await fetch(`/api/doctors/${doctorId}/services`);
      if (!doctorRes.ok) throw new Error("Failed to fetch doctor services");
      const doctorData = await doctorRes.json();
      setDoctorServices(doctorData.services || []);

      const allRes = await fetch("/api/admin/services/list");
      if (!allRes.ok) throw new Error("Failed to fetch all services");
      const allData = await allRes.json();

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

  // Extract unique categories from available services
  const categories = useMemo(() => {
    const map = new Map<string, string>();
    for (const s of availableServices) {
      if (s.category) map.set(s.category.id, s.category.name);
    }
    return Array.from(map, ([id, name]) => ({ id, name })).sort((a, b) =>
      a.name.localeCompare(b.name, "ru")
    );
  }, [availableServices]);

  // Filtered available services
  const filteredAvailable = useMemo(() => {
    let list = availableServices;
    if (selectedCategory) {
      list = list.filter((s) => s.category?.id === selectedCategory);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      list = list.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.description?.toLowerCase().includes(q) ||
          s.category?.name.toLowerCase().includes(q)
      );
    }
    return list;
  }, [availableServices, selectedCategory, searchQuery]);

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
                  <div className="bg-[#FFFCF3] rounded-[clamp(0.75rem,0.6346rem+0.5128vw,1.25rem)] border border-[#E8E2D5] overflow-hidden">
                    {/* Search + category header */}
                    <div className="p-[clamp(1rem,0.8846rem+0.5128vw,1.5rem)] pb-0">
                      <h3 className="text-[clamp(0.875rem,0.8077rem+0.2885vw,1.125rem)] font-ManropeBold text-[#4F5338] mb-3">
                        Выберите услуги для добавления
                      </h3>

                      {/* Search input */}
                      <div className="relative mb-3">
                        <div className="absolute inset-y-0 left-0 pl-3.5 lg:pl-4 flex items-center pointer-events-none">
                          <svg className="w-[1.1rem] h-[1.1rem] lg:w-5 lg:h-5 text-[#9A8F7D]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                          </svg>
                        </div>
                        <input
                          ref={searchRef}
                          type="text"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          placeholder="Поиск по названию или описанию..."
                          className="w-full pl-10 lg:pl-12 pr-10 py-2.5 lg:py-3 bg-white border border-[#E8E2D5] rounded-xl text-sm lg:text-base font-ManropeRegular text-[#4F5338] placeholder:text-[#B0A890] focus:outline-none focus:ring-2 focus:ring-[#967450]/40 focus:border-[#967450] transition-all"
                        />
                        {searchQuery && (
                          <button
                            type="button"
                            onClick={() => setSearchQuery("")}
                            className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-[#9A8F7D] hover:text-[#636846] transition-colors"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        )}
                      </div>

                      {/* Category dropdown */}
                      {categories.length > 0 && (
                        <div className="relative mb-3" ref={catDropdownRef}>
                          <button
                            type="button"
                            onClick={() => setCatDropdownOpen((v) => !v)}
                            className={`w-full flex items-center justify-between gap-2 px-3.5 py-2.5 lg:px-4 lg:py-3 rounded-xl border text-sm lg:text-base font-ManropeMedium transition-all ${
                              catDropdownOpen
                                ? "border-[#967450] ring-2 ring-[#967450]/40 bg-white"
                                : "border-[#E8E2D5] bg-white hover:border-[#C8C0AD]"
                            }`}
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <svg className="w-4 h-4 text-[#9A8F7D] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
                              </svg>
                              <span className={selectedCategory ? "text-[#4F5338]" : "text-[#9A8F7D]"}>
                                {selectedCategory
                                  ? categories.find((c) => c.id === selectedCategory)?.name ?? "Категория"
                                  : "Все категории"}
                              </span>
                              {selectedCategory && (
                                <span className="ml-auto shrink-0 text-[10px] font-ManropeMedium text-[#967450] bg-[#F5F0E4] rounded-full px-1.5 py-0.5 leading-none">
                                  {availableServices.filter((s) => s.category?.id === selectedCategory).length}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                              {selectedCategory && (
                                <span
                                  role="button"
                                  onClick={(e) => { e.stopPropagation(); setSelectedCategory(null); setCatDropdownOpen(false); }}
                                  className="p-0.5 rounded-md text-[#9A8F7D] hover:text-[#C63D3D] hover:bg-red-50 transition-colors"
                                >
                                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                  </svg>
                                </span>
                              )}
                              <svg
                                className={`w-4 h-4 text-[#9A8F7D] transition-transform duration-200 ${catDropdownOpen ? "rotate-180" : ""}`}
                                fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                              >
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                              </svg>
                            </div>
                          </button>

                          {/* Dropdown menu */}
                          {catDropdownOpen && (
                            <div className="absolute z-10 left-0 right-0 mt-1.5 bg-white border border-[#E8E2D5] rounded-xl shadow-lg shadow-black/8 overflow-hidden animate-in fade-in slide-in-from-top-1 duration-150">
                              {/* All option */}
                              <button
                                type="button"
                                onClick={() => { setSelectedCategory(null); setCatDropdownOpen(false); }}
                                className={`w-full flex items-center gap-3 px-4 py-2.5 lg:py-3 text-left text-sm lg:text-base transition-colors ${
                                  selectedCategory === null
                                    ? "bg-[#5C6744]/[0.06] text-[#4F5338] font-ManropeMedium"
                                    : "text-[#636846] font-ManropeRegular hover:bg-[#FAFAF5]"
                                }`}
                              >
                                <div className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 ${
                                  selectedCategory === null ? "bg-[#5C6744]" : "border border-[#D4CCBA]"
                                }`}>
                                  {selectedCategory === null && (
                                    <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                    </svg>
                                  )}
                                </div>
                                <span className="flex-1">Все категории</span>
                                <span className="text-xs lg:text-sm text-[#B0A890]">{availableServices.length}</span>
                              </button>

                              <div className="h-px bg-[#E8E2D5]" />

                              {/* Category options */}
                              <div className="max-h-48 lg:max-h-56 overflow-y-auto overscroll-contain">
                                {categories.map((cat) => {
                                  const count = availableServices.filter((s) => s.category?.id === cat.id).length;
                                  const isActive = selectedCategory === cat.id;
                                  return (
                                    <button
                                      key={cat.id}
                                      type="button"
                                      onClick={() => { setSelectedCategory(cat.id); setCatDropdownOpen(false); }}
                                      className={`w-full flex items-center gap-3 px-4 py-2.5 lg:py-3 text-left text-sm lg:text-base transition-colors ${
                                        isActive
                                          ? "bg-[#5C6744]/[0.06] text-[#4F5338] font-ManropeMedium"
                                          : "text-[#636846] font-ManropeRegular hover:bg-[#FAFAF5]"
                                      }`}
                                    >
                                      <div className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 ${
                                        isActive ? "bg-[#5C6744]" : "border border-[#D4CCBA]"
                                      }`}>
                                        {isActive && (
                                          <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                          </svg>
                                        )}
                                      </div>
                                      <span className="flex-1 truncate">{cat.name}</span>
                                      <span className="text-xs lg:text-sm text-[#B0A890] shrink-0">{count}</span>
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Services list */}
                    <div className="px-[clamp(1rem,0.8846rem+0.5128vw,1.5rem)]">
                      {availableServices.length === 0 ? (
                        <p className="text-[clamp(0.875rem,0.8077rem+0.2885vw,1.125rem)] font-ManropeRegular text-[#636846] text-center py-6">
                          Все доступные услуги уже добавлены
                        </p>
                      ) : filteredAvailable.length === 0 ? (
                        <div className="text-center py-6">
                          <div className="w-10 h-10 mx-auto mb-2 rounded-full bg-[#F5F0E4] flex items-center justify-center">
                            <svg className="w-5 h-5 text-[#9A8F7D]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                            </svg>
                          </div>
                          <p className="text-sm lg:text-base font-ManropeRegular text-[#9A8F7D]">
                            Ничего не найдено
                          </p>
                          <button
                            type="button"
                            onClick={() => { setSearchQuery(""); setSelectedCategory(null); }}
                            className="mt-1.5 text-xs lg:text-sm font-ManropeMedium text-[#967450] hover:underline"
                          >
                            Сбросить фильтры
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-2 lg:space-y-2.5 max-h-64 lg:max-h-80 overflow-y-auto overscroll-contain pr-1 -mr-1">
                          {filteredAvailable.map((service) => {
                            const isChecked = selectedServices.has(service.id);
                            return (
                              <label
                                key={service.id}
                                className={`flex items-start gap-3 lg:gap-3.5 p-3 lg:p-4 rounded-xl border cursor-pointer transition-all ${
                                  isChecked
                                    ? "bg-[#5C6744]/[0.04] border-[#5C6744]/30 shadow-sm"
                                    : "bg-white border-[#E8E2D5] hover:border-[#967450]/50"
                                }`}
                              >
                                {/* Custom checkbox */}
                                <div className="mt-0.5 lg:mt-1 shrink-0">
                                  <div
                                    className={`w-[1.15rem] h-[1.15rem] lg:w-5 lg:h-5 rounded-[5px] border-2 flex items-center justify-center transition-all ${
                                      isChecked
                                        ? "bg-[#5C6744] border-[#5C6744]"
                                        : "border-[#C8C0AD] bg-white"
                                    }`}
                                  >
                                    {isChecked && (
                                      <svg className="w-3 h-3 lg:w-3.5 lg:h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                      </svg>
                                    )}
                                  </div>
                                  <input
                                    type="checkbox"
                                    checked={isChecked}
                                    onChange={() => toggleServiceSelection(service.id)}
                                    className="sr-only"
                                  />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="font-ManropeMedium text-sm lg:text-base text-[#4F5338]">
                                      {service.name}
                                    </span>
                                    {service.category && (
                                      <span className="inline-flex px-1.5 py-0.5 lg:px-2 lg:py-1 rounded-md bg-[#F5F0E4] text-[10px] lg:text-xs font-ManropeMedium text-[#967450] leading-tight">
                                        {service.category.name}
                                      </span>
                                    )}
                                  </div>
                                  {service.description && (
                                    <p className="text-xs lg:text-sm font-ManropeRegular text-[#636846] mt-0.5 lg:mt-1 line-clamp-1">
                                      {service.description}
                                    </p>
                                  )}
                                  <div className="flex items-center gap-2 mt-1.5 lg:mt-2 text-xs lg:text-sm font-ManropeRegular text-[#9A8F7D]">
                                    <span>{service.durationMin} мин</span>
                                    <span className="text-[#D4CCBA]">|</span>
                                    <span className="font-ManropeMedium text-[#4F5338]">
                                      {(service.priceCents / 100).toLocaleString("ru-RU")} {service.currency}
                                    </span>
                                  </div>
                                </div>
                              </label>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* Action buttons — sticky footer */}
                    <div className="flex gap-3 p-[clamp(1rem,0.8846rem+0.5128vw,1.5rem)] pt-3 border-t border-[#E8E2D5] mt-3 bg-[#FFFCF3]">
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
                              <span>{service.durationMin} мин</span>
                              {service.bufferMin && <span>Буфер: {service.bufferMin} мин</span>}
                              <span className="font-ManropeMedium text-[#4F5338]">
                                {(service.priceCents / 100).toLocaleString("ru-RU")} {service.currency}
                              </span>
                              {service.category && (
                                <span className="px-2 py-0.5 bg-[#F5F0E4] rounded text-[#967450] text-xs">
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
