"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import toast from "react-hot-toast";
import * as Dialog from "@radix-ui/react-dialog";
import ManageDoctorsModal from "../_components/ManageDoctorsModal";

/* ------------ Types ------------- */
type Category = { id: string; name: string };

type Service = {
  id: string;
  name: string;
  description: string | null;
  priceCents: number;
  currency: string;
  durationMin: number;
  isActive: boolean;
  bufferMinOverride: number | null;
  category: { id: string; name: string } | null;
  _count?: { doctorServices: number };
};

type Props = {
  userId: string;
  filters: Record<string, string | string[] | undefined>;
};

/* ------------ Schema ------------ */
const serviceSchema = z.object({
  name: z.string().min(1, "Введите название"),
  description: z.string().optional(),
  priceCents: z.number().int().min(0, "Цена должна быть ≥ 0"),
  currency: z.string().min(1, "Выберите валюту"),
  durationMin: z.number().int().min(1, "Длительность должна быть ≥ 1"),
  categoryId: z.string().optional(),
  isActive: z.boolean(),
});
type ServiceFormData = z.infer<typeof serviceSchema>;

/* ------------ Utils ------------- */
function useDebouncedValue<T>(value: T, delay = 250) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setV(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return v;
}

function formatPrice(cents: number, currency: string) {
  return new Intl.NumberFormat("ru-RU", {
    style: "currency",
    currency: currency || "RUB",
  }).format((cents ?? 0) / 100);
}

const PAGE_SIZE = 9;

/* ---- Custom Category Dropdown ---- */
type DropdownOption = { value: string; label: string };

