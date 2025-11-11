"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import toast from "react-hot-toast";

type Category = {
  id: string;
  name: string;
};

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
};

type Props = {
  categories: Category[];
};

const serviceSchema = z.object({
  name: z.string().min(1, "Введите название"),
  description: z.string().optional(),
  priceCents: z.number().int().min(0, "Цена должна быть >= 0"),
  currency: z.string().min(1, "Выберите валюту"),
  durationMin: z.number().int().min(1, "Длительность должна быть >= 1"),
  categoryId: z.string().optional(),
  bufferMinOverride: z.number().int().min(0).optional(),
  isActive: z.boolean(),
});

type ServiceFormData = z.infer<typeof serviceSchema>;

export default function AdminServicesClient({ categories }: Props) {
  const router = useRouter();
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);

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

  useEffect(() => {
    loadServices();
  }, []);

  const loadServices = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/services/list");
      if (res.ok) {
        const data = await res.json();
        setServices(data.services || []);
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

  const handleCreate = () => {
    setEditingService(null);
    form.reset({
      name: "",
      description: "",
      priceCents: 0,
      currency: "RUB",
      durationMin: 30,
      isActive: true,
      bufferMinOverride: undefined,
      categoryId: "",
    });
    setShowModal(true);
  };

  const handleEdit = (service: Service) => {
    setEditingService(service);
    form.reset({
      name: service.name,
      description: service.description || "",
      priceCents: service.priceCents,
      currency: service.currency,
      durationMin: service.durationMin,
      isActive: service.isActive,
      bufferMinOverride: service.bufferMinOverride || undefined,
      categoryId: service.category?.id || "",
    });
    setShowModal(true);
  };

  const onSubmit = async (data: ServiceFormData) => {
    try {
      const payload = {
        name: data.name,
        description: data.description || null,
        priceCents: data.priceCents,
        currency: data.currency,
        durationMin: data.durationMin,
        isActive: data.isActive,
        bufferMinOverride: data.bufferMinOverride || null,
        categoryId: data.categoryId || null,
      };

      if (editingService) {
        // Update (need to create UPDATE endpoint)
        const res = await fetch(`/api/admin/services/${editingService.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (res.ok) {
          toast.success("Услуга обновлена");
          setShowModal(false);
          loadServices();
        } else {
          const err = await res.json();
          toast.error(err.error || "Не удалось обновить услугу");
        }
      } else {
        // Create - need doctorId temporarily (will be removed later, using M:N)
        // For now, create without doctorId since we moved to M:N
        const res = await fetch("/api/admin/services", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (res.ok) {
          toast.success("Услуга создана");
          setShowModal(false);
          loadServices();
        } else {
          const err = await res.json();
          toast.error(err.error || "Не удалось создать услугу");
        }
      }
    } catch (error) {
      console.error("Failed to save service:", error);
      toast.error("Ошибка сохранения");
    }
  };

  const formatPrice = (cents: number, currency: string) => {
    return new Intl.NumberFormat("ru-RU", {
      style: "currency",
      currency: currency || "RUB",
    }).format(cents / 100);
  };

  const filteredServices = services.filter((s) => {
    if (search) {
      const lower = search.toLowerCase();
      if (!s.name.toLowerCase().includes(lower) && !s.description?.toLowerCase().includes(lower)) {
        return false;
      }
    }
    if (categoryFilter && s.category?.id !== categoryFilter) {
      return false;
    }
    return true;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8 flex items-center justify-center">
        <p className="text-gray-600">Загрузка...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <button
          onClick={() => router.push("/admin")}
          className="text-blue-600 hover:underline mb-4"
        >
          ← Назад в админку
        </button>

        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Управление услугами</h1>
          <button
            onClick={handleCreate}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            + Создать услугу
          </button>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="grid md:grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="Поиск по названию или описанию..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          <div className="relative">
            <select
              value={categoryFilter || ""}
              onChange={(e) => setCategoryFilter(e.target.value || null)}
              className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none w-full pr-12 cursor-pointer"
            >
              <option value="">Все категории</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
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
        </div>

        {/* Services list */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Название
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Категория
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Цена
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Длительность
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Статус
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  Действия
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredServices.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                    Услуги не найдены
                  </td>
                </tr>
              )}
              {filteredServices.map((service) => (
                <tr key={service.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="font-medium text-gray-900">{service.name}</div>
                    {service.description && (
                      <div className="text-sm text-gray-500">{service.description}</div>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {service.category?.name || "—"}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {formatPrice(service.priceCents, service.currency)}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {service.durationMin} мин
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-2 py-1 text-xs rounded-full ${
                        service.isActive
                          ? "bg-green-100 text-green-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {service.isActive ? "Активна" : "Неактивна"}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right text-sm">
                    <button
                      onClick={() => handleEdit(service)}
                      className="text-blue-600 hover:underline"
                    >
                      Редактировать
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowModal(false)} />
          <div className="relative w-full max-w-2xl bg-white rounded-xl p-6 shadow-xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-4">
              {editingService ? "Редактировать услугу" : "Создать услугу"}
            </h2>

            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Название <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  {...form.register("name")}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {form.formState.errors.name && (
                  <p className="text-red-500 text-sm mt-1">
                    {form.formState.errors.name.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Описание</label>
                <textarea
                  {...form.register("description")}
                  rows={3}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Цена (в копейках) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    {...form.register("priceCents", { valueAsNumber: true })}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Например: 5000 = 50.00 руб
                  </p>
                  {form.formState.errors.priceCents && (
                    <p className="text-red-500 text-sm mt-1">
                      {form.formState.errors.priceCents.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Валюта <span className="text-red-500">*</span>
                  </label>
          <div className="relative">
            <select
                    {...form.register("currency")}
                    className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none w-full pr-12 cursor-pointer"
                  >
                    <option value="RUB">RUB</option>
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                    <option value="ILS">ILS</option>
                  </select>
            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M4 6L8 10L12 6" stroke="#4F5338" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
          </div>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Длительность (мин) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    {...form.register("durationMin", { valueAsNumber: true })}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  {form.formState.errors.durationMin && (
                    <p className="text-red-500 text-sm mt-1">
                      {form.formState.errors.durationMin.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Буфер (мин, опционально)
                  </label>
                  <input
                    type="number"
                    {...form.register("bufferMinOverride", { valueAsNumber: true })}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Категория</label>
          <div className="relative">
            <select
                  {...form.register("categoryId")}
                  className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none w-full pr-12 cursor-pointer"
                >
                  <option value="">Без категории</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
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

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  {...form.register("isActive")}
                  className="w-4 h-4"
                />
                <label className="text-sm font-medium">Активна</label>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border rounded-lg hover:bg-gray-50"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  {editingService ? "Сохранить" : "Создать"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
