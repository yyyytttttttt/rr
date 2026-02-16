"use client";

import { useState, useEffect } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import toast from "react-hot-toast";
import { format } from "date-fns";
import { ru } from "date-fns/locale";

type Props = {
  open: boolean;
  onClose: () => void;
  clientId: string;
  onSuccess?: () => void;
};

type ClientData = {
  id: string;
  name: string;
  email: string;
  phone: string;
};

type BookingHistoryItem = {
  id: string;
  startUtc: string;
  endUtc: string;
  status: string;
  serviceName: string;
  doctorName: string;
  finalAmountCents: number | null;
};

// Функция форматирования телефона
function formatPhoneNumber(value: string): string {
  // Извлекаем только цифры
  const digits = value.replace(/\D/g, "");

  // Пустая строка - возвращаем пустую строку
  if (!digits) return "";

  // Убираем префикс 7 или 8 для обработки
  let phoneDigits = digits;
  if (phoneDigits.startsWith("8")) {
    phoneDigits = phoneDigits.slice(1);
  } else if (phoneDigits.startsWith("7")) {
    phoneDigits = phoneDigits.slice(1);
  }

  // Ограничиваем максимум 10 цифр (без кода страны)
  phoneDigits = phoneDigits.slice(0, 10);

  // Форматируем по частям
  let formatted = "+7";

  if (phoneDigits.length > 0) {
    formatted += " (";
    formatted += phoneDigits.slice(0, 3);

    if (phoneDigits.length >= 3) {
      formatted += ")";

      if (phoneDigits.length > 3) {
        formatted += " " + phoneDigits.slice(3, 6);

        if (phoneDigits.length > 6) {
          formatted += "-" + phoneDigits.slice(6, 8);

          if (phoneDigits.length > 8) {
            formatted += "-" + phoneDigits.slice(8, 10);
          }
        }
      }
    }
  }

  return formatted;
}

