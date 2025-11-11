"use client";

import { useState, useEffect } from "react";
import SearchBar from "../_components/SearchBar";
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
  doctorName: string;
  clientName: string;
  clientPhone: string;
  serviceName: string;
  startTime: string;
  status: string;
  paymentStatus: string;
};

export default function SpecialistsManagePanel({ userId, filters }: PanelProps) {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [total, setTotal] = useState(0);
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null);

  useEffect(() => {
    loadBookings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery, page]);

  const loadBookings = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        query: searchQuery,
        page: page.toString(),
        pageSize: pageSize.toString(),
      });

      const res = await fetch(`/api/bookings?${params}`);
      if (!res.ok) throw new Error("Failed to fetch bookings");

      const data = await res.json();
      const items = (data.items || []).map((item: any) => ({
        id: item.id,
        doctorName: item.doctorName,
        clientName: item.clientName,
        clientPhone: item.clientPhone,
        serviceName: item.serviceName,
        startTime: item.startUtc,
        status: item.status,
        paymentStatus: item.paymentStatus || "REQUIRES_PAYMENT",
      }));

      setBookings(items);
      setTotal(data.total || 0);
    } catch (error) {
      console.error("Failed to load bookings:", error);
    } finally {
      setLoading(false);
    }
  };

  const columns: Column<Booking>[] = [
    {
      key: "client",
      label: "Клиент",
      render: (item) => (
        <div className="min-w-0">
          <div className="font-ManropeMedium text-[#4F5338] admin-text-truncate">{item.clientName}</div>
          <div className="text-xs text-[#967450] font-ManropeRegular admin-text-truncate">{item.clientPhone}</div>
        </div>
      ),
    },
    {
      key: "doctor",
      label: "Врач",
      render: (item) => <span className="admin-text-truncate block">{item.doctorName}</span>,
    },
    {
      key: "service",
      label: "Услуга",
      render: (item) => <span className="admin-break-words block">{item.serviceName}</span>,
    },
    {
      key: "datetime",
      label: "Дата и время",
      render: (item) => (
        <span className="whitespace-nowrap">
          {format(new Date(item.startTime), "d MMM yyyy, HH:mm", { locale: ru })}
        </span>
      ),
    },
    {
      key: "status",
      label: "Статус",
      render: (item) => {
        const statusStyles = {
          PENDING: "bg-[var(--admin-status-pending-bg)] text-[var(--admin-status-pending-text)]",
          CONFIRMED: "bg-[var(--admin-status-confirmed-bg)] text-[var(--admin-status-confirmed-text)]",
          COMPLETED: "bg-[var(--admin-status-completed-bg)] text-[var(--admin-status-completed-text)]",
          CANCELED: "bg-[var(--admin-status-canceled-bg)] text-[var(--admin-status-canceled-text)]",
        };
        const statusLabels = {
          PENDING: "Ожидает",
          CONFIRMED: "Подтверждено",
          COMPLETED: "Завершено",
          CANCELED: "Отменено",
        };
        return (
          <span className={`inline-block px-[0.5rem] py-[0.25rem] text-xs font-ManropeMedium rounded-full whitespace-nowrap ${statusStyles[item.status as keyof typeof statusStyles]}`}>
            {statusLabels[item.status as keyof typeof statusLabels]}
          </span>
        );
      },
    },
    {
      key: "payment",
      label: "Оплата",
      render: (item) => {
        const paymentStyles = {
          REQUIRES_PAYMENT: "text-[var(--admin-payment-unpaid)]",
          PAID: "text-[var(--admin-payment-paid)]",
          REFUNDED: "text-[var(--admin-payment-refunded)]",
        };
        const paymentLabels = {
          REQUIRES_PAYMENT: "Не оплачено",
          PAID: "Оплачено",
          REFUNDED: "Возврат",
        };
        return (
          <span className={`text-xs font-ManropeMedium whitespace-nowrap ${paymentStyles[item.paymentStatus as keyof typeof paymentStyles]}`}>
            {paymentLabels[item.paymentStatus as keyof typeof paymentLabels]}
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
    <div className="space-y-[1.5rem] max-w-full overflow-x-hidden px-[2%]">
      <SearchBar placeholder="Поиск записей (врач/клиент/услуга/телефон)" onSearch={setSearchQuery} />

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
