"use client";

import { useState, useEffect } from "react";
import SearchBar from "../_components/SearchBar";
import Filters, { type FilterChip } from "../_components/Filters";
import PaginatedTable, { type Column, type Action } from "../_components/PaginatedTable";
import BookingDetailsModal from "../_modals/BookingDetailsModal";
import { format } from "date-fns";
import { ru } from "date-fns/locale";

type PanelProps = {
  userId: string;
  filters: Record<string, string | string[] | undefined>;
};

type Booking = {
  id: string;
  clientName: string;
  clientPhone: string;
  doctorName: string;
  serviceName: string;
  startTime: string;
  status: string;
  paymentStatus: string;
  promoCodeSnapshot: string | null;
  finalAmountCents: number | null;
  currency: string;
};

export default function ClientsBookingsPanel({ userId, filters }: PanelProps) {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterValues, setFilterValues] = useState<Record<string, string | null>>({
    status: null,
    date: null,
  });
  const [page, setPage] = useState(1);
  const [pageSize] = useState(15);
  const [total, setTotal] = useState(0);
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null);

  const filterChips: FilterChip[] = [
    {
      key: "status",
      label: "Статус",
      value: filterValues.status,
      options: [
        { value: "PENDING", label: "Ожидает" },
        { value: "CONFIRMED", label: "Подтверждено" },
        { value: "COMPLETED", label: "Завершено" },
        { value: "CANCELED", label: "Отменено" },
      ],
    },
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
  ];

  useEffect(() => {
    loadBookings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery, filterValues, page]);

  const loadBookings = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        query: searchQuery,
        page: page.toString(),
        pageSize: pageSize.toString(),
        ...(filterValues.status && { status: filterValues.status }),
        ...(filterValues.date && { date: filterValues.date }),
      });

      const res = await fetch(`/api/bookings?${params}`);
      if (!res.ok) throw new Error("Failed to fetch bookings");

      const data = await res.json();
      const items = (data.items || []).map((item: any) => ({
        id: item.id,
        clientName: item.clientName,
        clientPhone: item.clientPhone,
        doctorName: item.doctorName,
        serviceName: item.serviceName,
        startTime: item.startUtc,
        status: item.status,
        paymentStatus: item.paymentStatus || "REQUIRES_PAYMENT",
        promoCodeSnapshot: item.promoCodeSnapshot || null,
        finalAmountCents: item.finalAmountCents ?? item.priceCents ?? null,
        currency: item.currency || "RUB",
      }));

      setBookings(items);
      setTotal(data.total || 0);
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
    setFilterValues({ status: null, date: null });
    setPage(1);
  };

  const columns: Column<Booking>[] = [
    {
      key: "client",
      label: "Клиент",
      render: (item) => (
        <div>
          <div className="font-medium">{item.clientName}</div>
          <div className="text-xs text-gray-500">{item.clientPhone}</div>
        </div>
      ),
    },
    {
      key: "doctor",
      label: "Врач",
      render: (item) => item.doctorName,
    },
    {
      key: "service",
      label: "Услуга",
      render: (item) => item.serviceName,
    },
    {
      key: "datetime",
      label: "Дата и время",
      render: (item) => format(new Date(item.startTime), "d MMM yyyy, HH:mm", { locale: ru }),
    },
    {
      key: "promo",
      label: "Промокод",
      render: (item) =>
        item.promoCodeSnapshot ? (
          <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-50 text-green-700">
            {item.promoCodeSnapshot}
          </span>
        ) : (
          <span className="text-xs text-gray-400">—</span>
        ),
    },
    {
      key: "status",
      label: "Статус",
      render: (item) => {
        const statusColors = {
          PENDING: "bg-yellow-100 text-yellow-800",
          CONFIRMED: "bg-green-100 text-green-800",
          COMPLETED: "bg-blue-100 text-blue-800",
          CANCELED: "bg-red-100 text-red-800",
        };
        const statusLabels = {
          PENDING: "Ожидает",
          CONFIRMED: "Подтверждено",
          COMPLETED: "Завершено",
          CANCELED: "Отменено",
        };
        return (
          <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusColors[item.status as keyof typeof statusColors]}`}>
            {statusLabels[item.status as keyof typeof statusLabels]}
          </span>
        );
      },
    },
  ];

  const actions: Action<Booking>[] = [
    {
      label: "Подробнее",
      icon: "👁️",
      onClick: (item) => setSelectedBookingId(item.id),
      variant: "secondary",
    },
  ];

  return (
    <div className="space-y-6 px-4 py-4">
      <SearchBar placeholder="Поиск записей (клиент/врач/услуга/телефон)" onSearch={setSearchQuery} />
      <Filters chips={filterChips} onChange={handleFilterChange} onReset={handleResetFilters} />

      <PaginatedTable
        columns={columns}
        data={bookings}
        actions={actions}
        page={page}
        pageSize={pageSize}
        total={total}
        onPageChange={setPage}
        loading={loading}
        emptyMessage="Записей не найдено"
      />

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
