"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import * as Dialog from "@radix-ui/react-dialog";
import toast from "react-hot-toast";
import SearchBar from "../_components/SearchBar";
import DoctorServicesModal from "../_modals/DoctorServicesModal";

type PanelProps = {
  userId: string;
  filters: Record<string, string | string[] | undefined>;
};

type Specialist = {
  id: string;
  name: string;
  email: string;
  phone: string;
  title: string;
  servicesCount: number;
  rating: number;
  status: "active" | "inactive";
};

export default function SpecialistsBasePanel({ userId, filters }: PanelProps) {
  const router = useRouter();
  const [specialists, setSpecialists] = useState<Specialist[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [total, setTotal] = useState(0);
  const [selectedDoctor, setSelectedDoctor] = useState<{ id: string; name: string } | null>(null);

  // Delete state
  const [deletingDoctor, setDeletingDoctor] = useState<{ id: string; name: string } | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    loadSpecialists();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery, page]);

  const loadSpecialists = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        query: searchQuery,
        page: page.toString(),
        pageSize: pageSize.toString(),
      });

      const res = await fetch(`/api/doctors?${params}`);
      if (!res.ok) throw new Error("Failed to fetch specialists");

      const data = await res.json();

      const specialists = (data.items || []).map((doc: any) => ({
        id: doc.id,
        name: doc.user?.name || doc.title || "Врач",
        email: doc.user?.email || "",
        phone: doc.user?.phone || "",
        title: doc.title || "",
        servicesCount: doc._count?.doctorServices || 0,
        rating: doc.rating || 5.0,
        status: "active" as const,
      }));

      setSpecialists(specialists);
      setTotal(data.total || 0);
    } catch (error) {
      console.error("Failed to load specialists:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (mode: "doctor" | "user") => {
    if (!deletingDoctor) return;
    setDeleteLoading(true);
    try {
      const res = await fetch(`/api/doctors/${deletingDoctor.id}?mode=${mode}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data?.error || "Ошибка удаления");
        return;
      }
      if (data.warning) {
        toast(data.warning, { icon: "⚠️" });
      }
      toast.success(
        mode === "doctor" ? "Роль врача снята" : "Пользователь удалён"
      );
      setDeletingDoctor(null);
      loadSpecialists();
    } catch {
      toast.error("Ошибка удаления");
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="space-y-6 px-4 py-4">
      <SearchBar placeholder="Поиск специалистов (имя/email/телефон/специализация)" onSearch={setSearchQuery} />

      {/* Cards Grid */}
      <div className="bg-white rounded-2xl border border-[#E8E2D5] overflow-hidden">
        {loading ? (
          <div className="px-4 py-8 text-center">
            <div className="flex justify-center items-center gap-2 text-[#636846]">
              <div className="w-5 h-5 border-2 border-[#E8E2D5] border-t-[#5C6744] rounded-full animate-spin" />
              <span className="text-sm font-ManropeRegular">Загрузка...</span>
            </div>
          </div>
        ) : specialists.length === 0 ? (
          <div className="px-4 py-8 text-center text-sm font-ManropeRegular text-[#636846]">
            Специалистов не найдено
          </div>
        ) : (
          <>
            <div className="grid gap-4 p-4 sm:grid-cols-2 xl:grid-cols-3 auto-rows-fr">
              {specialists.map((specialist) => (
                <article
                  key={specialist.id}
                  className="group relative bg-gradient-to-br from-white to-[#FFFCF3] rounded-2xl border border-[#E8E2D5] p-5 hover:shadow-lg hover:scale-[1.02] transition-all duration-300 hover:border-[#967450] flex flex-col"
                >
                  {/* Header */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-ManropeBold text-base text-[#4F5338] mb-1 truncate">
                        {specialist.name}
                      </h3>
                      <p className="text-xs text-[#636846] truncate">{specialist.title}</p>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => setDeletingDoctor({ id: specialist.id, name: specialist.name })}
                        className="p-1.5 text-[#9A8F7D] hover:text-[#C63D3D] hover:bg-red-50 rounded-lg transition-colors"
                        title="Удалить специалиста"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                        </svg>
                      </button>
                      <span
                        className={`px-2 py-1 text-xs font-ManropeMedium rounded-full ${
                          specialist.status === "active"
                            ? "bg-green-100 text-green-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {specialist.status === "active" ? "Активен" : "Неактивен"}
                      </span>
                    </div>
                  </div>

                  {/* Contact Info */}
                  <div className="space-y-2 mb-3 h-14">
                    <div className="flex items-start gap-2">
                      <span className="text-xs text-[#636846] shrink-0">Email:</span>
                      <span className="text-sm text-[#4F5338] break-all line-clamp-1">{specialist.email}</span>
                    </div>
                    {specialist.phone ? (
                      <div className="flex items-start gap-2">
                        <span className="text-xs text-[#636846] shrink-0">Телефон:</span>
                        <span className="text-sm text-[#4F5338]">{specialist.phone}</span>
                      </div>
                    ) : (
                      <div className="h-5"></div>
                    )}
                  </div>

                  {/* Meta Info */}
                  <div className="mb-4">
                    <div className="bg-[#F5F0E4] rounded-lg px-3 py-2.5 flex items-center gap-2">
                      <svg className="w-4 h-4 text-[#636846] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6z" />
                      </svg>
                      <span className="text-xs text-[#636846]">Услуг:</span>
                      <span className="text-sm font-ManropeMedium text-[#4F5338]">{specialist.servicesCount}</span>
                    </div>
                  </div>

                  {/* Spacer */}
                  <div className="flex-1"></div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 pt-3 border-t border-[#E8E2D5]">
                    <button
                      onClick={() => setSelectedDoctor({ id: specialist.id, name: specialist.name })}
                      className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 text-xs font-ManropeMedium bg-[#5C6744] text-white rounded-lg hover:bg-[#4F5938] transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6z" />
                      </svg>
                      Услуги
                    </button>
                    <button
                      onClick={() => router.push(`/admin/doctors/${specialist.id}/calendar`)}
                      className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 text-xs font-ManropeMedium bg-[#F5F0E4] text-[#967450] rounded-lg hover:bg-[#E8E2D5] transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                      </svg>
                      График
                    </button>
                  </div>
                </article>
              ))}
            </div>

            {/* Pagination */}
            {total > 0 && (
              <div className="px-4 py-3 border-t border-[#E8E2D5] flex items-center justify-between flex-wrap gap-4">
                <div className="text-xs sm:text-sm font-ManropeRegular text-[#636846]">
                  Показано <span className="font-ManropeMedium text-[#4F5338]">{(page - 1) * pageSize + 1}</span> -{" "}
                  <span className="font-ManropeMedium text-[#4F5338]">{Math.min(page * pageSize, total)}</span> из{" "}
                  <span className="font-ManropeMedium text-[#4F5338]">{total}</span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPage(page - 1)}
                    disabled={page === 1}
                    className="px-3 py-2 text-xs sm:text-sm font-ManropeMedium text-[#967450] bg-[#F5F0E4] border border-[#E8E2D5] rounded-lg hover:bg-[#E8E2D5] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    ← Назад
                  </button>

                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(5, Math.ceil(total / pageSize)) }, (_, i) => {
                      const totalPages = Math.ceil(total / pageSize);
                      let pageNum;
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
                    onClick={() => setPage(page + 1)}
                    disabled={page === Math.ceil(total / pageSize)}
                    className="px-3 py-2 text-xs sm:text-sm font-ManropeMedium text-[#967450] bg-[#F5F0E4] border border-[#E8E2D5] rounded-lg hover:bg-[#E8E2D5] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Вперёд →
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Модалка управления услугами */}
      {selectedDoctor && (
        <DoctorServicesModal
          open={!!selectedDoctor}
          onClose={() => {
            setSelectedDoctor(null);
            loadSpecialists(); // Обновляем список после изменений
          }}
          doctorId={selectedDoctor.id}
          doctorName={selectedDoctor.name}
        />
      )}

      {/* Модалка подтверждения удаления */}
      <Dialog.Root
        open={!!deletingDoctor}
        onOpenChange={(open) => {
          if (!open) setDeletingDoctor(null);
        }}
      >
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50" />
          <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-2xl shadow-2xl z-50 w-[calc(100%-2rem)] max-w-md p-6">
            <Dialog.Title className="text-lg font-ManropeBold text-[#4F5338] mb-1">
              Удалить специалиста?
            </Dialog.Title>
            <p className="text-sm text-[#636846] mb-5">
              {deletingDoctor?.name}
            </p>

            <div className="space-y-2.5">
              {/* Снять роль */}
              <button
                disabled={deleteLoading}
                onClick={() => handleDelete("doctor")}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-[#E8E2D5] bg-[#FAFAF5] hover:bg-[#F5F0E4] transition-colors text-left disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="w-9 h-9 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                  <svg className="w-5 h-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-ManropeMedium text-[#4F5338]">Снять роль</p>
                  <p className="text-xs text-[#636846]">Удалить врача, пользователь останется</p>
                </div>
              </button>

              {/* Удалить полностью */}
              <button
                disabled={deleteLoading}
                onClick={() => handleDelete("user")}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-red-200 bg-red-50 hover:bg-red-100 transition-colors text-left disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="w-9 h-9 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                  <svg className="w-5 h-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-ManropeMedium text-red-700">Удалить полностью</p>
                  <p className="text-xs text-red-500">Удалить пользователя и все данные</p>
                </div>
              </button>
            </div>

            {/* Отмена */}
            <Dialog.Close asChild>
              <button
                disabled={deleteLoading}
                className="w-full mt-4 py-2.5 text-sm font-ManropeMedium text-[#636846] bg-[#F5F0E4] rounded-xl hover:bg-[#E8E2D5] transition-colors"
              >
                Отмена
              </button>
            </Dialog.Close>

            {deleteLoading && (
              <div className="absolute inset-0 bg-white/60 rounded-2xl flex items-center justify-center">
                <div className="w-6 h-6 border-2 border-[#E8E2D5] border-t-[#5C6744] rounded-full animate-spin" />
              </div>
            )}
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
