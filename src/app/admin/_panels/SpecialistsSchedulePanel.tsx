"use client";

import { useState, useEffect, useMemo } from "react";
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
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 9;

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
    setPage(1);
  };

  const handleResetFilters = () => {
    setFilterValues({ date: null, specialist: null, status: null });
    setPage(1);
  };

  // Reset page when search changes
  useEffect(() => { setPage(1); }, [searchQuery]);

  const totalPages = Math.ceil(bookings.length / PAGE_SIZE);
  const paginatedBookings = useMemo(
    () => bookings.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [bookings, page]
  );

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
    <div className="min-h-screen bg-[#FFFCF3] px-4 py-4">
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
        <>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-[clamp(1rem,0.8846rem+0.5128vw,1.5rem)] mt-[clamp(1.5rem,1.2692rem+1.0256vw,2.5rem)]">
          {paginatedBookings.map((booking) => (
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
                  <svg className="w-[clamp(1rem,0.9423rem+0.2564vw,1.25rem)] h-[clamp(1rem,0.9423rem+0.2564vw,1.25rem)] text-[#636846] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                  </svg>
                  <span className="text-[clamp(0.875rem,0.8077rem+0.2885vw,1.125rem)] font-ManropeRegular text-[#4F5338]">{booking.clientName}</span>
                </div>
                <div className="flex items-center gap-2">
                  <svg className="w-[clamp(1rem,0.9423rem+0.2564vw,1.25rem)] h-[clamp(1rem,0.9423rem+0.2564vw,1.25rem)] text-[#636846] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
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

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="bg-white rounded-2xl border border-[#E8E2D5] px-4 py-3 mt-6 flex items-center justify-between flex-wrap gap-4">
            <div className="text-xs sm:text-sm font-ManropeRegular text-[#636846]">
              Показано{" "}
              <span className="font-ManropeMedium text-[#4F5338]">{(page - 1) * PAGE_SIZE + 1}</span>
              {" - "}
              <span className="font-ManropeMedium text-[#4F5338]">{Math.min(page * PAGE_SIZE, bookings.length)}</span>
              {" из "}
              <span className="font-ManropeMedium text-[#4F5338]">{bookings.length}</span>
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
        </>
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