function CategoryDropdown({
  options,
  value,
  onChange,
  placeholder = "Все категории",
  inline = false,
}: {
  options: DropdownOption[];
  value: string | null;
  onChange: (value: string | null) => void;
  placeholder?: string;
  inline?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const selectedLabel = value ? options.find((o) => o.value === value)?.label || placeholder : placeholder;

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((p) => !p)}
        className={`w-full flex items-center justify-between px-4 py-3 bg-white border rounded-xl text-sm font-ManropeRegular transition-all cursor-pointer ${
          open
            ? "border-[#967450] ring-2 ring-[#967450]"
            : "border-[#E8E2D5] hover:border-[#967450]"
        } ${value ? "text-[#4F5338]" : "text-[#636846]"}`}
      >
        <span className="truncate">{selectedLabel}</span>
        <svg
          className={`w-4 h-4 text-[#636846] shrink-0 ml-2 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className={`${inline ? "" : "absolute z-30"} mt-1.5 w-full bg-white border border-[#E8E2D5] rounded-xl ${inline ? "" : "shadow-lg"} overflow-hidden`}>
          <div className={`${inline ? "" : "max-h-60"} overflow-y-auto py-1`}>
            <button
              type="button"
              onClick={() => { onChange(null); setOpen(false); }}
              className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-ManropeRegular transition-colors ${
                !value
                  ? "bg-[#F5F0E4] text-[#967450] font-ManropeMedium"
                  : "text-[#4F5338] hover:bg-[#FFFCF3]"
              }`}
            >
              <span className="w-5 h-5 flex items-center justify-center rounded-full border border-[#E8E2D5] shrink-0">
                {!value && (
                  <span className="w-2.5 h-2.5 rounded-full bg-[#967450]" />
                )}
              </span>
              {placeholder}
            </button>
            {options.map((opt) => {
              const selected = value === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => { onChange(opt.value); setOpen(false); }}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-sm transition-colors ${
                    selected
                      ? "bg-[#F5F0E4] text-[#967450] font-ManropeMedium"
                      : "text-[#4F5338] font-ManropeRegular hover:bg-[#FFFCF3]"
                  }`}
                >
                  <span className="w-5 h-5 flex items-center justify-center rounded-full border border-[#E8E2D5] shrink-0">
                    {selected && (
                      <span className="w-2.5 h-2.5 rounded-full bg-[#967450]" />
                    )}
                  </span>
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

/* ----------- Component ---------- */
export default function ServicesPanel({ userId, filters }: Props) {
  const [services, setServices] = useState<Service[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search, 250);
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const [showDoctorsModal, setShowDoctorsModal] = useState(false);
  const [selectedServiceForDoctors, setSelectedServiceForDoctors] = useState<Service | null>(null);
  const [page, setPage] = useState(1);

  const form = useForm<ServiceFormData>({
    resolver: zodResolver(serviceSchema),
    defaultValues: {
      name: "",
      description: "",
      priceCents: 0,
      currency: "RUB",
      durationMin: 30,
      isActive: true,
    },
  });

  /* --------- Data load ---------- */
  useEffect(() => {
    loadData();
    const handleCreateEvent = () => handleCreate();
    window.addEventListener("admin:createService", handleCreateEvent);
    return () => window.removeEventListener("admin:createService", handleCreateEvent);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [catRes, servRes] = await Promise.all([
        fetch("/api/services/categories"),
        fetch("/api/admin/services/list"),
      ]);

      if (catRes.ok) {
        const catData = await catRes.json();
        setCategories(catData.categories || []);
      }
      if (servRes.ok) {
        const servData = await servRes.json();
        setServices(servData.services || []);
      } else {
        toast.error("Не удалось загрузить услуги");
      }
    } catch (e) {
      console.error(e);
      toast.error("Ошибка загрузки");
    } finally {
      setLoading(false);
    }
  }

  /* ----------- CRUD ------------- */
  function handleCreate() {
    setEditingService(null);
    form.reset({
      name: "",
      description: "",
      priceCents: 0,
      currency: "RUB",
      durationMin: 30,
      isActive: true,
      categoryId: "",
    });
    setShowModal(true);
  }

  function handleEdit(service: Service) {
    setEditingService(service);
    form.reset({
      name: service.name,
      description: service.description || "",
      priceCents: service.priceCents,
      currency: service.currency,
      durationMin: service.durationMin,
      isActive: service.isActive,
      categoryId: service.category?.id || "",
    });
    setShowModal(true);
  }

  async function onSubmit(data: ServiceFormData) {
    const payload = {
      name: data.name,
      description: data.description || null,
      priceCents: data.priceCents,
      currency: data.currency,
      durationMin: data.durationMin,
      isActive: data.isActive,
      categoryId: data.categoryId || null,
    };

    try {
      if (editingService) {
        const res = await fetch(`/api/admin/services/${editingService.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err?.error || "Не удалось обновить услугу");
        }
        toast.success("Услуга обновлена");
      } else {
        const res = await fetch("/api/admin/services", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err?.error || "Не удалось создать услугу");
        }
        toast.success("Услуга создана");
      }
      setShowModal(false);
      loadData();
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message || "Ошибка сохранения");
    }
  }

  async function handleDelete(serviceId: string) {
    if (!confirm("Вы уверены, что хотите удалить эту услугу?")) return;
    try {
      const res = await fetch(`/api/admin/services/${serviceId}`, { method: "DELETE" });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error || "Не удалось удалить услугу");
      }
      toast.success("Услуга удалена");
      loadData();
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message || "Ошибка удаления");
    }
  }

  // Reset page when filters change
  useEffect(() => { setPage(1); }, [debouncedSearch, categoryFilter]);

  /* ---------- Filtering ---------- */
  const filteredServices = useMemo(() => {
    const term = debouncedSearch.trim().toLowerCase();
    return services.filter((s) => {
      if (term) {
        const ok =
          s.name.toLowerCase().includes(term) ||
          (s.description ? s.description.toLowerCase().includes(term) : false);
        if (!ok) return false;
      }
      if (categoryFilter && s.category?.id !== categoryFilter) return false;
      return true;
    });
  }, [services, debouncedSearch, categoryFilter]);

  const totalPages = Math.ceil(filteredServices.length / PAGE_SIZE);
  const paginatedServices = filteredServices.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  /* ----------- Render ------------ */
  if (loading) {
    return (
      <div className="w-full px-4 py-6 space-y-8">
        <div className="animate-pulse space-y-4">
          <div className="h-12 bg-gradient-to-r from-[#F5F0E4] to-[#E8E2D5] rounded-xl" />
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-[420px] bg-gradient-to-br from-white to-[#FFFCF3] rounded-2xl border border-[#E8E2D5]" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full px-4 py-6 space-y-8">
      {/* Filters */}
      <div className="bg-gradient-to-br from-white to-[#FFFCF3] rounded-2xl border border-[#E8E2D5] p-4 md:p-6 shadow-sm">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="relative group">
            <input
              type="text"
              placeholder="Поиск услуг..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full px-4 py-3 bg-white border border-[#E8E2D5] rounded-xl text-sm font-ManropeRegular text-[#4F5338] placeholder:text-[#636846] focus:outline-none focus:ring-2 focus:ring-[#967450] focus:border-transparent transition-all"
            />
            <svg className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#636846] pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>

          <CategoryDropdown
            options={categories.map((c) => ({ value: c.id, label: c.name }))}
            value={categoryFilter}
            onChange={setCategoryFilter}
            placeholder="Все категории"
          />
        </div>
      </div>

      {/* Services Grid */}
      {filteredServices.length === 0 ? (
        <div className="bg-gradient-to-br from-white to-[#FFFCF3] rounded-2xl border border-[#E8E2D5] p-12 text-center">
          <div className="max-w-md mx-auto space-y-4">
            <div className="w-16 h-16 mx-auto bg-[#F5F0E4] rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-[#636846]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-ManropeBold text-[#4F5338] mb-2">Услуги не найдены</h3>
              <p className="text-sm text-[#636846] font-ManropeRegular">Попробуйте изменить параметры поиска или создайте новую услугу</p>
            </div>
            <button
              onClick={handleCreate}
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#5C6744] text-white rounded-xl text-sm font-ManropeMedium hover:bg-[#4F5938] transition-all hover:scale-105"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Создать услугу
            </button>
          </div>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 auto-rows-fr">
          {paginatedServices.map((service) => (
            <article
              key={service.id}
              className="group relative bg-gradient-to-br from-white to-[#FFFCF3] rounded-2xl border border-[#E8E2D5] p-5 hover:shadow-lg hover:scale-[1.02] transition-all duration-300 hover:border-[#967450] flex flex-col"
            >
              {/* Header */}
              <div className="flex items-start justify-between gap-3 mb-4">
                <div className="min-w-0 flex-1">
                  <h3 className="text-base font-ManropeBold text-[#4F5338] mb-1 truncate" title={service.name}>
                    {service.name}
                  </h3>
                  <div className="h-8">
                    {service.description && (
                      <p className="text-xs text-[#636846] font-ManropeRegular line-clamp-2 leading-relaxed">
                        {service.description}
                      </p>
                    )}
                  </div>
                </div>
                <span
                  className={`shrink-0 px-3 py-1 rounded-full text-xs font-ManropeMedium transition-all ${
                    service.isActive
                      ? "bg-[#E8F5E9] text-[#2E7D32]"
                      : "bg-[#F5F0E4] text-[#636846]"
                  }`}
                >
                  {service.isActive ? "Активна" : "Неактивна"}
                </span>
              </div>

              {/* Price */}
              <div className="mb-4">
                <div className="text-xs text-[#636846] font-ManropeRegular mb-1">Стоимость</div>
                <div className="text-2xl font-ManropeBold text-[#4F5338] tabular-nums">
                  {formatPrice(service.priceCents, service.currency)}
                </div>
              </div>

              {/* Meta Info */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="bg-[#FFFCF3] rounded-xl p-3 border border-[#E8E2D5]">
                  <div className="text-xs text-[#636846] mb-1">Длительность</div>
                  <div className="text-sm font-ManropeBold text-[#4F5338] tabular-nums">
                    {service.durationMin} мин
                  </div>
                </div>
                <div className="bg-[#FFFCF3] rounded-xl p-3 border border-[#E8E2D5]">
                  <div className="text-xs text-[#636846] mb-1">Категория</div>
                  <div className="text-sm font-ManropeBold text-[#4F5338] truncate" title={service.category?.name || "—"}>
                    {service.category?.name || "—"}
                  </div>
                </div>
              </div>

              {/* Spacer to push buttons to bottom */}
              <div className="flex-1"></div>

              {/* Doctors Badge */}
              <button
                onClick={() => {
                  setSelectedServiceForDoctors(service);
                  setShowDoctorsModal(true);
                }}
                className={`w-full mb-4 flex items-center justify-between px-4 py-3 rounded-xl transition-all ${
                  service._count?.doctorServices
                    ? "bg-[#E8F5E9] text-[#2E7D32] hover:bg-[#d4ecd5]"
                    : "bg-[#FFF3E0] text-[#967450] hover:bg-[#ffe8cc]"
                }`}
              >
                <span className="text-sm font-ManropeMedium">Назначено врачей</span>
                <span className="flex items-center justify-center w-7 h-7 rounded-full bg-white/50 text-sm font-ManropeBold">
                  {service._count?.doctorServices || 0}
                </span>
              </button>

              {/* Actions */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleEdit(service)}
                  className="flex-1 px-4 py-2.5 text-sm font-ManropeMedium text-[#967450] bg-[#F5F0E4] rounded-xl hover:bg-[#E8E2D5] transition-all"
                >
                  Изменить
                </button>
                <button
                  onClick={() => handleDelete(service.id)}
                  className="flex-1 px-4 py-2.5 text-sm font-ManropeMedium text-[#C74545] bg-[#F5E6E6] rounded-xl hover:bg-[#EDD5D5] transition-all"
                >
                  Удалить
                </button>
              </div>
            </article>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="bg-white rounded-2xl border border-[#E8E2D5] px-4 py-3 flex items-center justify-between flex-wrap gap-4">
          <div className="text-xs sm:text-sm font-ManropeRegular text-[#636846]">
            Показано{" "}
            <span className="font-ManropeMedium text-[#4F5338]">{(page - 1) * PAGE_SIZE + 1}</span>
            {" - "}
            <span className="font-ManropeMedium text-[#4F5338]">{Math.min(page * PAGE_SIZE, filteredServices.length)}</span>
            {" из "}
            <span className="font-ManropeMedium text-[#4F5338]">{filteredServices.length}</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-2 text-xs sm:text-sm font-ManropeMedium text-[#967450] bg-[#F5F0E4] border border-[#E8E2D5] rounded-lg hover:bg-[#E8E2D5] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              ← Назад
            </button>

            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum: number;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (page <= 3) {
                  pageNum = i + 1;
                } else if (page >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = page - 2 + i;
                }
                return (
                  <button
                    key={pageNum}
                    onClick={() => setPage(pageNum)}
                    className={`w-8 h-8 text-xs sm:text-sm font-ManropeMedium rounded-lg transition-colors ${
                      page === pageNum
                        ? "bg-[#5C6744] text-white"
                        : "text-[#967450] bg-[#F5F0E4] border border-[#E8E2D5] hover:bg-[#E8E2D5]"
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-3 py-2 text-xs sm:text-sm font-ManropeMedium text-[#967450] bg-[#F5F0E4] border border-[#E8E2D5] rounded-lg hover:bg-[#E8E2D5] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Вперёд →
            </button>
          </div>
        </div>
      )}

      {/* Modal */}
      <Dialog.Root open={showModal} onOpenChange={(isOpen) => !isOpen && setShowModal(false)}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 animate-in fade-in duration-200" />
          <Dialog.Content className="fixed z-50 w-[calc(100%-2rem)] max-w-2xl top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-3xl shadow-2xl max-h-[90vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-[#E8E2D5] bg-gradient-to-r from-[#FFFCF3] to-white">
              <Dialog.Title className="text-xl font-ManropeBold text-[#4F5338]">
                {editingService ? "Редактировать услугу" : "Создать услугу"}
              </Dialog.Title>
              <Dialog.Close asChild>
                <button className="w-10 h-10 flex items-center justify-center rounded-xl text-[#636846] hover:text-[#4F5338] hover:bg-[#F5F0E4] transition-all">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </Dialog.Close>
            </div>

            {/* Form */}
            <div className="overflow-y-auto max-h-[calc(90vh-5rem)] px-6 py-6">
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                {/* Название */}
                <div>
                  <label className="block text-sm font-ManropeMedium text-[#4F5338] mb-2">
                    Название <span className="text-[#C74545]">*</span>
                  </label>
                  <input
                    type="text"
                    {...form.register("name")}
                    className={`w-full px-4 py-3 bg-[#F5F0E4] border rounded-xl text-sm font-ManropeRegular text-[#4F5338] placeholder:text-[#636846] focus:outline-none focus:ring-2 transition-all ${
                      form.formState.errors.name ? "border-[#C74545] ring-2 ring-[#C74545]/20" : "border-transparent focus:ring-[#967450]"
                    }`}
                  />
                  {form.formState.errors.name && (
                    <p className="mt-1 text-xs text-[#C74545] font-ManropeRegular">{form.formState.errors.name.message}</p>
                  )}
                </div>

                {/* Описание */}
                <div>
                  <label className="block text-sm font-ManropeMedium text-[#4F5338] mb-2">Описание</label>
                  <textarea
                    {...form.register("description")}
                    rows={3}
                    className="w-full px-4 py-3 bg-[#F5F0E4] border border-transparent rounded-xl text-sm font-ManropeRegular text-[#4F5338] placeholder:text-[#636846] focus:outline-none focus:ring-2 focus:ring-[#967450] resize-none transition-all"
                  />
                </div>

                {/* Цена */}
                <div>
                  <label className="block text-sm font-ManropeMedium text-[#4F5338] mb-2">
                    Цена (в копейках) <span className="text-[#C74545]">*</span>
                  </label>
                  <input
                    type="number"
                    {...form.register("priceCents", { valueAsNumber: true })}
                    className={`w-full px-4 py-3 bg-[#F5F0E4] border rounded-xl text-sm font-ManropeRegular text-[#4F5338] focus:outline-none focus:ring-2 transition-all ${
                      form.formState.errors.priceCents ? "border-[#C74545] ring-2 ring-[#C74545]/20" : "border-transparent focus:ring-[#967450]"
                    }`}
                  />
                  <p className="mt-1 text-xs text-[#636846]">Например: 5000 = 50,00 ₽</p>
                </div>

                {/* Длительность */}
                <div>
                  <label className="block text-sm font-ManropeMedium text-[#4F5338] mb-2">
                    Длительность (мин) <span className="text-[#C74545]">*</span>
                  </label>
                  <input
                    type="number"
                    {...form.register("durationMin", { valueAsNumber: true })}
                    className={`w-full px-4 py-3 bg-[#F5F0E4] border rounded-xl text-sm font-ManropeRegular text-[#4F5338] focus:outline-none focus:ring-2 transition-all ${
                      form.formState.errors.durationMin ? "border-[#C74545] ring-2 ring-[#C74545]/20" : "border-transparent focus:ring-[#967450]"
                    }`}
                  />
                </div>

                {/* Категория */}
                <div>
                  <label className="block text-sm font-ManropeMedium text-[#4F5338] mb-2">Категория</label>
                  <CategoryDropdown
                    options={categories.map((c) => ({ value: c.id, label: c.name }))}
                    value={form.watch("categoryId") || null}
                    onChange={(v) => form.setValue("categoryId", v || "", { shouldDirty: true })}
                    placeholder="Без категории"
                    inline
                  />
                </div>

                {/* Активна */}
                <div className="flex items-center gap-3 p-4 bg-[#FFFCF3] rounded-xl border border-[#E8E2D5]">
                  <input
                    type="checkbox"
                    {...form.register("isActive")}
                    className="w-5 h-5 accent-[#5C6744] cursor-pointer"
                  />
                  <label className="text-sm font-ManropeMedium text-[#4F5338] cursor-pointer">Услуга активна</label>
                </div>

                {/* Buttons */}
                <div className="flex gap-3 pt-2">
                  <button
                    type="submit"
                    className="flex-1 py-3 bg-[#5C6744] text-white rounded-xl text-sm font-ManropeMedium hover:bg-[#4F5938] transition-all hover:scale-[1.02]"
                  >
                    {editingService ? "Сохранить изменения" : "Создать услугу"}
                  </button>
                  <Dialog.Close asChild>
                    <button
                      type="button"
                      className="flex-1 py-3 bg-[#F5F0E4] text-[#967450] rounded-xl text-sm font-ManropeMedium hover:bg-[#E8E2D5] transition-all"
                    >
                      Отмена
                    </button>
                  </Dialog.Close>
                </div>
              </form>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {/* Doctors Modal */}
      <ManageDoctorsModal
        serviceId={selectedServiceForDoctors?.id || ""}
        serviceName={selectedServiceForDoctors?.name || ""}
        open={showDoctorsModal}
        onClose={() => setShowDoctorsModal(false)}
        onSuccess={() => loadData()}
      />
    </div>
  );
}
