"use client";

import { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import toast from "react-hot-toast";

type Props = {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
};

function formatPhoneNumber(value: string): string {
  const digits = value.replace(/\D/g, "");
  if (!digits) return "";

  let phoneDigits = digits;
  if (phoneDigits.startsWith("8")) {
    phoneDigits = phoneDigits.slice(1);
  } else if (phoneDigits.startsWith("7")) {
    phoneDigits = phoneDigits.slice(1);
  }

  phoneDigits = phoneDigits.slice(0, 10);

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

export default function AddClientModal({ open, onClose, onSuccess }: Props) {
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  const resetForm = () => {
    setName("");
    setEmail("");
    setPhone("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error("Имя обязательно");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim() || "",
          phone: phone.trim() || "",
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        const msg = data?.error || "Не удалось создать клиента";
        toast.error(msg);
        return;
      }

      toast.success("Клиент успешно создан");
      resetForm();
      onSuccess?.();
    } catch {
      toast.error("Не удалось создать клиента");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) {
          resetForm();
          onClose();
        }
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50" />
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-[clamp(1rem,0.8846rem+0.5128vw,1.5rem)] shadow-2xl z-50 w-[calc(100%-2rem)] max-w-[clamp(28rem,24rem+16vw,40rem)] max-h-[90vh] overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between gap-4 px-[clamp(1.5rem,1.2692rem+1.0256vw,2.5rem)] py-[clamp(1.25rem,1.0192rem+1.0256vw,2.25rem)] border-b border-[#E8E2D5]">
            <Dialog.Title className="flex-1 min-w-0 text-[clamp(1.25rem,1.1346rem+0.5128vw,1.75rem)] font-ManropeBold text-[#4F5338] truncate">
              Новый клиент
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

          {/* Form */}
          <div className="overflow-y-auto max-h-[calc(90vh-8rem)] px-[clamp(1.5rem,1.2692rem+1.0256vw,2.5rem)] py-[clamp(1.5rem,1.2692rem+1.0256vw,2.5rem)]">
            <form onSubmit={handleSubmit} className="space-y-[clamp(1.25rem,1.0192rem+1.0256vw,2.25rem)]">
              {/* Имя */}
              <div>
                <label className="block text-[clamp(0.875rem,0.8077rem+0.2885vw,1.125rem)] font-ManropeMedium text-[#4F5338] mb-[clamp(0.5rem,0.4423rem+0.2564vw,0.75rem)]">
                  Имя и фамилия <span className="text-red-400">*</span>
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

              {/* Email */}
              <div>
                <label className="block text-[clamp(0.875rem,0.8077rem+0.2885vw,1.125rem)] font-ManropeMedium text-[#4F5338] mb-[clamp(0.5rem,0.4423rem+0.2564vw,0.75rem)]">
                  Электронная почта
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="client@mail.com"
                  className="w-full px-[clamp(1rem,0.8846rem+0.5128vw,1.5rem)] py-[clamp(0.75rem,0.6346rem+0.5128vw,1.25rem)] bg-[#F5F0E4] border-none rounded-[clamp(0.5rem,0.4423rem+0.2564vw,0.75rem)] text-[clamp(0.875rem,0.8077rem+0.2885vw,1.125rem)] font-ManropeRegular text-[#4F5338] placeholder:text-[#636846] focus:outline-none focus:ring-2 focus:ring-[#967450]"
                />
              </div>

              {/* Телефон */}
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

              {/* Buttons */}
              <div className="flex items-center gap-[clamp(0.75rem,0.6346rem+0.5128vw,1.25rem)] pt-[clamp(1rem,0.8846rem+0.5128vw,1.5rem)]">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-[clamp(0.75rem,0.6346rem+0.5128vw,1.25rem)] bg-[#5C6744] text-white rounded-[clamp(0.5rem,0.4423rem+0.2564vw,0.75rem)] text-[clamp(0.875rem,0.8077rem+0.2885vw,1.125rem)] font-ManropeMedium hover:bg-[#4F5938] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? "Создание..." : "Создать клиента"}
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
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
