"use client";

import { useEffect, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import toast from "react-hot-toast";

type Props = {
  open: boolean;
  onClose: () => void;
  bookingId: string;
  onSuccess?: () => void;
};

type BookingDetails = {
  id: string;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  doctorName: string;
  doctorImage: string | null;
  serviceName: string;
  startUtc: string;
  endUtc: string;
  status: string;
  note: string | null;
  priceCents: number;
  currency: string;
  paymentStatus: string | null;
};

export default function BookingDetailsModal({ open, onClose, bookingId, onSuccess }: Props) {
  const [booking, setBooking] = useState<BookingDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (open && bookingId) {
      loadBookingDetails();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, bookingId]);

  const loadBookingDetails = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/bookings/${bookingId}`);
      if (!res.ok) throw new Error("Failed to fetch booking details");
      const data = await res.json();
      setBooking(data);
    } catch (error) {
      console.error("Failed to load booking details:", error);
      toast.error("Не удалось загрузить данные записи");
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (newStatus: string) => {
    if (!booking) return;

    setUpdating(true);
    try {
      const res = await fetch(`/api/admin/bookings/${booking.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!res.ok) throw new Error("Failed to update status");

      toast.success("Статус обновлен");
      setBooking({ ...booking, status: newStatus });
      onSuccess?.();
    } catch (error) {
      console.error("Failed to update status:", error);
      toast.error("Не удалось обновить статус");
    } finally {
      setUpdating(false);
    }
  };

  const cancelBooking = async () => {
    if (!booking || !confirm("Вы уверены что хотите отменить запись?")) return;

    setUpdating(true);
    try {
      const res = await fetch(`/api/admin/bookings/${booking.id}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Failed to cancel booking");

      toast.success("Запись отменена");
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error("Failed to cancel booking:", error);
      toast.error("Не удалось отменить запись");
    } finally {
      setUpdating(false);
    }
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      PENDING: "Ожидает подтверждения",
      CONFIRMED: "Подтверждено",
      COMPLETED: "Завершено",
      CANCELED: "Отменено",
      NO_SHOW: "Не явился",
    };
    return labels[status] || status;
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      PENDING: "bg-[var(--admin-status-pending-bg)] text-[var(--admin-status-pending-text)]",
      CONFIRMED: "bg-[var(--admin-status-confirmed-bg)] text-[var(--admin-status-confirmed-text)]",
      COMPLETED: "bg-[var(--admin-status-completed-bg)] text-[var(--admin-status-completed-text)]",
      CANCELED: "bg-[var(--admin-status-canceled-bg)] text-[var(--admin-status-canceled-text)]",
      NO_SHOW: "bg-[#F5F0E4] text-[#636846]",
    };
    return colors[status] || "bg-[#F5F0E4] text-[#636846]";
  };

  const getPaymentStatusLabel = (status: string | null) => {
    if (!status) return "Не требуется";
    const labels: Record<string, string> = {
      REQUIRES_PAYMENT: "Ожидает оплаты",
      PAID: "Оплачено",
      REFUNDED: "Возврат",
      CANCELED: "Отменено",
    };
    return labels[status] || status;
  };

  return (
    <Dialog.Root open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50" />
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-[clamp(1rem,0.8846rem+0.5128vw,1.5rem)] shadow-2xl z-50 w-[calc(100%-2rem)] max-w-[clamp(36rem,32rem+16vw,52rem)] max-h-[95vh] overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between gap-4 px-[clamp(1.5rem,1.2692rem+1.0256vw,2.5rem)] py-[clamp(1.25rem,1.0192rem+1.0256vw,2.25rem)] border-b border-[#E8E2D5]">
            <Dialog.Title className="flex-1 min-w-0 text-[clamp(1.25rem,1.1346rem+0.5128vw,1.75rem)] font-ManropeBold text-[#4F5338] truncate">Детали записи</Dialog.Title>
            <Dialog.Close asChild>
              <button
                className="flex-shrink-0 p-1 text-[#636846] hover:text-[#4F5338] transition-colors rounded-lg hover:bg-[#F5F0E4]"
                aria-label="Закрыть"
              >
                <svg className="w-[clamp(1.5rem,1.3846rem+0.5128vw,2rem)] h-[clamp(1.5rem,1.3846rem+0.5128vw,2rem)]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </Dialog.Close>
          </div>

          {/* Content */}
          <div className="overflow-y-auto max-h-[calc(90vh-12rem)] px-[clamp(1.5rem,1.2692rem+1.0256vw,2.5rem)] py-[clamp(1.5rem,1.2692rem+1.0256vw,2.5rem)]">
            {loading ? (
              <div className="flex justify-center items-center py-[clamp(3rem,2.5385rem+2.0513vw,5rem)]">
                <div className="w-8 h-8 border-2 border-[#E8E2D5] border-t-[var(--admin-text-accent)] rounded-full animate-spin" />
              </div>
            ) : booking ? (
              <div className="space-y-[clamp(1.25rem,1.0192rem+1.0256vw,2.25rem)]">
                {/* Status */}
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <span className={`px-[clamp(1rem,0.8846rem+0.5128vw,1.5rem)] py-[clamp(0.5rem,0.4423rem+0.2564vw,0.75rem)] text-[clamp(0.75rem,0.6923rem+0.2564vw,1rem)] font-ManropeMedium rounded-full ${getStatusColor(booking.status)}`}>
                    {getStatusLabel(booking.status)}
                  </span>
                  <div className="text-[clamp(0.75rem,0.6923rem+0.2564vw,1rem)] font-ManropeRegular text-[#636846]">ID: {booking.id.slice(0, 8)}</div>
                </div>

                {/* Client Info */}
                <div className="bg-[#FFFCF3] rounded-[clamp(0.75rem,0.6346rem+0.5128vw,1.25rem)] p-[clamp(1rem,0.8846rem+0.5128vw,1.5rem)]">
                  <h3 className="text-[clamp(0.875rem,0.8077rem+0.2885vw,1.125rem)] font-ManropeBold text-[#4F5338] mb-[clamp(0.75rem,0.6346rem+0.5128vw,1.25rem)]">Клиент</h3>
                  <div className="space-y-[clamp(0.5rem,0.4423rem+0.2564vw,0.75rem)]">
                    <div className="flex items-center gap-2">
                      <span className="text-[#636846]">👤</span>
                      <span className="font-ManropeMedium text-[clamp(0.875rem,0.8077rem+0.2885vw,1.125rem)] text-[#4F5338]">{booking.clientName}</span>
                    </div>
                    {booking.clientEmail && (
                      <div className="flex items-center gap-2">
                        <span className="text-[#636846]">📧</span>
                        <a href={`mailto:${booking.clientEmail}`} className="text-[clamp(0.875rem,0.8077rem+0.2885vw,1.125rem)] font-ManropeRegular text-[#967450] hover:underline">
                          {booking.clientEmail}
                        </a>
                      </div>
                    )}
                    {booking.clientPhone && (
                      <div className="flex items-center gap-2">
                        <span className="text-[#636846]">📞</span>
                        <a href={`tel:${booking.clientPhone}`} className="text-[clamp(0.875rem,0.8077rem+0.2885vw,1.125rem)] font-ManropeRegular text-[#967450] hover:underline">
                          {booking.clientPhone}
                        </a>
                      </div>
                    )}
                  </div>
                </div>

                {/* Doctor Info */}
                <div className="bg-[#FFFCF3] rounded-[clamp(0.75rem,0.6346rem+0.5128vw,1.25rem)] p-[clamp(1rem,0.8846rem+0.5128vw,1.5rem)]">
                  <h3 className="text-[clamp(0.875rem,0.8077rem+0.2885vw,1.125rem)] font-ManropeBold text-[#4F5338] mb-[clamp(0.75rem,0.6346rem+0.5128vw,1.25rem)]">Специалист</h3>
                  <div className="flex items-center gap-3">
                    {booking.doctorImage ? (
                      <img src={booking.doctorImage} alt={booking.doctorName} className="w-[clamp(3rem,2.7692rem+1.0256vw,4rem)] h-[clamp(3rem,2.7692rem+1.0256vw,4rem)] rounded-full object-cover" />
                    ) : (
                      <div className="w-[clamp(3rem,2.7692rem+1.0256vw,4rem)] h-[clamp(3rem,2.7692rem+1.0256vw,4rem)] rounded-full bg-[#F5F0E4] flex items-center justify-center text-[#967450] font-ManropeBold text-[clamp(1.125rem,1.0096rem+0.5128vw,1.5rem)]">
                        {booking.doctorName.charAt(0)}
                      </div>
                    )}
                    <span className="font-ManropeMedium text-[clamp(0.875rem,0.8077rem+0.2885vw,1.125rem)] text-[#4F5338]">{booking.doctorName}</span>
                  </div>
                </div>

                {/* Appointment Info */}
                <div className="bg-[#FFFCF3] rounded-[clamp(0.75rem,0.6346rem+0.5128vw,1.25rem)] p-[clamp(1rem,0.8846rem+0.5128vw,1.5rem)]">
                  <h3 className="text-[clamp(0.875rem,0.8077rem+0.2885vw,1.125rem)] font-ManropeBold text-[#4F5338] mb-[clamp(0.75rem,0.6346rem+0.5128vw,1.25rem)]">Информация о записи</h3>
                  <div className="space-y-[clamp(0.75rem,0.6346rem+0.5128vw,1.25rem)]">
                    <div>
                      <div className="text-[clamp(0.75rem,0.6923rem+0.2564vw,1rem)] font-ManropeRegular text-[#636846] mb-1">Услуга</div>
                      <div className="font-ManropeMedium text-[clamp(0.875rem,0.8077rem+0.2885vw,1.125rem)] text-[#4F5338]">{booking.serviceName}</div>
                    </div>
                    <div>
                      <div className="text-[clamp(0.75rem,0.6923rem+0.2564vw,1rem)] font-ManropeRegular text-[#636846] mb-1">Дата и время</div>
                      <div className="font-ManropeMedium text-[clamp(0.875rem,0.8077rem+0.2885vw,1.125rem)] text-[#4F5338]">
                        {format(new Date(booking.startUtc), "d MMMM yyyy, EEEE", { locale: ru })}
                      </div>
                      <div className="text-[clamp(0.875rem,0.8077rem+0.2885vw,1.125rem)] font-ManropeRegular text-[#636846]">
                        {format(new Date(booking.startUtc), "HH:mm", { locale: ru })} -{" "}
                        {format(new Date(booking.endUtc), "HH:mm", { locale: ru })}
                      </div>
                    </div>
                    {booking.note && (
                      <div>
                        <div className="text-[clamp(0.75rem,0.6923rem+0.2564vw,1rem)] font-ManropeRegular text-[#636846] mb-1">Примечание</div>
                        <div className="text-[clamp(0.875rem,0.8077rem+0.2885vw,1.125rem)] font-ManropeRegular text-[#4F5338]">{booking.note}</div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Payment Info */}
                <div className="bg-[#FFFCF3] rounded-[clamp(0.75rem,0.6346rem+0.5128vw,1.25rem)] p-[clamp(1rem,0.8846rem+0.5128vw,1.5rem)]">
                  <h3 className="text-[clamp(0.875rem,0.8077rem+0.2885vw,1.125rem)] font-ManropeBold text-[#4F5338] mb-[clamp(0.75rem,0.6346rem+0.5128vw,1.25rem)]">Оплата</h3>
                  <div className="space-y-[clamp(0.5rem,0.4423rem+0.2564vw,0.75rem)]">
                    <div className="flex justify-between items-center">
                      <span className="text-[clamp(0.875rem,0.8077rem+0.2885vw,1.125rem)] font-ManropeRegular text-[#636846]">Стоимость:</span>
                      <span className="font-ManropeBold text-[clamp(0.875rem,0.8077rem+0.2885vw,1.125rem)] text-[#4F5338]">
                        {(booking.priceCents / 100).toLocaleString("ru-RU")} {booking.currency}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[clamp(0.875rem,0.8077rem+0.2885vw,1.125rem)] font-ManropeRegular text-[#636846]">Статус оплаты:</span>
                      <span className={`font-ManropeMedium text-[clamp(0.875rem,0.8077rem+0.2885vw,1.125rem)] ${booking.paymentStatus === "PAID" ? "text-[var(--admin-payment-paid)]" : "text-[#636846]"}`}>
                        {getPaymentStatusLabel(booking.paymentStatus)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Status Actions */}
                {booking.status !== "CANCELED" && booking.status !== "COMPLETED" && (
                  <div className="border-t border-[#E8E2D5] pt-[clamp(1rem,0.8846rem+0.5128vw,1.5rem)]">
                    <h3 className="text-[clamp(0.875rem,0.8077rem+0.2885vw,1.125rem)] font-ManropeBold text-[#4F5338] mb-[clamp(0.75rem,0.6346rem+0.5128vw,1.25rem)]">Действия</h3>
                    <div className="flex flex-wrap gap-[clamp(0.5rem,0.4423rem+0.2564vw,0.75rem)]">
                      {booking.status === "PENDING" && (
                        <button
                          onClick={() => updateStatus("CONFIRMED")}
                          disabled={updating}
                          className="px-[clamp(1rem,0.8846rem+0.5128vw,1.5rem)] py-[clamp(0.5rem,0.4423rem+0.2564vw,0.75rem)] bg-[#5C6744] text-white rounded-[clamp(0.5rem,0.4423rem+0.2564vw,0.75rem)] text-[clamp(0.875rem,0.8077rem+0.2885vw,1.125rem)] font-ManropeMedium hover:bg-[#4F5938] transition-colors disabled:opacity-50"
                        >
                          Подтвердить
                        </button>
                      )}
                      {booking.status === "CONFIRMED" && (
                        <>
                          <button
                            onClick={() => updateStatus("COMPLETED")}
                            disabled={updating}
                            className="px-[clamp(1rem,0.8846rem+0.5128vw,1.5rem)] py-[clamp(0.5rem,0.4423rem+0.2564vw,0.75rem)] bg-[#5C6744] text-white rounded-[clamp(0.5rem,0.4423rem+0.2564vw,0.75rem)] text-[clamp(0.875rem,0.8077rem+0.2885vw,1.125rem)] font-ManropeMedium hover:bg-[#4F5938] transition-colors disabled:opacity-50"
                          >
                            Завершить
                          </button>
                          <button
                            onClick={() => updateStatus("NO_SHOW")}
                            disabled={updating}
                            className="px-[clamp(1rem,0.8846rem+0.5128vw,1.5rem)] py-[clamp(0.5rem,0.4423rem+0.2564vw,0.75rem)] bg-[#F5F0E4] text-[#967450] rounded-[clamp(0.5rem,0.4423rem+0.2564vw,0.75rem)] text-[clamp(0.875rem,0.8077rem+0.2885vw,1.125rem)] font-ManropeMedium hover:bg-[#E8E2D5] transition-colors disabled:opacity-50"
                          >
                            Не явился
                          </button>
                        </>
                      )}
                      <button
                        onClick={cancelBooking}
                        disabled={updating}
                        className="px-[clamp(1rem,0.8846rem+0.5128vw,1.5rem)] py-[clamp(0.5rem,0.4423rem+0.2564vw,0.75rem)] bg-[#F5E6E6] text-[#C74545] rounded-[clamp(0.5rem,0.4423rem+0.2564vw,0.75rem)] text-[clamp(0.875rem,0.8077rem+0.2885vw,1.125rem)] font-ManropeMedium hover:bg-[#EDD5D5] transition-colors disabled:opacity-50"
                      >
                        Отменить запись
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-[clamp(3rem,2.5385rem+2.0513vw,5rem)]">
                <p className="text-[clamp(0.875rem,0.8077rem+0.2885vw,1.125rem)] font-ManropeRegular text-[#636846]">Не удалось загрузить данные</p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-[#E8E2D5] px-[clamp(1.5rem,1.2692rem+1.0256vw,2.5rem)] py-[2%] flex justify-center">
            <Dialog.Close asChild>
              <button className="px-[clamp(1.5rem,1.2692rem+1.0256vw,2.5rem)] py-[clamp(0.625rem,0.5096rem+0.5128vw,1.125rem)] text-[clamp(0.875rem,0.8077rem+0.2885vw,1.125rem)] font-ManropeMedium text-[#967450] bg-[#F5F0E4] border border-[#E8E2D5] rounded-[clamp(0.5rem,0.4423rem+0.2564vw,0.75rem)] hover:bg-[#E8E2D5] transition-colors">
                Закрыть
              </button>
            </Dialog.Close>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
