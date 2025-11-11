"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { format } from "date-fns";
import { ru } from "date-fns/locale";

type Service = {
  id: string;
  name: string;
  description: string | null;
  priceCents: number;
  currency: string;
  durationMin: number;
  category: { id: string; name: string; icon: string | null } | null;
};

type Category = {
  id: string;
  name: string;
  icon: string | null;
};

type Doctor = {
  id: string;
  name: string;
  title: string | null;
  image: string | null;
};

type Slot = {
  start: string;
  end: string;
};

type Props = {
  userName: string;
  userEmail: string;
  userImage: string;
};

export default function BookingClient({ userName, userEmail }: Props) {
  const router = useRouter();

  const [categories, setCategories] = useState<Category[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [selectedDate, setSelectedDate] = useState("");
  const [slots, setSlots] = useState<Slot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadCategories();
    loadServices();
  }, []);

  useEffect(() => {
    if (selectedService) {
      loadDoctors();
    }
  }, [selectedService]);

  useEffect(() => {
    if (selectedService && selectedDoctor && selectedDate) {
      loadSlots();
    }
  }, [selectedService, selectedDoctor, selectedDate]);

  const loadCategories = async () => {
    try {
      const res = await fetch("/api/services/categories");
      if (res.ok) {
        const data = await res.json();
        const cats = data.categories || [];
        setCategories(cats);
        // Автоматически выбираем первую категорию
        if (cats.length > 0) {
          setSelectedCategory(cats[0].id);
        }
      }
    } catch (error) {
      console.error("Failed to load categories:", error);
    }
  };

  const loadServices = async () => {
    try {
      const res = await fetch("/api/services/catalog");
      if (res.ok) {
        const data = await res.json();
        setServices(data.services || []);
      }
    } catch (error) {
      console.error("Failed to load services:", error);
      toast.error("Не удалось загрузить услуги");
    }
  };

  const loadDoctors = async () => {
    if (!selectedService) return;
    try {
      const res = await fetch(`/api/doctors/${selectedService.id}/list`);
      if (res.ok) {
        const data = await res.json();
        setDoctors(data.doctors || []);
      }
    } catch (error) {
      console.error("Failed to load doctors:", error);
      toast.error("Не удалось загрузить врачей");
    }
  };

  const loadSlots = async () => {
    if (!selectedService || !selectedDoctor || !selectedDate) return;
    try {
      const res = await fetch(
        `/api/availability?serviceId=${selectedService.id}&doctorId=${selectedDoctor.id}&date=${selectedDate}`
      );
      if (res.ok) {
        const data = await res.json();
        const doctorSlots = data.doctors?.find((d: any) => d.id === selectedDoctor.id);
        setSlots(doctorSlots?.slots || []);
      }
    } catch (error) {
      console.error("Failed to load slots:", error);
      toast.error("Не удалось загрузить доступное время");
    }
  };

  const handleBooking = async () => {
    if (!selectedService || !selectedDoctor || !selectedSlot) {
      toast.error("Выберите услугу, врача и время");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          doctorId: selectedDoctor.id,
          serviceId: selectedService.id,
          start: selectedSlot.start,
          note: note || undefined,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        toast.success("Запись успешно создана!");
        router.push("/profile");
      } else {
        toast.error(data.error || "Не удалось создать запись");
      }
    } catch (error) {
      console.error("Booking error:", error);
      toast.error("Произошла ошибка");
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (cents: number, currency: string) => {
    return new Intl.NumberFormat("ru-RU", {
      style: "currency",
      currency: currency || "RUB",
    }).format(cents / 100);
  };

  const minDate = new Date().toISOString().split("T")[0];

  // Группируем услуги по категориям
  const servicesWithoutCategory = services.filter((s) => !s.category);
  const servicesByCategory = services.filter((s) => s.category);

  // Фильтруем услуги по выбранной категории
  const filteredServices = selectedCategory
    ? servicesByCategory.filter((s) => s.category?.id === selectedCategory)
    : servicesWithoutCategory;

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <button
          onClick={() => router.push("/profile")}
          className="text-blue-600 hover:underline mb-4"
        >
          ← Назад в профиль
        </button>

        <h1 className="text-3xl font-bold mb-8">Записаться на приём</h1>

        <div className="space-y-6">
          {/* 1. Выбор услуги */}
          <section className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">1. Выберите услугу</h2>

            {/* Вкладки категорий */}
            {categories.length > 0 && (
              <div className="mb-4">
                <div className="flex flex-wrap gap-2 border-b pb-2">
                  {servicesWithoutCategory.length > 0 && (
                    <button
                      onClick={() => setSelectedCategory(null)}
                      className={`px-4 py-2 rounded-t-lg transition font-medium ${
                        selectedCategory === null
                          ? "bg-blue-600 text-white"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }`}
                    >
                      Все услуги
                    </button>
                  )}
                  {categories.map((category) => (
                    <button
                      key={category.id}
                      onClick={() => setSelectedCategory(category.id)}
                      className={`px-4 py-2 rounded-t-lg transition font-medium flex items-center gap-2 ${
                        selectedCategory === category.id
                          ? "bg-blue-600 text-white"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }`}
                    >
                      {category.icon && <span>{category.icon}</span>}
                      <span>{category.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {filteredServices.length === 0 && (
              <p className="text-gray-500 text-center py-4">Нет доступных услуг в этой категории</p>
            )}
            <div className="grid gap-3 md:grid-cols-2">
              {filteredServices.map((service) => (
                <div
                  key={service.id}
                  onClick={() => {
                    setSelectedService(service);
                    setSelectedDoctor(null);
                    setSelectedSlot(null);
                  }}
                  className={`border rounded-lg p-4 cursor-pointer transition ${
                    selectedService?.id === service.id
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 hover:border-blue-300"
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold">{service.name}</h3>
                    <span className="text-blue-600 font-bold whitespace-nowrap ml-2">
                      {formatPrice(service.priceCents, service.currency)}
                    </span>
                  </div>
                  {service.description && (
                    <p className="text-sm text-gray-600 mb-2">{service.description}</p>
                  )}
                  <p className="text-sm text-gray-500">{service.durationMin} мин</p>
                </div>
              ))}
            </div>
          </section>

          {/* 2. Выбор врача */}
          {selectedService && (
            <section className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">2. Выберите специалиста</h2>
              {doctors.length === 0 && (
                <p className="text-gray-500 text-center py-4">
                  Нет доступных специалистов для этой услуги
                </p>
              )}
              <div className="grid gap-3 md:grid-cols-2">
                {doctors.map((doctor) => (
                  <div
                    key={doctor.id}
                    onClick={() => {
                      setSelectedDoctor(doctor);
                      setSelectedSlot(null);
                    }}
                    className={`border rounded-lg p-4 cursor-pointer transition flex items-center gap-3 ${
                      selectedDoctor?.id === doctor.id
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 hover:border-blue-300"
                    }`}
                  >
                    {doctor.image && (
                      <img
                        src={doctor.image}
                        alt={doctor.name}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                    )}
                    <div>
                      <h3 className="font-semibold">{doctor.name}</h3>
                      {doctor.title && (
                        <p className="text-sm text-gray-600">{doctor.title}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* 3. Выбор даты */}
          {selectedDoctor && (
            <section className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">3. Выберите дату</h2>
              <input
                type="date"
                min={minDate}
                value={selectedDate}
                onChange={(e) => {
                  setSelectedDate(e.target.value);
                  setSelectedSlot(null);
                }}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </section>
          )}

          {/* 4. Выбор времени */}
          {selectedDate && (
            <section className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">4. Выберите время</h2>
              {slots.length === 0 && (
                <p className="text-gray-500 text-center py-4">
                  Нет доступного времени на эту дату
                </p>
              )}
              <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
                {slots.map((slot) => {
                  const startTime = new Date(slot.start);
                  return (
                    <button
                      key={slot.start}
                      onClick={() => setSelectedSlot(slot)}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition ${
                        selectedSlot?.start === slot.start
                          ? "bg-blue-600 text-white"
                          : "bg-gray-100 hover:bg-gray-200"
                      }`}
                    >
                      {format(startTime, "HH:mm")}
                    </button>
                  );
                })}
              </div>
            </section>
          )}

          {/* 5. Комментарий и подтверждение */}
          {selectedSlot && (
            <section className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">5. Подтвердите запись</h2>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <h3 className="font-semibold mb-2">Детали записи:</h3>
                <p className="text-sm">
                  <span className="font-medium">Услуга:</span> {selectedService?.name}
                </p>
                <p className="text-sm">
                  <span className="font-medium">Врач:</span> {selectedDoctor?.name}
                </p>
                <p className="text-sm">
                  <span className="font-medium">Дата и время:</span>{" "}
                  {format(new Date(selectedSlot.start), "d MMMM yyyy, HH:mm", {
                    locale: ru,
                  })}
                </p>
                <p className="text-sm">
                  <span className="font-medium">Стоимость:</span>{" "}
                  {formatPrice(selectedService!.priceCents, selectedService!.currency)}
                </p>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">
                  Комментарий (необязательно)
                </label>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Дополнительная информация для врача..."
                />
              </div>

              <button
                onClick={handleBooking}
                disabled={loading}
                className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition"
              >
                {loading ? "Оформление..." : "Подтвердить запись"}
              </button>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
