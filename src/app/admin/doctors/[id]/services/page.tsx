"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
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

export default function DoctorServicesPage() {
  const params = useParams();
  const router = useRouter();
  const doctorId = params.id as string;

  const [data, setData] = useState<ServicesData | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchLinked, setSearchLinked] = useState("");
  const [searchAvailable, setSearchAvailable] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);

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
        // NOTE: Optimistic update
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
        // NOTE: Optimistic update
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
    ? Array.from(
        new Set(
          [...data.linked, ...data.available]
            .map((s) => s.category)
            .filter((c): c is NonNullable<typeof c> => c !== null)
        )
      )
    : [];

  const linkedFiltered = data ? filterServices(data.linked, searchLinked) : [];
  const availableFiltered = data ? filterServices(data.available, searchAvailable) : [];

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
          onClick={() => router.back()}
          className="text-blue-600 hover:underline mb-4"
        >
          ← Назад
        </button>

        <h1 className="text-3xl font-bold mb-6">Управление услугами врача</h1>

        {/* Category filter */}
        <div className="mb-6 flex gap-2 flex-wrap">
          <button
            onClick={() => setCategoryFilter(null)}
            className={`px-4 py-2 rounded-lg text-sm ${
              categoryFilter === null
                ? "bg-gray-700 text-white"
                : "bg-gray-200 hover:bg-gray-300"
            }`}
          >
            Все категории
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setCategoryFilter(cat.id)}
              className={`px-4 py-2 rounded-lg text-sm ${
                categoryFilter === cat.id
                  ? "bg-gray-700 text-white"
                  : "bg-gray-200 hover:bg-gray-300"
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Linked services */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Привязанные услуги ({linkedFiltered.length})</h2>
            <input
              type="text"
              placeholder="Поиск..."
              value={searchLinked}
              onChange={(e) => setSearchLinked(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-gray-500"
            />
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {linkedFiltered.length === 0 && (
                <p className="text-gray-500 text-center py-8">Нет привязанных услуг</p>
              )}
              {linkedFiltered.map((service) => (
                <div key={service.id} className="border rounded-lg p-3 flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="font-semibold">{service.name}</h3>
                    {service.description && (
                      <p className="text-sm text-gray-600">{service.description}</p>
                    )}
                    <p className="text-sm text-gray-500 mt-1">
                      {formatPrice(service.priceCents, service.currency)} • {service.durationMin} мин
                    </p>
                    {service.category && (
                      <span className="inline-block mt-1 px-2 py-1 bg-gray-100 text-xs rounded">
                        {service.category.name}
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => handleUnlink(service.id)}
                    className="ml-3 px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 text-sm"
                  >
                    Убрать
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Available services */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Доступные услуги ({availableFiltered.length})</h2>
            <input
              type="text"
              placeholder="Поиск..."
              value={searchAvailable}
              onChange={(e) => setSearchAvailable(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-gray-500"
            />
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {availableFiltered.length === 0 && (
                <p className="text-gray-500 text-center py-8">Нет доступных услуг</p>
              )}
              {availableFiltered.map((service) => (
                <div key={service.id} className="border rounded-lg p-3 flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="font-semibold">{service.name}</h3>
                    {service.description && (
                      <p className="text-sm text-gray-600">{service.description}</p>
                    )}
                    <p className="text-sm text-gray-500 mt-1">
                      {formatPrice(service.priceCents, service.currency)} • {service.durationMin} мин
                    </p>
                    {service.category && (
                      <span className="inline-block mt-1 px-2 py-1 bg-gray-100 text-xs rounded">
                        {service.category.name}
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => handleLink(service.id)}
                    className="ml-3 px-3 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200 text-sm"
                  >
                    Добавить
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
