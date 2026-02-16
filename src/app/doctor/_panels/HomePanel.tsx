"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect, useCallback } from "react";

type Props = {
  doctorId: string;
  tzid: string;
  doctorName: string;
  doctorEmail: string;
  doctorImage: string;
  doctorTitle?: string | null;
  bufferMin?: number;
  slotDurationMin?: number;
  minLeadMin?: number;
};

type Stats = {
  todayCount: number;
  upcomingCount: number;
  totalBookings: number;
};

type Booking = {
  id: string;
  startUtc: string;
  endUtc: string;
  status: "PENDING" | "CONFIRMED" | "CANCELED" | "COMPLETED" | "NO_SHOW";
  note: string | null;
  createdAt: string;
  service: {
    id: string;
    name: string;
    durationMin: number;
    priceCents: number;
    currency: string;
  } | null;
  client: {
    id: string;
    name: string | null;
    email: string | null;
    phone: string | null;
    image: string | null;
  } | null;
};

type FilterType = "today" | "upcoming" | "all";

const STATUS_LABELS: Record<string, string> = {
  PENDING: "Ожидает",
  CONFIRMED: "Подтверждена",
  CANCELED: "Отменена",
  COMPLETED: "Завершена",
  NO_SHOW: "Не явился",
};

const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-800",
  CONFIRMED: "bg-green-100 text-green-800",
  CANCELED: "bg-red-100 text-red-800",
  COMPLETED: "bg-blue-100 text-blue-800",
  NO_SHOW: "bg-gray-100 text-gray-800",
};