export default function EditClientModal({ open, onClose, clientId, onSuccess }: Props) {
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [activeTab, setActiveTab] = useState<"personal" | "history">("personal");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [additionalPhone, setAdditionalPhone] = useState("");
  const [bookings, setBookings] = useState<BookingHistoryItem[]>([]);
  const [loadingBookings, setLoadingBookings] = useState(false);

  useEffect(() => {
    if (open && clientId) {
      loadClientData();
    } else {
      resetForm();
    }
  }, [open, clientId]);

  useEffect(() => {
    if (open && clientId && activeTab === "history") {
      loadBookingHistory();
    }
  }, [open, clientId, activeTab]);

  const resetForm = () => {
    setName("");
    setEmail("");
    setPhone("");
    setBirthDate("");
    setAdditionalPhone("");
    setBookings([]);
    setActiveTab("personal");
    setLoadingData(true);
  };

  const loadBookingHistory = async () => {
    setLoadingBookings(true);
    try {
      const params = new URLSearchParams({ userId: clientId, pageSize: "50" });
      const res = await fetch(`/api/bookings?${params}`);
      if (!res.ok) throw new Error("Failed to load bookings");
      const data = await res.json();
      setBookings(data.items || []);
    } catch {
      setBookings([]);
    } finally {
      setLoadingBookings(false);
    }
  };

  const loadClientData = async () => {
    setLoadingData(true);
    try {
      const res = await fetch(`/api/admin/clients/${clientId}`);
      if (!res.ok) throw new Error("Failed to load client");

      const data: ClientData = await res.json();
      setName(data.name || "");
      setEmail(data.email || "");
      setPhone(formatPhoneNumber(data.phone || ""));
    } catch (error) {
      console.error("Failed to load client:", error);
      toast.error("Не удалось загрузить данные клиента");
    } finally {
      setLoadingData(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error("Имя обязательно");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/admin/clients/${clientId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim() || undefined,
          phone: phone.trim() || undefined,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to update client");
      }

      toast.success("Клиент успешно обновлен");
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error("Failed to update client:", error);
      toast.error(error instanceof Error ? error.message : "Не удалось обновить клиента");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50" />
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-[clamp(1rem,0.8846rem+0.5128vw,1.5rem)] shadow-2xl z-50 w-[calc(100%-2rem)] max-w-[clamp(32rem,28rem+16vw,48rem)] max-h-[90vh] overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between gap-4 px-[clamp(1.5rem,1.2692rem+1.0256vw,2.5rem)] py-[clamp(1.25rem,1.0192rem+1.0256vw,2.25rem)] border-b border-[#E8E2D5]">
            <Dialog.Title className="flex-1 min-w-0 text-[clamp(1.25rem,1.1346rem+0.5128vw,1.75rem)] font-ManropeBold text-[#4F5338] truncate">
              Профиль клиента
            </Dialog.Title>
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

          {/* Tabs */}
          <div className="flex gap-[clamp(2rem,1.5385rem+2.0513vw,4rem)] px-[clamp(1.5rem,1.2692rem+1.0256vw,2.5rem)] border-b border-[#E8E2D5]">
            <button
              onClick={() => setActiveTab("personal")}
              className={`py-[clamp(0.75rem,0.6346rem+0.5128vw,1.25rem)] text-[clamp(0.875rem,0.8077rem+0.2885vw,1.125rem)] font-ManropeMedium transition-all ${
                activeTab === "personal"
                  ? "text-[#4F5338] border-b-2 border-[var(--admin-text-heading)]"
                  : "text-[#9A8F7D] hover:text-[#636846]"
              }`}
            >
              Личные данные
            </button>
            <button
              onClick={() => setActiveTab("history")}
              className={`py-[clamp(0.75rem,0.6346rem+0.5128vw,1.25rem)] text-[clamp(0.875rem,0.8077rem+0.2885vw,1.125rem)] font-ManropeMedium transition-all ${
                activeTab === "history"
                  ? "text-[#4F5338] border-b-2 border-[var(--admin-text-heading)]"
                  : "text-[#9A8F7D] hover:text-[#636846]"
              }`}
            >
              История записей
            </button>
          </div>

          {/* Content */}
          <div className="overflow-y-auto max-h-[calc(90vh-12rem)] px-[clamp(1.5rem,1.2692rem+1.0256vw,2.5rem)] py-[clamp(1.5rem,1.2692rem+1.0256vw,2.5rem)]">
            {loadingData ? (
              <div className="flex justify-center items-center py-[clamp(3rem,2.5385rem+2.0513vw,5rem)]">
                <div className="w-8 h-8 border-2 border-[#E8E2D5] border-t-[var(--admin-text-accent)] rounded-full animate-spin" />
              </div>
            ) : activeTab === "personal" ? (
              <form onSubmit={handleSubmit} className="space-y-[clamp(1.25rem,1.0192rem+1.0256vw,2.25rem)]">
                {/* Имя и фамилия */}
                <div>
                  <label className="block text-[clamp(0.875rem,0.8077rem+0.2885vw,1.125rem)] font-ManropeMedium text-[#4F5338] mb-[clamp(0.5rem,0.4423rem+0.2564vw,0.75rem)]">
                    Имя и фамилия
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Иван Иванов"
                    required
                    className="w-full px-[clamp(1rem,0.8846rem+0.5128vw,1.5rem)] py-[clamp(0.75rem,0.6346rem+0.5128vw,1.25rem)] bg-[#F5F0E4] border-none rounded-[clamp(0.5rem,0.4423rem+0.2564vw,0.75rem)] text-[clamp(0.875rem,0.8077rem+0.2885vw,1.125rem)] font-ManropeRegular text-[#4F5338] placeholder:text-[#636846] focus:outline-none focus:ring-2 focus:ring-[#967450]"
                  />
                </div>

                {/* Дата рождения */}
                <div>
                  <label className="block text-[clamp(0.875rem,0.8077rem+0.2885vw,1.125rem)] font-ManropeMedium text-[#4F5338] mb-[clamp(0.5rem,0.4423rem+0.2564vw,0.75rem)]">
                    Дата рождения
                  </label>
                  <input
                    type="text"
                    value={birthDate}
                    onChange={(e) => setBirthDate(e.target.value)}
                    placeholder="12.14.1987"
                    className="w-full px-[clamp(1rem,0.8846rem+0.5128vw,1.5rem)] py-[clamp(0.75rem,0.6346rem+0.5128vw,1.25rem)] bg-[#F5F0E4] border-none rounded-[clamp(0.5rem,0.4423rem+0.2564vw,0.75rem)] text-[clamp(0.875rem,0.8077rem+0.2885vw,1.125rem)] font-ManropeRegular text-[#4F5338] placeholder:text-[#636846] focus:outline-none focus:ring-2 focus:ring-[#967450]"
                  />
                </div>

                {/* Электронная почта */}
                <div>
                  <label className="block text-[clamp(0.875rem,0.8077rem+0.2885vw,1.125rem)] font-ManropeMedium text-[#4F5338] mb-[clamp(0.5rem,0.4423rem+0.2564vw,0.75rem)]">
                    Электронная почта
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Realog@mail.com"
                    className="w-full px-[clamp(1rem,0.8846rem+0.5128vw,1.5rem)] py-[clamp(0.75rem,0.6346rem+0.5128vw,1.25rem)] bg-[#F5F0E4] border-none rounded-[clamp(0.5rem,0.4423rem+0.2564vw,0.75rem)] text-[clamp(0.875rem,0.8077rem+0.2885vw,1.125rem)] font-ManropeRegular text-[#4F5338] placeholder:text-[#636846] focus:outline-none focus:ring-2 focus:ring-[#967450]"
                  />
                </div>

                {/* Номер телефона */}
                <div>
                  <label className="block text-[clamp(0.875rem,0.8077rem+0.2885vw,1.125rem)] font-ManropeMedium text-[#4F5338] mb-[clamp(0.5rem,0.4423rem+0.2564vw,0.75rem)]">
                    Номер телефона
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(formatPhoneNumber(e.target.value))}
                    placeholder="+7 (900) 800-76-56"
                    className="w-full px-[clamp(1rem,0.8846rem+0.5128vw,1.5rem)] py-[clamp(0.75rem,0.6346rem+0.5128vw,1.25rem)] bg-[#F5F0E4] border-none rounded-[clamp(0.5rem,0.4423rem+0.2564vw,0.75rem)] text-[clamp(0.875rem,0.8077rem+0.2885vw,1.125rem)] font-ManropeRegular text-[#4F5338] placeholder:text-[#636846] focus:outline-none focus:ring-2 focus:ring-[#967450]"
                  />
                </div>

                {/* Дополнительный телефон */}
                <div>
                  <label className="block text-[clamp(0.875rem,0.8077rem+0.2885vw,1.125rem)] font-ManropeMedium text-[#4F5338] mb-[clamp(0.5rem,0.4423rem+0.2564vw,0.75rem)]">
                    Дополнительный телефон
                  </label>
                  <input
                    type="tel"
                    value={additionalPhone}
                    onChange={(e) => setAdditionalPhone(formatPhoneNumber(e.target.value))}
                    placeholder="+7 | (XXX) XXX-XX-XX"
                    className="w-full px-[clamp(1rem,0.8846rem+0.5128vw,1.5rem)] py-[clamp(0.75rem,0.6346rem+0.5128vw,1.25rem)] bg-[#F5F0E4] border-none rounded-[clamp(0.5rem,0.4423rem+0.2564vw,0.75rem)] text-[clamp(0.875rem,0.8077rem+0.2885vw,1.125rem)] font-ManropeRegular text-[#4F5338] placeholder:text-[#636846] focus:outline-none focus:ring-2 focus:ring-[#967450]"
                  />
                </div>

                {/* Buttons */}
                <div className="flex items-center gap-[clamp(0.75rem,0.6346rem+0.5128vw,1.25rem)] pt-[clamp(1rem,0.8846rem+0.5128vw,1.5rem)]">
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 py-[clamp(0.75rem,0.6346rem+0.5128vw,1.25rem)] bg-[#5C6744] text-white rounded-[clamp(0.5rem,0.4423rem+0.2564vw,0.75rem)] text-[clamp(0.875rem,0.8077rem+0.2885vw,1.125rem)] font-ManropeMedium hover:bg-[#4F5938] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? "Сохранение..." : "Сохранить"}
                  </button>
                  <Dialog.Close asChild>
                    <button
                      type="button"
                      disabled={loading}
                      className="flex-1 py-[clamp(0.75rem,0.6346rem+0.5128vw,1.25rem)] bg-[#F5F0E4] text-[#967450] rounded-[clamp(0.5rem,0.4423rem+0.2564vw,0.75rem)] text-[clamp(0.875rem,0.8077rem+0.2885vw,1.125rem)] font-ManropeMedium hover:bg-[#E8E2D5] transition-colors"
                    >
                      Отмена
                    </button>
                  </Dialog.Close>
                </div>
              </form>
            ) : loadingBookings ? (
              <div className="flex justify-center items-center py-[clamp(3rem,2.5385rem+2.0513vw,5rem)]">
                <div className="w-8 h-8 border-2 border-[#E8E2D5] border-t-[var(--admin-text-accent)] rounded-full animate-spin" />
              </div>
            ) : bookings.length === 0 ? (
              <div className="py-[clamp(3rem,2.5385rem+2.0513vw,5rem)] text-center">
                <p className="text-[clamp(0.875rem,0.8077rem+0.2885vw,1.125rem)] font-ManropeRegular text-[#636846]">
                  У клиента пока нет записей
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {bookings.map((b) => {
                  const statusMap: Record<string, { label: string; color: string }> = {
                    CONFIRMED: { label: "Подтверждено", color: "bg-[#E8F3E8] text-[#3D6B3D]" },
                    PENDING: { label: "Ожидает", color: "bg-[#FFF5E8] text-[#967450]" },
                    COMPLETED: { label: "Завершено", color: "bg-[#F0EBE1] text-[#4F5338]" },
                    CANCELED: { label: "Отменено", color: "bg-[#FFE5E5] text-[#C63D3D]" },
                    NO_SHOW: { label: "Не пришёл", color: "bg-[#FFE5E5] text-[#C63D3D]" },
                  };
                  const st = statusMap[b.status] || { label: b.status, color: "bg-[#F5F0E4] text-[#636846]" };

                  return (
                    <div key={b.id} className="bg-[#F5F0E4] rounded-xl p-4 space-y-2">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-sm font-ManropeBold text-[#4F5338] truncate">{b.serviceName}</p>
                          <p className="text-xs font-ManropeRegular text-[#636846] mt-0.5">{b.doctorName}</p>
                        </div>
                        <span className={`shrink-0 px-2.5 py-1 text-xs font-ManropeMedium rounded-full ${st.color}`}>
                          {st.label}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs font-ManropeRegular text-[#636846]">
                        <span>
                          {format(new Date(b.startUtc), "d MMM yyyy, HH:mm", { locale: ru })}
                          {" — "}
                          {format(new Date(b.endUtc), "HH:mm", { locale: ru })}
                        </span>
                        {b.finalAmountCents != null && b.finalAmountCents > 0 && (
                          <span className="font-ManropeMedium text-[#4F5338]">
                            {(b.finalAmountCents / 100).toLocaleString("ru-RU")} ₽
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
