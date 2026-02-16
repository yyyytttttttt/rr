"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import DoctorHeader from "./DoctorHeader";

type View = "home" | "calendar" | "services" | "schedule" | "blocks" | "settings";

type PanelProps = {
  doctorId: string;
  tzid: string;
  doctorName: string;
  doctorEmail: string;
  doctorImage: string;
  doctorTitle?: string | null;
  bufferMin?: number;
  slotDurationMin?: number;
  minLeadMin?: number;
};

type Doctor = {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
  title?: string | null;
};

type Props = {
  view: View;
  panelProps: PanelProps;
  doctor: Doctor;
};

// NOTE: Lazy load panels for better performance
const HomePanel = dynamic(() => import("../_panels/HomePanel"), {
  loading: () => <PanelSkeleton />,
});
const CalendarPanel = dynamic(() => import("../_panels/CalendarPanel"), {
  loading: () => <PanelSkeleton />,
});
const ServicesPanel = dynamic(() => import("../_panels/ServicesPanel"), {
  loading: () => <PanelSkeleton />,
});
const SchedulePanel = dynamic(() => import("../_panels/SchedulePanel"), {
  loading: () => <PanelSkeleton />,
});
const BlocksPanel = dynamic(() => import("../_panels/BlocksPanel"), {
  loading: () => <PanelSkeleton />,
});
const SettingsPanel = dynamic(() => import("../_panels/SettingsPanel"), {
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
  home: "Главная",
  calendar: "Календарь",
  services: "Мои услуги",
  schedule: "Расписание работы",
  blocks: "Блокировки времени",
  settings: "Настройки",
};

export default function DoctorContent({ view, panelProps, doctor }: Props) {
  const [refreshKey, setRefreshKey] = useState(0);

  const handleAction = () => {
    if (view === "services") {
      // Dispatch event to ServicesPanel
      window.dispatchEvent(new Event('doctor:createService'));
    } else if (view === "schedule") {
      // Dispatch event to SchedulePanel
      window.dispatchEvent(new Event('doctor:createSchedule'));
    } else if (view === "blocks") {
      // Dispatch event to BlocksPanel
      window.dispatchEvent(new Event('doctor:createBlock'));
    }
  };

  return (
    <main className="flex-1 pb-20 md:pb-24 lg:pb-8 overflow-x-hidden">
      <DoctorHeader
        title={VIEW_TITLES[view]}
        view={view}
        userName={doctor.name || ""}
        userImage={doctor.image || ""}
        onAction={handleAction}
      />

      <div className="max-w-[100vw]">
        {view === "home" && <HomePanel key={refreshKey} {...panelProps} />}
        {view === "calendar" && <CalendarPanel key={refreshKey} {...panelProps} />}
        {view === "services" && <ServicesPanel key={refreshKey} {...panelProps} />}
        {view === "schedule" && <SchedulePanel key={refreshKey} {...panelProps} />}
        {view === "blocks" && <BlocksPanel key={refreshKey} {...panelProps} />}
        {view === "settings" && <SettingsPanel {...panelProps} />}
      </div>
    </main>
  );
}
