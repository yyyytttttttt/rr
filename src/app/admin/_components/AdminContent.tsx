"use client";

import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useState } from "react";
import AdminHeader from "./AdminHeader";
import AddBookingModal from "../_modals/AddBookingModal";
import AddDoctorModal from "../_modals/AddDoctorModal";

type View =
  | "specialists.schedule"
  | "specialists.manage"
  | "specialists.base"
  | "clients.base"
  | "clients.bookings"
  | "services.manage"
  | "services.categories"
  | "settings";

type PanelProps = {
  userId: string;
  filters: Record<string, string | string[] | undefined>;
};

type Props = {
  view: View;
  panelProps: PanelProps;
  userName: string;
  userEmail: string;
  userImage?: string;
};

// NOTE: Lazy load panels
const SpecialistsSchedulePanel = dynamic(() => import("../_panels/SpecialistsSchedulePanel"), {
  loading: () => <PanelSkeleton />,
});
const SpecialistsManagePanel = dynamic(() => import("../_panels/SpecialistsManagePanel"), {
  loading: () => <PanelSkeleton />,
});
const SpecialistsBasePanel = dynamic(() => import("../_panels/SpecialistsBasePanel"), {
  loading: () => <PanelSkeleton />,
});
const ClientsBasePanel = dynamic(() => import("../_panels/ClientsBasePanel"), {
  loading: () => <PanelSkeleton />,
});
const ClientsBookingsPanel = dynamic(() => import("../_panels/ClientsBookingsPanel"), {
  loading: () => <PanelSkeleton />,
});
const SettingsPanel = dynamic(() => import("../_panels/SettingsPanel"), {
  loading: () => <PanelSkeleton />,
});
const ServicesPanel = dynamic(() => import("../_panels/ServicesPanel"), {
  loading: () => <PanelSkeleton />,
});
const CategoriesPanel = dynamic(() => import("../_panels/CategoriesPanel"), {
  loading: () => <PanelSkeleton />,
});

function PanelSkeleton() {
  return (
    <div className="animate-pulse space-y-4 p-8">
      <div className="h-8 bg-gray-200 rounded w-1/3"></div>
      <div className="h-64 bg-gray-200 rounded"></div>
    </div>
  );
}

const VIEW_TITLES: Record<View, string> = {
  "specialists.schedule": "Смотреть занятость",
  "specialists.manage": "Управление записями",
  "specialists.base": "База специалистов",
  "clients.base": "База клиентов",
  "clients.bookings": "Записи клиентов",
  "services.manage": "Управление услугами",
  "services.categories": "Категории услуг",
  settings: "Настройки",
};

export default function AdminContent({ view, panelProps, userName, userEmail, userImage }: Props) {
  const router = useRouter();
  const [showAddBookingModal, setShowAddBookingModal] = useState(false);
  const [showAddDoctorModal, setShowAddDoctorModal] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleAction = () => {
    if (view === "specialists.base") {
      setShowAddDoctorModal(true);
    } else if (view === "specialists.manage" || view === "clients.bookings") {
      setShowAddBookingModal(true);
    } else if (view === "clients.base") {
      // TODO: Open add client modal
      alert("Функция добавления клиента в разработке");
    } else if (view === "services.manage") {
      // Dispatch event to ServicesPanel
      window.dispatchEvent(new Event('admin:createService'));
    } else if (view === "services.categories") {
      // Dispatch event to CategoriesPanel
      window.dispatchEvent(new Event('admin:createCategory'));
    }
  };

  return (
    <main className="flex-1 pb-20 md:pb-24 lg:pb-8 overflow-x-hidden">
      <AdminHeader title={VIEW_TITLES[view]} view={view} userName={userName} userImage={userImage} onAction={handleAction} />

      <div className="admin-container py-4 sm:py-6 md:py-8 max-w-[100vw] mb-8 md:mb-12 lg:mb-16">
        {view === "specialists.schedule" && <SpecialistsSchedulePanel key={refreshKey} {...panelProps} />}
        {view === "specialists.manage" && <SpecialistsManagePanel key={refreshKey} {...panelProps} />}
        {view === "specialists.base" && <SpecialistsBasePanel key={refreshKey} {...panelProps} />}
        {view === "clients.base" && <ClientsBasePanel {...panelProps} />}
        {view === "clients.bookings" && <ClientsBookingsPanel key={refreshKey} {...panelProps} />}
        {view === "services.manage" && <ServicesPanel {...panelProps} />}
        {view === "services.categories" && <CategoriesPanel {...panelProps} />}
        {view === "settings" && <SettingsPanel {...panelProps} userName={userName} userEmail={userEmail} userImage={userImage || ""} />}
      </div>

      <AddBookingModal
        open={showAddBookingModal}
        onClose={() => setShowAddBookingModal(false)}
        onSuccess={() => {
          setShowAddBookingModal(false);
          // Reload current panel data by incrementing refresh key
          setRefreshKey(prev => prev + 1);
        }}
      />

      <AddDoctorModal
        open={showAddDoctorModal}
        onClose={() => setShowAddDoctorModal(false)}
        onSuccess={() => {
          setShowAddDoctorModal(false);
          // Reload specialists panel
          setRefreshKey(prev => prev + 1);
        }}
      />
    </main>
  );
}
