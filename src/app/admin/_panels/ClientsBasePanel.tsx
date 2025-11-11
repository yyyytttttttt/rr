"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import SearchBar from "../_components/SearchBar";
import PaginatedTable, { type Column, type Action } from "../_components/PaginatedTable";
import EditClientModal from "../_modals/EditClientModal";

type PanelProps = {
  userId: string;
  filters: Record<string, string | string[] | undefined>;
};

type Client = {
  id: string;
  name: string;
  email: string;
  phone: string;
  visits: number;
  discount: number;
};

export default function ClientsBasePanel({ userId, filters }: PanelProps) {
  const router = useRouter();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [total, setTotal] = useState(0);
  const [editingClientId, setEditingClientId] = useState<string | null>(null);

  useEffect(() => {
    loadClients();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery, page]);

  const loadClients = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        query: searchQuery,
        page: page.toString(),
        pageSize: pageSize.toString(),
      });

      const res = await fetch(`/api/clients?${params}`);
      if (!res.ok) throw new Error("Failed to fetch clients");

      const data = await res.json();
      console.log("Clients data:", data);
      console.log("First client:", data.items?.[0]);
      setClients(data.items || []);
      setTotal(data.total || 0);
    } catch (error) {
      console.error("Failed to load clients:", error);
    } finally {
      setLoading(false);
    }
  };

  const columns: Column<Client>[] = [
    {
      key: "name",
      label: "Имя",
      render: (item) => <div className="font-ManropeMedium">{item.name}</div>,
    },
    {
      key: "email",
      label: "Почта",
      render: (item) => item.email,
    },
    {
      key: "phone",
      label: "Телефон",
      render: (item) => item.phone,
    },
    {
      key: "visits",
      label: "Визиты",
      render: (item) => <span className="font-ManropeMedium">{item.visits}</span>,
    },
    {
      key: "discount",
      label: "Скидка",
      render: (item) => (
        <span className={item.discount > 0 ? "text-[#967450] font-ManropeMedium" : "text-[#636846]"}>
          {item.discount}%
        </span>
      ),
    },
  ];

  const actions: Action<Client>[] = [
    {
      label: "Изменить",
      onClick: (item) => setEditingClientId(item.id),
      variant: "secondary",
    },
  ];

  return (
    <div className="min-h-screen bg-[#FFFCF3] px-[clamp(1rem,0.5385rem+2.0513vw,3rem)] py-[clamp(2rem,1.7692rem+1.0256vw,3rem)]">
      {/* Поисковая строка */}
      <div className="mb-[clamp(1.5rem,1.2692rem+1.0256vw,2.5rem)]">
        <SearchBar placeholder="Поиск (имя/телефон/почта)" onSearch={setSearchQuery} />
      </div>

      {/* Таблица */}
      <PaginatedTable
        columns={columns}
        data={clients}
        actions={actions}
        page={page}
        pageSize={pageSize}
        total={total}
        onPageChange={setPage}
        loading={loading}
        emptyMessage="Клиентов не найдено"
      />

      {editingClientId && (
        <EditClientModal
          open={!!editingClientId}
          onClose={() => setEditingClientId(null)}
          clientId={editingClientId}
          onSuccess={() => {
            loadClients();
            setEditingClientId(null);
          }}
        />
      )}
    </div>
  );
}
