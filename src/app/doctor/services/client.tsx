"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

type Service = {
  id: string;
  name: string;
  description: string | null;
  priceCents: number;
  currency: string;
  durationMin: number;
  category: { id: string; name: string } | null;
};

type ServicesData = {
  linked: Service[];
  available: Service[];
};

type Props = {
  doctorId: string;
  doctorName: string;
};

export default function DoctorServicesClient({ doctorId, doctorName }: Props) {
  const router = useRouter();
  const [data, setData] = useState<ServicesData | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchLinked, setSearchLinked] = useState("");
  const [searchAvailable, setSearchAvailable] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    loadServices();
  }, [doctorId]);

  const loadServices = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/doctors/${doctorId}/services`);
      if (res.ok) {
        const json = await res.json();
        setData(json);
      } else {
        toast.error("Не удалось загрузить услуги");
      }
    } catch (error) {
      console.error("Failed to load services:", error);
      toast.error("Ошибка загрузки");
    } finally {
      setLoading(false);
    }
  };

  const handleLink = async (serviceId: string) => {
    try {
      const res = await fetch(`/api/admin/doctors/${doctorId}/services`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ serviceId }),
      });

      if (res.ok) {
        toast.success("Услуга привязана");
        setData((prev) => {
          if (!prev) return prev;
          const service = prev.available.find((s) => s.id === serviceId);
          if (!service) return prev;
          return {
            linked: [...prev.linked, service].sort((a, b) => a.name.localeCompare(b.name)),
            available: prev.available.filter((s) => s.id !== serviceId),
          };
        });
      } else {
        const err = await res.json();
        toast.error(err.error || "Не удалось привязать услугу");
      }
    } catch (error) {
      console.error("Failed to link service:", error);
      toast.error("Ошибка привязки");
    }
  };

  const handleUnlink = async (serviceId: string) => {
    try {
      const res = await fetch(`/api/admin/doctors/${doctorId}/services/${serviceId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        toast.success("Услуга отвязана");
        setData((prev) => {
          if (!prev) return prev;
          const service = prev.linked.find((s) => s.id === serviceId);
          if (!service) return prev;
          return {
            linked: prev.linked.filter((s) => s.id !== serviceId),
            available: [...prev.available, service].sort((a, b) => a.name.localeCompare(b.name)),
          };
        });
      } else {
        const err = await res.json();
        toast.error(err.error || "Не удалось отвязать услугу");
      }
    } catch (error) {
      console.error("Failed to unlink service:", error);
      toast.error("Ошибка отвязки");
    }
  };

  const formatPrice = (cents: number, currency: string) => {
    return new Intl.NumberFormat("ru-RU", {
      style: "currency",
      currency: currency || "RUB",
    }).format(cents / 100);
  };

  const filterServices = (services: Service[], search: string) => {
    let filtered = services;

    if (search) {
      const lower = search.toLowerCase();
      filtered = filtered.filter(
        (s) =>
          s.name.toLowerCase().includes(lower) ||
          s.description?.toLowerCase().includes(lower)
      );
    }

    if (categoryFilter) {
      filtered = filtered.filter((s) => s.category?.id === categoryFilter);
    }

    return filtered;
  };

  const categories = data
    ? [...data.linked, ...data.available]
        .map((s) => s.category)
        .filter((c): c is NonNullable<typeof c> => c !== null)
        .reduce((acc, cat) => {
          if (!acc.find((c) => c.id === cat.id)) {
            acc.push(cat);
          }
          return acc;
        }, [] as Array<{ id: string; name: string }>)
    : [];

  const linkedFiltered = data ? filterServices(data.linked, searchLinked) : [];
  const availableFiltered = data ? filterServices(data.available, searchAvailable) : [];

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FFFCF3] px-4 py-6 sm:py-8 flex items-center justify-center">
        <p className="text-[clamp(1rem,0.9423rem+0.2564vw,1.25rem)] font-ManropeRegular text-[#636846]">Загрузка...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FFFCF3] px-4 py-6 sm:py-8">
      {/* Заголовок */}
      

      {/* Category filter dropdown */}
      {categories.length > 0 && (
        <div className="mb-6" ref={dropdownRef}>
          <label className="block text-xs font-ManropeMedium text-[#967450] uppercase tracking-wider mb-2">
            Категория
          </label>
          <div className="relative inline-block w-full sm:w-auto sm:min-w-[280px]">
            <button
              type="button"
              onClick={() => setDropdownOpen((v) => !v)}
              className={`w-full flex items-center justify-between gap-3 pl-4 pr-3 py-2.5 bg-white border rounded-xl text-sm font-ManropeMedium transition-all ${
                dropdownOpen
                  ? "border-[#5C6744] ring-2 ring-[#5C6744]/20"
                  : "border-[#E8E2D5] hover:border-[#C4BEAE]"
              } ${categoryFilter ? "text-[#4F5338]" : "text-[#636846]"}`}
            >
              <span className="truncate">
                {categoryFilter
                  ? categories.find((c) => c.id === categoryFilter)?.name ?? "Все категории"
                  : "Все категории"}
              </span>
              <svg
                className={`w-4 h-4 flex-shrink-0 text-[#636846] transition-transform duration-200 ${dropdownOpen ? "rotate-180" : ""}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2.5}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {dropdownOpen && (
              <div className="absolute z-50 mt-1.5 w-full min-w-[240px] bg-white border border-[#E8E2D5] rounded-xl shadow-xl overflow-hidden">
                <div className="max-h-72 overflow-y-auto py-1.5">
                  {[{ id: null, name: "Все категории" }, ...categories].map((item) => {
                    const isSelected = categoryFilter === item.id;
                    return (
                      <button
                        type="button"
                        key={item.id ?? "__all__"}
                        onClick={() => { setCategoryFilter(item.id); setDropdownOpen(false); }}
                        className={`w-full flex items-center justify-between gap-2 px-4 py-2.5 text-sm transition-colors ${
                          isSelected
                            ? "bg-[#F0EDDF] text-[#4F5338] font-ManropeSemiBold"
                            : "text-[#4F5338] font-ManropeMedium hover:bg-[#FAF8F2]"
                        }`}
                      >
                        <span className="truncate">{item.name}</span>
                        {isSelected && (
                          <svg className="w-4 h-4 flex-shrink-0 text-[#5C6744]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-[clamp(1.5rem,1.1538rem+1.5385vw,3rem)]">
        {/* Linked services */}
        <div className="bg-white rounded-[20px] border border-[#E8E2D5] p-[clamp(1.5rem,1.2692rem+1.0256vw,2.5rem)]">
          <h2 className="text-[clamp(1.25rem,1.1346rem+0.5128vw,1.75rem)] font-Manrope-SemiBold text-[#4F5338] mb-[clamp(1rem,0.8846rem+0.5128vw,1.5rem)]">
            Привязанные услуги ({linkedFiltered.length})
          </h2>
          <input
            type="text"
            placeholder="Поиск..."
            value={searchLinked}
            onChange={(e) => setSearchLinked(e.target.value)}
            className="w-full px-4 py-3 border border-[#E8E2D5] rounded-[12px] mb-4 focus:outline-none focus:ring-2 focus:ring-[#5C6744] text-[clamp(0.875rem,0.8077rem+0.2885vw,1.125rem)] font-ManropeRegular"
          />
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {linkedFiltered.length === 0 && (
              <p className="text-[clamp(0.875rem,0.8077rem+0.2885vw,1.125rem)] font-ManropeRegular text-[#636846] text-center py-8">
                Нет привязанных услуг
              </p>
            )}
            {linkedFiltered.map((service) => (
              <div
                key={service.id}
                className="border border-[#E8E2D5] rounded-[16px] p-4 flex justify-between items-start hover:bg-[#F5F0E4] transition-colors"
              >
                <div className="flex-1">
                  <h3 className="text-[clamp(1rem,0.9423rem+0.2564vw,1.25rem)] font-Manrope-SemiBold text-[#4F5338]">
                    {service.name}
                  </h3>
                  {service.description && (
                    <p className="text-[clamp(0.875rem,0.8077rem+0.2885vw,1.125rem)] font-ManropeRegular text-[#636846] mt-1">
                      {service.description}
                    </p>
                  )}
                  <p className="text-[clamp(0.875rem,0.8077rem+0.2885vw,1.125rem)] font-ManropeRegular text-[#636846] mt-2">
                    {formatPrice(service.priceCents, service.currency)} • {service.durationMin} мин
                  </p>
                  {service.category && (
                    <span className="inline-block mt-2 px-3 py-1 bg-[#F5F0E4] text-[#636846] text-[clamp(0.75rem,0.6923rem+0.2564vw,1rem)] font-ManropeRegular rounded-[8px]">
                      {service.category.name}
                    </span>
                  )}
                </div>
                <button
                  onClick={() => handleUnlink(service.id)}
                  className="ml-3 px-4 py-2 bg-[#FFE5E5] text-[#C63D3D] rounded-[8px] hover:bg-[#FFD0D0] text-[clamp(0.875rem,0.8077rem+0.2885vw,1.125rem)] font-ManropeRegular transition-colors"
                >
                  Убрать
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Available services */}
        <div className="bg-white rounded-[20px] border border-[#E8E2D5] p-[clamp(1.5rem,1.2692rem+1.0256vw,2.5rem)]">
          <h2 className="text-[clamp(1.25rem,1.1346rem+0.5128vw,1.75rem)] font-Manrope-SemiBold text-[#4F5338] mb-[clamp(1rem,0.8846rem+0.5128vw,1.5rem)]">
            Доступные услуги ({availableFiltered.length})
          </h2>
          <input
            type="text"
            placeholder="Поиск..."
            value={searchAvailable}
            onChange={(e) => setSearchAvailable(e.target.value)}
            className="w-full px-4 py-3 border border-[#E8E2D5] rounded-[12px] mb-4 focus:outline-none focus:ring-2 focus:ring-[#5C6744] text-[clamp(0.875rem,0.8077rem+0.2885vw,1.125rem)] font-ManropeRegular"
          />
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {availableFiltered.length === 0 && (
              <p className="text-[clamp(0.875rem,0.8077rem+0.2885vw,1.125rem)] font-ManropeRegular text-[#636846] text-center py-8">
                Нет доступных услуг
              </p>
            )}
            {availableFiltered.map((service) => (
              <div
                key={service.id}
                className="border border-[#E8E2D5] rounded-[16px] p-4 flex justify-between items-start hover:bg-[#F5F0E4] transition-colors"
              >
                <div className="flex-1">
                  <h3 className="text-[clamp(1rem,0.9423rem+0.2564vw,1.25rem)] font-Manrope-SemiBold text-[#4F5338]">
                    {service.name}
                  </h3>
                  {service.description && (
                    <p className="text-[clamp(0.875rem,0.8077rem+0.2885vw,1.125rem)] font-ManropeRegular text-[#636846] mt-1">
                      {service.description}
                    </p>
                  )}
                  <p className="text-[clamp(0.875rem,0.8077rem+0.2885vw,1.125rem)] font-ManropeRegular text-[#636846] mt-2">
                    {formatPrice(service.priceCents, service.currency)} • {service.durationMin} мин
                  </p>
                  {service.category && (
                    <span className="inline-block mt-2 px-3 py-1 bg-[#F5F0E4] text-[#636846] text-[clamp(0.75rem,0.6923rem+0.2564vw,1rem)] font-ManropeRegular rounded-[8px]">
                      {service.category.name}
                    </span>
                  )}
                </div>
                <button
                  onClick={() => handleLink(service.id)}
                  className="ml-3 px-4 py-2 bg-[#E5F5E5] text-[#3D8B3D] rounded-[8px] hover:bg-[#D0EDD0] text-[clamp(0.875rem,0.8077rem+0.2885vw,1.125rem)] font-ManropeRegular transition-colors"
                >
                  Добавить
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Отступ снизу */}
      <div className="h-[clamp(2rem,1.5385rem+2.0513vw,4rem)]" />
    </div>
  );
}
