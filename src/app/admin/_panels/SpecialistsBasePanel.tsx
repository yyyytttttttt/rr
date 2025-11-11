"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
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

  return (
    <div className="space-y-6 px-[2%]">
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
                    <span
                      className={`px-2 py-1 text-xs font-ManropeMedium rounded-full shrink-0 ${
                        specialist.status === "active"
                          ? "bg-green-100 text-green-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {specialist.status === "active" ? "Активен" : "Неактивен"}
                    </span>
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
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="bg-[#F5F0E4] rounded-lg px-3 py-2 h-16 flex flex-col justify-center">
                      <div className="text-xs text-[#636846] mb-1">Услуги</div>
                      <div className="text-sm font-ManropeMedium text-[#4F5338]">
                        {specialist.servicesCount}
                      </div>
                    </div>
                    <div className="bg-[#F5F0E4] rounded-lg px-3 py-2 h-16 flex flex-col justify-center">
                      <div className="text-xs text-[#636846] mb-1">Рейтинг</div>
                      <div className="text-sm font-ManropeMedium text-[#4F5338] flex items-center gap-1">
                        <span>⭐</span>
                        <span>{specialist.rating.toFixed(1)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Spacer */}
                  <div className="flex-1"></div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 pt-3 border-t border-[#E8E2D5]">
                    <button
                      onClick={() => setSelectedDoctor({ id: specialist.id, name: specialist.name })}
                      className="flex-1 px-3 py-2 text-xs font-ManropeMedium bg-[#5C6744] text-white rounded-lg hover:bg-[#4F5938] transition-colors"
                    >
                      🔗 Услуги
                    </button>
                    <button
                      onClick={() => router.push(`/admin/doctors/${specialist.id}/calendar`)}
                      className="flex-1 px-3 py-2 text-xs font-ManropeMedium bg-[#F5F0E4] text-[#967450] rounded-lg hover:bg-[#E8E2D5] transition-colors"
                    >
                      📅 График
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
    </div>
  );
}
