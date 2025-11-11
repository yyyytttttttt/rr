"use client";

import { useState, useEffect } from "react";
import SearchBar from "../_components/SearchBar";
import Filters, { type FilterChip } from "../_components/Filters";
import BookingDetailsModal from "../_modals/BookingDetailsModal";
import { format } from "date-fns";
import { ru } from "date-fns/locale";

type PanelProps = {
  userId: string;
  filters: Record<string, string | string[] | undefined>;
};

type Booking = {
  id: string;
  doctorName: string;
  clientName: string;
  serviceName: string;
  startTime: string;
  endTime: string;
  status: string;
};

export default function SpecialistsSchedulePanel({ userId, filters }: PanelProps) {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterValues, setFilterValues] = useState<Record<string, string | null>>({
    date: null,
    specialist: null,
    status: null,
  });
  const [specialists, setSpecialists] = useState<Array<{ value: string; label: string }>>([]);
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null);

  const filterChips: FilterChip[] = [
    {
      key: "date",
      label: "Дата",
      value: filterValues.date,
      options: [
        { value: "today", label: "Сегодня" },
        { value: "tomorrow", label: "Завтра" },
        { value: "week", label: "Неделя" },
      ],
    },
    {
      key: "specialist",
      label: "Специалист",
      value: filterValues.specialist,
      options: specialists,
    },
    {
      key: "status",
      label: "Статус",
      value: filterValues.status,
      options: [
        { value: "PENDING", label: "Ожидает подтверждения" },
        { value: "CONFIRMED", label: "Подтверждено" },
        { value: "COMPLETED", label: "Завершено" },
        { value: "CANCELED", label: "Отменено" },
      ],
    },
  ];

  useEffect(() => {
    loadSpecialists();
  }, []);

  useEffect(() => {
    loadBookings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery, filterValues]);

  const loadSpecialists = async () => {
    try {
      const res = await fetch("/api/doctors");
      if (res.ok) {
        const data = await res.json();
        const options = (data.items || []).map((doc: any) => ({
          value: doc.id,
          label: doc.user?.name || doc.title || "Врач",
        }));
        setSpecialists(options);
      }
    } catch (error) {
      console.error("Failed to load specialists:", error);
    }
  };

  const loadBookings = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        query: searchQuery,
        ...(filterValues.date && { date: filterValues.date }),
        ...(filterValues.specialist && { doctorId: filterValues.specialist }),
        ...(filterValues.status && { status: filterValues.status }),
      });

      const res = await fetch(`/api/bookings?${params}`);
      if (!res.ok) throw new Error("Failed to fetch bookings");

      const data = await res.json();
      const items = (data.items || []).map((item: any) => ({
        id: item.id,
        doctorName: item.doctorName,
        clientName: item.clientName,
        serviceName: item.serviceName,
        startTime: item.startUtc,
        endTime: item.endUtc,
        status: item.status,
      }));

      setBookings(items);
    } catch (error) {
      console.error("Failed to load bookings:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key: string, value: string | null) => {
    setFilterValues((prev) => ({ ...prev, [key]: value }));
  };

  const handleResetFilters = () => {
    setFilterValues({ date: null, specialist: null, status: null });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "CONFIRMED":
        return "bg-[var(--admin-status-confirmed-bg)] text-[var(--admin-status-confirmed-text)]";
      case "PENDING":
        return "bg-[var(--admin-status-pending-bg)] text-[var(--admin-status-pending-text)]";
      case "COMPLETED":
        return "bg-[var(--admin-status-completed-bg)] text-[var(--admin-status-completed-text)]";
      case "CANCELED":
        return "bg-[var(--admin-status-canceled-bg)] text-[var(--admin-status-canceled-text)]";
      default:
        return "bg-[#F5F0E4] text-[#636846]";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "CONFIRMED":
        return "Подтверждено";
      case "PENDING":
        return "Ожидает";
      case "COMPLETED":
        return "Завершено";
      case "CANCELED":
        return "Отменено";
      default:
        return status;
    }
  };

  return (
    <div className="min-h-screen bg-[#FFFCF3] px-[clamp(1rem,0.5385rem+2.0513vw,3rem)] py-[clamp(2rem,1.7692rem+1.0256vw,3rem)]">
      {/* Search and Filters */}
      <div className="space-y-[clamp(1rem,0.8846rem+0.5128vw,1.5rem)]">
        <SearchBar placeholder="Поиск записей (врач/клиент/услуга)" onSearch={setSearchQuery} />
        <Filters chips={filterChips} onChange={handleFilterChange} onReset={handleResetFilters} />
      </div>

      {/* Bookings Grid */}
      {loading ? (
        <div className="flex justify-center items-center py-[clamp(3rem,2.5385rem+2.0513vw,5rem)] mt-[clamp(1.5rem,1.2692rem+1.0256vw,2.5rem)]">
          <div className="w-8 h-8 border-2 border-[#E8E2D5] border-t-[var(--admin-text-accent)] rounded-full animate-spin" />
        </div>
      ) : bookings.length === 0 ? (
        <div className="bg-white rounded-[clamp(1rem,0.8846rem+0.5128vw,1.5rem)] border border-[#E8E2D5] p-[clamp(3rem,2.5385rem+2.0513vw,5rem)] text-center mt-[clamp(1.5rem,1.2692rem+1.0256vw,2.5rem)]">
          <p className="text-[clamp(0.875rem,0.8077rem+0.2885vw,1.125rem)] font-ManropeRegular text-[#636846]">Записей не найдено</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-[clamp(1rem,0.8846rem+0.5128vw,1.5rem)] mt-[clamp(1.5rem,1.2692rem+1.0256vw,2.5rem)]">
          {bookings.map((booking) => (
            <div key={booking.id} className="bg-white rounded-[clamp(1rem,0.8846rem+0.5128vw,1.5rem)] border border-[#E8E2D5] p-[clamp(1rem,0.8846rem+0.5128vw,1.5rem)] hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between mb-[clamp(0.75rem,0.6346rem+0.5128vw,1.25rem)]">
                <div>
                  <h3 className="font-ManropeBold text-[clamp(1rem,0.9423rem+0.2564vw,1.25rem)] text-[#4F5338]">{booking.doctorName}</h3>
                  <p className="text-[clamp(0.875rem,0.8077rem+0.2885vw,1.125rem)] font-ManropeRegular text-[#636846]">{booking.serviceName}</p>
                </div>
                <span className={`px-[clamp(0.5rem,0.4423rem+0.2564vw,0.75rem)] py-[clamp(0.25rem,0.2115rem+0.1709vw,0.375rem)] text-[clamp(0.75rem,0.6923rem+0.2564vw,1rem)] font-ManropeMedium rounded-full ${getStatusColor(booking.status)}`}>
                  {getStatusLabel(booking.status)}
                </span>
              </div>

              <div className="space-y-[clamp(0.5rem,0.4423rem+0.2564vw,0.75rem)]">
                <div className="flex items-center gap-2">
                  <span className="text-[#636846]">👤</span>
                  <span className="text-[clamp(0.875rem,0.8077rem+0.2885vw,1.125rem)] font-ManropeRegular text-[#4F5338]">{booking.clientName}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[#636846]">🕐</span>
                  <span className="text-[clamp(0.875rem,0.8077rem+0.2885vw,1.125rem)] font-ManropeRegular text-[#4F5338]">
                    {format(new Date(booking.startTime), "d MMM, HH:mm", { locale: ru })} -{" "}
                    {format(new Date(booking.endTime), "HH:mm", { locale: ru })}
                  </span>
                </div>
              </div>

              <div className="mt-[clamp(1rem,0.8846rem+0.5128vw,1.5rem)] pt-[clamp(1rem,0.8846rem+0.5128vw,1.5rem)] border-t border-[#E8E2D5] flex gap-2">
                <button
                  onClick={() => setSelectedBookingId(booking.id)}
                  className="flex-1 px-[clamp(0.75rem,0.6346rem+0.5128vw,1.25rem)] py-[clamp(0.5rem,0.4423rem+0.2564vw,0.75rem)] text-[clamp(0.875rem,0.8077rem+0.2885vw,1.125rem)] font-ManropeMedium text-[#967450] bg-[#F5F0E4] rounded-[clamp(0.5rem,0.4423rem+0.2564vw,0.75rem)] hover:bg-[#E8E2D5] transition-colors"
                >
                  Подробнее
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Booking Details Modal */}
      {selectedBookingId && (
        <BookingDetailsModal
          open={!!selectedBookingId}
          onClose={() => setSelectedBookingId(null)}
          bookingId={selectedBookingId}
          onSuccess={() => {
            loadBookings();
            setSelectedBookingId(null);
          }}
        />
      )}
    </div>
  );
}