export default function HomePanel({
  doctorId,
  doctorName,
  doctorTitle,
  bufferMin,
  slotDurationMin,
  minLeadMin,
  tzid,
}: Props) {
  const router = useRouter();
  const [stats, setStats] = useState<Stats>({ todayCount: 0, upcomingCount: 0, totalBookings: 0 });
  const [loading, setLoading] = useState(true);

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [modalFilter, setModalFilter] = useState<FilterType>("today");
  const [modalTitle, setModalTitle] = useState("");
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [bookingsLoading, setBookingsLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const firstName = doctorName?.split(' ')[0] || 'Доктор';

  useEffect(() => {
    fetch(`/api/doctor/stats?doctorId=${doctorId}`)
      .then(res => res.json())
      .then(data => {
        if (data.ok) {
          setStats({
            todayCount: data.todayCount || 0,
            upcomingCount: data.upcomingCount || 0,
            totalBookings: data.totalBookings || 0,
          });
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [doctorId]);

  const loadBookings = useCallback(async (filter: FilterType) => {
    setBookingsLoading(true);
    try {
      const res = await fetch(`/api/doctor/bookings?doctorId=${doctorId}&filter=${filter}`);
      const data = await res.json();
      if (data.ok) {
        setBookings(data.bookings);
      }
    } catch (error) {
      console.error("Error loading bookings:", error);
    } finally {
      setBookingsLoading(false);
    }
  }, [doctorId]);

  const openModal = (filter: FilterType, title: string) => {
    setModalFilter(filter);
    setModalTitle(title);
    setModalOpen(true);
    loadBookings(filter);
  };

  const closeModal = () => {
    setModalOpen(false);
    setBookings([]);
  };

  const handleStatusChange = async (bookingId: string, nextStatus: string) => {
    setActionLoading(bookingId);
    try {
      const res = await fetch("/api/doctor/bookings/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId, nextStatus }),
      });
      const data = await res.json();
      if (data.ok) {
        // Reload bookings and stats
        loadBookings(modalFilter);
        fetch(`/api/doctor/stats?doctorId=${doctorId}`)
          .then(res => res.json())
          .then(data => {
            if (data.ok) {
              setStats({
                todayCount: data.todayCount || 0,
                upcomingCount: data.upcomingCount || 0,
                totalBookings: data.totalBookings || 0,
              });
            }
          });
      }
    } catch (error) {
      console.error("Error updating status:", error);
    } finally {
      setActionLoading(null);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("ru-RU", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString("ru-RU", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatPrice = (cents: number, currency: string) => {
    return new Intl.NumberFormat("ru-RU", {
      style: "currency",
      currency: currency || "RUB",
      minimumFractionDigits: 0,
    }).format(cents / 100);
  };

  const quickActions = [
    { view: "calendar", icon: "📅", title: "Календарь", description: "Управление расписанием и записями" },
    { view: "services", icon: "💼", title: "Мои услуги", description: "Управление услугами" },
    { view: "schedule", icon: "📋", title: "Расписание", description: "Настройка недельных шаблонов" },
    { view: "blocks", icon: "🏖️", title: "Блокировки", description: "Отпуска, выходные, перерывы" },
  ];

  return (
    <div className="min-h-screen bg-[#FFFCF3] px-4 py-6 sm:py-8">
      {/* Заголовок */}
      <h1 className="text-[clamp(1.5rem,1.2692rem+1.0256vw,2.5rem)] font-ManropeBold text-[#4F5338] mb-[clamp(2rem,1.5385rem+2.0513vw,4rem)]">
        {firstName}, добро пожаловать в личный кабинет врача
      </h1>

      {/* Статистика */}
      <div className="grid md:grid-cols-3 gap-[clamp(1rem,0.7692rem+1.0256vw,2rem)] mb-[clamp(2rem,1.5385rem+2.0513vw,4rem)]">
        <button
          onClick={() => openModal("today", "Записи на сегодня")}
          className="bg-white rounded-[20px] p-[clamp(1.5rem,1.2692rem+1.0256vw,2.5rem)] border border-[#E8E2D5] text-left hover:border-[#5C6744] hover:shadow-md transition-all duration-200 cursor-pointer"
        >
          <h3 className="text-[clamp(0.875rem,0.8077rem+0.2885vw,1.125rem)] font-ManropeRegular text-[#636846] mb-2">
            Записей сегодня
          </h3>
          <p className="text-[clamp(2rem,1.5385rem+2.0513vw,4rem)] font-ManropeBold text-[#5C6744]">
            {loading ? "..." : stats.todayCount}
          </p>
          <p className="text-[clamp(0.75rem,0.7115rem+0.1538vw,0.875rem)] font-ManropeRegular text-[#967450] mt-2">
            Нажмите для просмотра →
          </p>
        </button>

        <button
          onClick={() => openModal("upcoming", "Предстоящие записи")}
          className="bg-white rounded-[20px] p-[clamp(1.5rem,1.2692rem+1.0256vw,2.5rem)] border border-[#E8E2D5] text-left hover:border-[#967450] hover:shadow-md transition-all duration-200 cursor-pointer"
        >
          <h3 className="text-[clamp(0.875rem,0.8077rem+0.2885vw,1.125rem)] font-ManropeRegular text-[#636846] mb-2">
            Предстоящих записей
          </h3>
          <p className="text-[clamp(2rem,1.5385rem+2.0513vw,4rem)] font-ManropeBold text-[#967450]">
            {loading ? "..." : stats.upcomingCount}
          </p>
          <p className="text-[clamp(0.75rem,0.7115rem+0.1538vw,0.875rem)] font-ManropeRegular text-[#967450] mt-2">
            Нажмите для просмотра →
          </p>
        </button>

        <button
          onClick={() => openModal("all", "Все записи")}
          className="bg-white rounded-[20px] p-[clamp(1.5rem,1.2692rem+1.0256vw,2.5rem)] border border-[#E8E2D5] text-left hover:border-[#4F5338] hover:shadow-md transition-all duration-200 cursor-pointer"
        >
          <h3 className="text-[clamp(0.875rem,0.8077rem+0.2885vw,1.125rem)] font-ManropeRegular text-[#636846] mb-2">
            Всего записей
          </h3>
          <p className="text-[clamp(2rem,1.5385rem+2.0513vw,4rem)] font-ManropeBold text-[#4F5338]">
            {loading ? "..." : stats.totalBookings}
          </p>
          <p className="text-[clamp(0.75rem,0.7115rem+0.1538vw,0.875rem)] font-ManropeRegular text-[#967450] mt-2">
            Нажмите для просмотра →
          </p>
        </button>
      </div>

      {/* Быстрые действия */}
      <div className="bg-white rounded-[20px] p-[clamp(1.5rem,1.2692rem+1.0256vw,2.5rem)] border border-[#E8E2D5] mb-[clamp(2rem,1.5385rem+2.0513vw,4rem)]">
        <h2 className="text-[clamp(1.25rem,1.1346rem+0.5128vw,1.75rem)] font-ManropeSemiBold text-[#4F5338] mb-[clamp(1.5rem,1.2692rem+1.0256vw,2.5rem)]">
          Быстрые действия
        </h2>

        <div className="grid md:grid-cols-2 gap-[clamp(1rem,0.8846rem+0.5128vw,1.5rem)]">
          {quickActions.map((action) => (
            <button
              key={action.view}
              onClick={() => router.replace(`/doctor?view=${action.view}`, { scroll: false })}
              className="flex items-start gap-4 p-[clamp(1rem,0.8846rem+0.5128vw,1.5rem)] border border-[#E8E2D5] rounded-[16px] hover:bg-[#F5F0E4] hover:border-[#967450] transition-all duration-200 text-left"
            >
              <span className="text-[clamp(1.5rem,1.3846rem+0.5128vw,2rem)] flex-shrink-0">{action.icon}</span>
              <div>
                <h3 className="text-[clamp(1rem,0.9423rem+0.2564vw,1.25rem)] font-ManropeSemiBold text-[#4F5338] mb-1">
                  {action.title}
                </h3>
                <p className="text-[clamp(0.875rem,0.8077rem+0.2885vw,1.125rem)] font-ManropeRegular text-[#636846]">
                  {action.description}
                </p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Отступ снизу */}
      <div className="h-[clamp(2rem,1.5385rem+2.0513vw,4rem)]" />

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50"
            onClick={closeModal}
          />

          {/* Modal content */}
          <div className="relative bg-[#FFFCF3] rounded-[20px] w-full max-w-3xl max-h-[85vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="p-[clamp(1.5rem,1.2692rem+1.0256vw,2.5rem)] border-b border-[#E8E2D5]">
              <div className="flex items-center justify-between">
                <h2 className="text-[clamp(1.25rem,1.1346rem+0.5128vw,1.75rem)] font-ManropeBold text-[#4F5338]">
                  {modalTitle}
                </h2>
                <button
                  onClick={closeModal}
                  className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-[#E8E2D5] transition-colors"
                >
                  <svg className="w-6 h-6 text-[#636846]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <p className="text-[clamp(0.875rem,0.8077rem+0.2885vw,1.125rem)] font-ManropeRegular text-[#636846] mt-2">
                {modalFilter === "today" && "Записи на сегодняшний день"}
                {modalFilter === "upcoming" && "Все предстоящие записи"}
                {modalFilter === "all" && "История всех записей"}
              </p>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-[clamp(1.5rem,1.2692rem+1.0256vw,2.5rem)]">
              {bookingsLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="w-8 h-8 border-4 border-[#5C6744] border-t-transparent rounded-full animate-spin" />
                </div>
              ) : bookings.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-[clamp(1rem,0.9423rem+0.2564vw,1.25rem)] font-ManropeRegular text-[#636846]">
                    Записей не найдено
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {bookings.map((booking) => {
                    const isPast = new Date(booking.endUtc) < new Date();
                    const hasClientInfo = booking.client?.name || booking.client?.email || booking.client?.phone;

                    return (
                    <div
                      key={booking.id}
                      className={`rounded-[16px] p-[clamp(1rem,0.8846rem+0.5128vw,1.5rem)] border ${
                        isPast
                          ? "bg-[#F5F0E4] border-[#D4CFC4] opacity-75"
                          : "bg-white border-[#E8E2D5]"
                      }`}
                    >
                      {/* Booking header */}
                      <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-[clamp(1rem,0.9423rem+0.2564vw,1.25rem)] font-ManropeSemiBold text-[#4F5338]">
                              {booking.service?.name || "Услуга"}
                            </h3>
                            {isPast && (booking.status === "PENDING" || booking.status === "CONFIRMED") && (
                              <span className="px-2 py-0.5 bg-[#CB7A5C] text-white rounded text-[clamp(0.625rem,0.5865rem+0.1538vw,0.75rem)] font-ManropeMedium">
                                Прошло
                              </span>
                            )}
                          </div>
                          <p className="text-[clamp(0.875rem,0.8077rem+0.2885vw,1.125rem)] font-ManropeRegular text-[#636846]">
                            {formatDate(booking.startUtc)} в {formatTime(booking.startUtc)} — {formatTime(booking.endUtc)}
                          </p>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-[clamp(0.75rem,0.7115rem+0.1538vw,0.875rem)] font-ManropeMedium ${STATUS_COLORS[booking.status]}`}>
                          {STATUS_LABELS[booking.status]}
                        </span>
                      </div>

                      {/* Client info */}
                      <div className="mb-4 p-3 bg-[#F5F0E4] rounded-[12px]">
                        <p className="text-[clamp(0.75rem,0.7115rem+0.1538vw,0.875rem)] font-ManropeRegular text-[#636846] mb-1">
                          Клиент
                        </p>
                        {hasClientInfo ? (
                          <>
                            <p className="text-[clamp(0.875rem,0.8077rem+0.2885vw,1.125rem)] font-ManropeSemiBold text-[#4F5338]">
                              {booking.client?.name || "Имя не указано"}
                            </p>
                            {booking.client?.phone && (
                              <p className="text-[clamp(0.875rem,0.8077rem+0.2885vw,1.125rem)] font-ManropeRegular text-[#636846]">
                                📞 {booking.client.phone}
                              </p>
                            )}
                            {booking.client?.email && (
                              <p className="text-[clamp(0.875rem,0.8077rem+0.2885vw,1.125rem)] font-ManropeRegular text-[#636846]">
                                ✉️ {booking.client.email}
                              </p>
                            )}
                          </>
                        ) : (
                          <p className="text-[clamp(0.875rem,0.8077rem+0.2885vw,1.125rem)] font-ManropeRegular text-[#967450]">
                            Данные клиента не указаны
                          </p>
                        )}
                      </div>

                      {/* Service details */}
                      <div className="flex flex-wrap gap-4 mb-4">
                        {booking.service?.durationMin && (
                          <div>
                            <p className="text-[clamp(0.75rem,0.7115rem+0.1538vw,0.875rem)] font-ManropeRegular text-[#636846]">
                              Длительность
                            </p>
                            <p className="text-[clamp(0.875rem,0.8077rem+0.2885vw,1.125rem)] font-ManropeSemiBold text-[#4F5338]">
                              {booking.service.durationMin} мин
                            </p>
                          </div>
                        )}
                        {booking.service?.priceCents && (
                          <div>
                            <p className="text-[clamp(0.75rem,0.7115rem+0.1538vw,0.875rem)] font-ManropeRegular text-[#636846]">
                              Стоимость
                            </p>
                            <p className="text-[clamp(0.875rem,0.8077rem+0.2885vw,1.125rem)] font-ManropeSemiBold text-[#4F5338]">
                              {formatPrice(booking.service.priceCents, booking.service.currency)}
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Note */}
                      {booking.note && (
                        <div className="mb-4">
                          <p className="text-[clamp(0.75rem,0.7115rem+0.1538vw,0.875rem)] font-ManropeRegular text-[#636846]">
                            Примечание
                          </p>
                          <p className="text-[clamp(0.875rem,0.8077rem+0.2885vw,1.125rem)] font-ManropeRegular text-[#4F5338]">
                            {booking.note}
                          </p>
                        </div>
                      )}

                      {/* Actions */}
                      {(booking.status === "PENDING" || booking.status === "CONFIRMED") && (
                        <div className="flex flex-wrap gap-2 pt-4 border-t border-[#E8E2D5]">
                          {booking.status === "PENDING" && (
                            <button
                              onClick={() => handleStatusChange(booking.id, "CONFIRMED")}
                              disabled={actionLoading === booking.id}
                              className="px-4 py-2 bg-[#5C6744] text-white rounded-[10px] text-[clamp(0.875rem,0.8077rem+0.2885vw,1.125rem)] font-ManropeMedium hover:bg-[#4F5938] transition-colors disabled:opacity-50"
                            >
                              {actionLoading === booking.id ? "..." : "Подтвердить"}
                            </button>
                          )}
                          {booking.status === "CONFIRMED" && (
                            <>
                              <button
                                onClick={() => handleStatusChange(booking.id, "COMPLETED")}
                                disabled={actionLoading === booking.id}
                                className="px-4 py-2 bg-[#5C6744] text-white rounded-[10px] text-[clamp(0.875rem,0.8077rem+0.2885vw,1.125rem)] font-ManropeMedium hover:bg-[#4F5938] transition-colors disabled:opacity-50"
                              >
                                {actionLoading === booking.id ? "..." : "Завершить"}
                              </button>
                              <button
                                onClick={() => handleStatusChange(booking.id, "NO_SHOW")}
                                disabled={actionLoading === booking.id}
                                className="px-4 py-2 bg-[#636846] text-white rounded-[10px] text-[clamp(0.875rem,0.8077rem+0.2885vw,1.125rem)] font-ManropeMedium hover:bg-[#4F5338] transition-colors disabled:opacity-50"
                              >
                                {actionLoading === booking.id ? "..." : "Не явился"}
                              </button>
                            </>
                          )}
                          <button
                            onClick={() => handleStatusChange(booking.id, "CANCELED")}
                            disabled={actionLoading === booking.id}
                            className="px-4 py-2 bg-white border border-[#CB7A5C] text-[#CB7A5C] rounded-[10px] text-[clamp(0.875rem,0.8077rem+0.2885vw,1.125rem)] font-ManropeMedium hover:bg-[#CB7A5C] hover:text-white transition-colors disabled:opacity-50"
                          >
                            {actionLoading === booking.id ? "..." : "Отменить запись"}
                          </button>
                        </div>
                      )}
                    </div>
                  );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
