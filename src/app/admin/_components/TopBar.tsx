"use client";

type View =
  | "specialists.schedule"
  | "specialists.manage"
  | "specialists.base"
  | "clients.base"
  | "clients.bookings"
  | "services.manage"
  | "services.categories"
  | "settings";

type Props = {
  title: string;
  view: View;
  userName: string;
  onAction?: () => void;
};

const VIEW_ACTIONS: Partial<Record<View, { label: string; icon: string }>> = {
  "specialists.manage": { label: "Добавить запись", icon: "+" },
  "specialists.base": { label: "Добавить специалиста", icon: "+" },
  "clients.base": { label: "Добавить клиента", icon: "+" },
  "clients.bookings": { label: "Добавить запись", icon: "+" },
  "services.manage": { label: "Создать услугу", icon: "+" },
  "services.categories": { label: "Создать категорию", icon: "+" },
};

export default function TopBar({ title, view, userName, onAction }: Props) {
  const action = VIEW_ACTIONS[view];

  return (
    <header className="sticky top-0 z-30 bg-white shadow-sm">
      <div className="flex items-center justify-between px-[2%] py-3 max-w-full">
        {/* Title */}
        <h1 className="text-lg md:text-xl font-ManropeBold text-[#4F5338] truncate">
          {title}
        </h1>

        {/* Actions */}
        <div className="flex items-center gap-3 shrink-0">
          {action && (
            <button
              onClick={onAction}
              className="flex items-center gap-2 px-3 py-2 bg-[#5C6744] text-white rounded-lg hover:bg-[#4F5938] transition-all hover:scale-105 text-sm font-ManropeMedium shadow-sm"
              aria-label={action.label}
            >
              <span className="text-base leading-none">{action.icon}</span>
              <span className="hidden md:inline">{action.label}</span>
            </button>
          )}

          {/* User info - desktop only */}
          <div className="hidden lg:flex items-center gap-2 px-3 py-2 bg-gradient-to-br from-[#F5F0E4] to-[#E8E2D5] rounded-xl">
            <div className="w-8 h-8 bg-[#5C6744] rounded-full flex items-center justify-center text-white text-sm font-ManropeBold">
              {userName.charAt(0).toUpperCase()}
            </div>
            <span className="text-sm text-[#4F5338] font-ManropeMedium">{userName}</span>
          </div>
        </div>
      </div>
    </header>
  );
}
