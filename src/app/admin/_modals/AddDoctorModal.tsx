"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import toast from "react-hot-toast";

type Props = {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
};

type UserOption = {
  id: string;
  name: string;
  email: string;
};

type Mode = "existing" | "new";

type Credentials = { email: string; password: string } | null;

export default function AddDoctorModal({ open, onClose, onSuccess }: Props) {
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<Mode>("existing");

  // Existing user search
  const [searchQuery, setSearchQuery] = useState("");
  const [users, setUsers] = useState<UserOption[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserOption | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // New user
  const [email, setEmail] = useState("");
  const [userName, setUserName] = useState("");

  // Common
  const [title, setTitle] = useState("");

  // Credentials after creation
  const [credentials, setCredentials] = useState<Credentials>(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        // do nothing - list is always visible
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Load all users on open
  useEffect(() => {
    if (!open) return;
    setCredentials(null);
    (async () => {
      setSearchLoading(true);
      try {
        const res = await fetch("/api/clients?pageSize=100");
        if (res.ok) {
          const data = await res.json();
          setUsers(
            (data.items || []).map((u: any) => ({
              id: u.id,
              name: u.name || "Без имени",
              email: u.email || "",
            }))
          );
        }
      } catch {
        setUsers([]);
      } finally {
        setSearchLoading(false);
      }
    })();
  }, [open]);

  const filteredUsers = useMemo(() => {
    if (!searchQuery.trim()) return users;
    const q = searchQuery.replace(/\s+/g, "").toLowerCase();
    return users.filter(
      (u) =>
        u.name.replace(/\s+/g, "").toLowerCase().includes(q) ||
        u.email.replace(/\s+/g, "").toLowerCase().includes(q)
    );
  }, [users, searchQuery]);

  const resetForm = () => {
    setMode("existing");
    setSearchQuery("");
    setUsers([]);
    setSelectedUser(null);
    setEmail("");
    setUserName("");
    setTitle("");
    setCredentials(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (mode === "existing" && !selectedUser) {
      toast.error("Выберите пользователя из списка");
      return;
    }
    if (mode === "new" && !email.trim()) {
      toast.error("Укажите email");
      return;
    }

    const payload: any = {};
    if (title.trim()) payload.title = title.trim();

    if (mode === "existing") {
      payload.userId = selectedUser!.id;
    } else {
      payload.email = email.trim();
      if (userName.trim()) payload.name = userName.trim();
    }

    setLoading(true);
    try {
      const res = await fetch("/api/doctors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const text = await res.text();
      let data: any = null;
      try { data = JSON.parse(text); } catch { /* ignore */ }

      if (!res.ok) {
        toast.error(data?.error || data?.message || "Ошибка создания специалиста");
        return;
      }

      onSuccess?.();

      if (data?.credentials?.email && data?.credentials?.password) {
        setCredentials({ email: data.credentials.email, password: data.credentials.password });
        toast.success("Специалист создан! Сохраните данные для входа.");
      } else {
        toast.success("Специалист успешно создан");
        resetForm();
        onClose();
      }
    } catch {
      toast.error("Ошибка создания");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) handleClose();
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50" />
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-[clamp(1rem,0.8846rem+0.5128vw,1.5rem)] shadow-2xl z-50 w-[calc(100%-2rem)] max-w-[clamp(28rem,24rem+16vw,40rem)] max-h-[90vh] overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between gap-4 px-[clamp(1.5rem,1.2692rem+1.0256vw,2.5rem)] py-[clamp(1.25rem,1.0192rem+1.0256vw,2.25rem)] border-b border-[#E8E2D5]">
            <Dialog.Title className="flex-1 min-w-0 text-[clamp(1.25rem,1.1346rem+0.5128vw,1.75rem)] font-ManropeBold text-[#4F5338] truncate">
              {credentials ? "Данные для входа" : "Добавить специалиста"}
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

          {/* Content */}
          <div className="overflow-y-auto max-h-[calc(90vh-8rem)] px-[clamp(1.5rem,1.2692rem+1.0256vw,2.5rem)] py-[clamp(1.5rem,1.2692rem+1.0256vw,2.5rem)]">

            {/* Credentials screen */}
            {credentials ? (
              <div className="space-y-5">
                <div className="bg-[#FFF5E8] border border-[#F0D9B5] rounded-xl p-4">
                  <p className="text-sm font-ManropeMedium text-[#967450] mb-1">
                    Сохраните эти данные — пароль показывается только один раз
                  </p>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-ManropeMedium text-[#636846] mb-1">Email (логин)</label>
                    <div className="flex items-center gap-2 bg-[#F5F0E4] rounded-xl px-4 py-3">
                      <span className="flex-1 text-sm font-ManropeMedium text-[#4F5338] break-all select-all">{credentials.email}</span>
                      <button
                        type="button"
                        onClick={() => { navigator.clipboard.writeText(credentials.email); toast.success("Email скопирован"); }}
                        className="shrink-0 p-1.5 text-[#636846] hover:text-[#4F5338] hover:bg-white rounded-lg transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9.75a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184" />
                        </svg>
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-ManropeMedium text-[#636846] mb-1">Пароль</label>
                    <div className="flex items-center gap-2 bg-[#F5F0E4] rounded-xl px-4 py-3">
                      <span className="flex-1 text-sm font-mono font-bold text-[#4F5338] select-all tracking-wider">{credentials.password}</span>
                      <button
                        type="button"
                        onClick={() => { navigator.clipboard.writeText(credentials.password); toast.success("Пароль скопирован"); }}
                        className="shrink-0 p-1.5 text-[#636846] hover:text-[#4F5338] hover:bg-white rounded-lg transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9.75a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleClose}
                  className="w-full py-[clamp(0.75rem,0.6346rem+0.5128vw,1.25rem)] bg-[#5C6744] text-white rounded-xl text-[clamp(0.875rem,0.8077rem+0.2885vw,1.125rem)] font-ManropeMedium hover:bg-[#4F5938] transition-colors"
                >
                  Готово
                </button>
              </div>
            ) : (

            /* Form */
            <form onSubmit={handleSubmit} className="space-y-[clamp(1.25rem,1.0192rem+1.0256vw,2rem)]">
              {/* Mode Toggle */}
              <div>
                <label className="block text-[clamp(0.875rem,0.8077rem+0.2885vw,1.125rem)] font-ManropeMedium text-[#4F5338] mb-[clamp(0.5rem,0.4423rem+0.2564vw,0.75rem)]">
                  Способ добавления
                </label>
                <div className="flex rounded-xl border border-[#E8E2D5] overflow-hidden">
                  <button
                    type="button"
                    onClick={() => { setMode("existing"); setEmail(""); setUserName(""); }}
                    className={`flex-1 py-3 text-sm font-ManropeMedium transition-colors ${
                      mode === "existing"
                        ? "bg-[#5C6744] text-white"
                        : "bg-white text-[#636846] hover:bg-[#F5F0E4]"
                    }`}
                  >
                    Из базы
                  </button>
                  <button
                    type="button"
                    onClick={() => { setMode("new"); setSelectedUser(null); setSearchQuery(""); }}
                    className={`flex-1 py-3 text-sm font-ManropeMedium transition-colors ${
                      mode === "new"
                        ? "bg-[#5C6744] text-white"
                        : "bg-white text-[#636846] hover:bg-[#F5F0E4]"
                    }`}
                  >
                    Новый
                  </button>
                </div>
              </div>

              {/* Existing user search */}
              {mode === "existing" && (
                <div>
                  <label className="block text-[clamp(0.875rem,0.8077rem+0.2885vw,1.125rem)] font-ManropeMedium text-[#4F5338] mb-[clamp(0.5rem,0.4423rem+0.2564vw,0.75rem)]">
                    Выберите клиента <span className="text-red-400">*</span>
                  </label>

                  {selectedUser ? (
                    <div className="flex items-center gap-3 bg-[#F5F0E4] rounded-xl px-4 py-3">
                      <div className="w-9 h-9 bg-[#5C6744] rounded-full flex items-center justify-center text-white text-sm font-ManropeBold shrink-0">
                        {selectedUser.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-ManropeMedium text-[#4F5338] truncate">{selectedUser.name}</p>
                        <p className="text-xs text-[#636846] truncate">{selectedUser.email}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => { setSelectedUser(null); setSearchQuery(""); }}
                        className="shrink-0 p-1 text-[#636846] hover:text-[#C63D3D] transition-colors rounded-lg hover:bg-white"
                      >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ) : (
                    <div ref={dropdownRef}>
                      {/* Search input */}
                      <div className="relative">
                        <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-[#636846] pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                        </svg>
                        <input
                          type="text"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          placeholder="Поиск..."
                          className="w-full pl-11 pr-4 py-[clamp(0.75rem,0.6346rem+0.5128vw,1.25rem)] bg-[#F5F0E4] border-none rounded-t-xl text-[clamp(0.875rem,0.8077rem+0.2885vw,1.125rem)] font-ManropeRegular text-[#4F5338] placeholder:text-[#9A8F7D] focus:outline-none focus:ring-2 focus:ring-[#967450]"
                        />
                        {searchLoading && (
                          <div className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-[#E8E2D5] border-t-[#5C6744] rounded-full animate-spin" />
                        )}
                      </div>

                      {/* User list */}
                      <div className="border border-[#E8E2D5] rounded-b-xl max-h-48 overflow-y-auto bg-white">
                        {searchLoading && users.length === 0 ? (
                          <div className="flex justify-center py-4">
                            <div className="w-5 h-5 border-2 border-[#E8E2D5] border-t-[#5C6744] rounded-full animate-spin" />
                          </div>
                        ) : filteredUsers.length === 0 ? (
                          <div className="px-4 py-3 text-sm text-[#636846] text-center">Не найдено</div>
                        ) : (
                          filteredUsers.map((u) => (
                            <button
                              key={u.id}
                              type="button"
                              onClick={() => {
                                setSelectedUser(u);
                                setSearchQuery("");
                              }}
                              className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-[#FAFAF5] transition-colors border-b border-[#F0EBE1] last:border-b-0"
                            >
                              <div className="w-8 h-8 bg-[#E8E2D5] rounded-full flex items-center justify-center text-[#4F5338] text-xs font-ManropeBold shrink-0">
                                {u.name.charAt(0).toUpperCase()}
                              </div>
                              <div className="min-w-0">
                                <p className="text-sm font-ManropeMedium text-[#4F5338] truncate">{u.name}</p>
                                <p className="text-xs text-[#636846] truncate">{u.email}</p>
                              </div>
                            </button>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* New user fields */}
              {mode === "new" && (
                <>
                  <div>
                    <label className="block text-[clamp(0.875rem,0.8077rem+0.2885vw,1.125rem)] font-ManropeMedium text-[#4F5338] mb-[clamp(0.5rem,0.4423rem+0.2564vw,0.75rem)]">
                      Email <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="doctor@clinic.ru"
                      required={mode === "new"}
                      className="w-full px-[clamp(1rem,0.8846rem+0.5128vw,1.5rem)] py-[clamp(0.75rem,0.6346rem+0.5128vw,1.25rem)] bg-[#F5F0E4] border-none rounded-xl text-[clamp(0.875rem,0.8077rem+0.2885vw,1.125rem)] font-ManropeRegular text-[#4F5338] placeholder:text-[#9A8F7D] focus:outline-none focus:ring-2 focus:ring-[#967450]"
                    />
                  </div>
                  <div>
                    <label className="block text-[clamp(0.875rem,0.8077rem+0.2885vw,1.125rem)] font-ManropeMedium text-[#4F5338] mb-[clamp(0.5rem,0.4423rem+0.2564vw,0.75rem)]">
                      Имя
                    </label>
                    <input
                      type="text"
                      value={userName}
                      onChange={(e) => setUserName(e.target.value)}
                      placeholder="Иван Иванов"
                      className="w-full px-[clamp(1rem,0.8846rem+0.5128vw,1.5rem)] py-[clamp(0.75rem,0.6346rem+0.5128vw,1.25rem)] bg-[#F5F0E4] border-none rounded-xl text-[clamp(0.875rem,0.8077rem+0.2885vw,1.125rem)] font-ManropeRegular text-[#4F5338] placeholder:text-[#9A8F7D] focus:outline-none focus:ring-2 focus:ring-[#967450]"
                    />
                  </div>
                </>
              )}

              {/* Специализация */}
              <div>
                <label className="block text-[clamp(0.875rem,0.8077rem+0.2885vw,1.125rem)] font-ManropeMedium text-[#4F5338] mb-[clamp(0.5rem,0.4423rem+0.2564vw,0.75rem)]">
                  Специализация
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Косметолог"
                  className="w-full px-[clamp(1rem,0.8846rem+0.5128vw,1.5rem)] py-[clamp(0.75rem,0.6346rem+0.5128vw,1.25rem)] bg-[#F5F0E4] border-none rounded-xl text-[clamp(0.875rem,0.8077rem+0.2885vw,1.125rem)] font-ManropeRegular text-[#4F5338] placeholder:text-[#9A8F7D] focus:outline-none focus:ring-2 focus:ring-[#967450]"
                />
              </div>

              {/* Buttons */}
              <div className="flex items-center gap-[clamp(0.75rem,0.6346rem+0.5128vw,1.25rem)] pt-[clamp(0.5rem,0.4423rem+0.2564vw,0.75rem)]">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-[clamp(0.75rem,0.6346rem+0.5128vw,1.25rem)] bg-[#5C6744] text-white rounded-xl text-[clamp(0.875rem,0.8077rem+0.2885vw,1.125rem)] font-ManropeMedium hover:bg-[#4F5938] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? "Создание..." : "Создать"}
                </button>
                <Dialog.Close asChild>
                  <button
                    type="button"
                    disabled={loading}
                    className="flex-1 py-[clamp(0.75rem,0.6346rem+0.5128vw,1.25rem)] bg-[#F5F0E4] text-[#967450] rounded-xl text-[clamp(0.875rem,0.8077rem+0.2885vw,1.125rem)] font-ManropeMedium hover:bg-[#E8E2D5] transition-colors"
                  >
                    Отмена
                  </button>
                </Dialog.Close>
              </div>
            </form>
            )}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
