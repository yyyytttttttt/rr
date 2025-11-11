"use client";

export type Column<T> = {
  key: string;
  label: string;
  render: (item: T) => React.ReactNode;
  sortable?: boolean;
};

export type Action<T> = {
  label: string;
  icon?: string;
  onClick: (item: T) => void;
  variant?: "primary" | "secondary" | "danger";
};

type Props<T> = {
  columns: Column<T>[];
  data: T[];
  actions?: Action<T>[];
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
  loading?: boolean;
  emptyMessage?: string;
};

export default function PaginatedTable<T extends { id: string }>({
  columns,
  data,
  actions,
  page,
  pageSize,
  total,
  onPageChange,
  loading = false,
  emptyMessage = "Нет данных",
}: Props<T>) {
  const totalPages = Math.ceil(total / pageSize);
  const startItem = (page - 1) * pageSize + 1;
  const endItem = Math.min(page * pageSize, total);

  const getActionStyles = (variant?: string) => {
    switch (variant) {
      case "primary":
        return "bg-[#5C6744] text-white hover:bg-[#4F5938]";
      case "danger":
        return "bg-[#C74545]-bg text-[#C74545] hover:bg-[#C74545]-bg-hover";
      default:
        return "bg-[#F5F0E4] text-[#967450] hover:bg-[#E8E2D5]";
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-[#E8E2D5] overflow-hidden">
      {/* Desktop Table */}
      <div className="hidden lg:block overflow-x-auto">
        <table className="w-full min-w-max">
          <thead className="bg-[#FFFCF3] border-b border-[#E8E2D5]">
            <tr>
              {columns.map((column) => (
                <th key={column.key} className="px-3 py-3 text-left text-sm font-ManropeMedium text-[#636846] whitespace-nowrap">
                  {column.label}
                </th>
              ))}
              {actions && actions.length > 0 && (
                <th className="px-3 py-3 text-right text-sm font-ManropeMedium text-[#636846] whitespace-nowrap">Действия</th>
              )}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={columns.length + (actions ? 1 : 0)} className="px-3 py-8 text-center">
                  <div className="flex justify-center items-center gap-2 text-[#636846]">
                    <div className="w-5 h-5 border-2 border-[#E8E2D5] border-t-[#5C6744] rounded-full animate-spin" />
                    <span className="text-sm font-ManropeRegular">Загрузка...</span>
                  </div>
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={columns.length + (actions ? 1 : 0)} className="px-3 py-8 text-center text-sm font-ManropeRegular text-[#636846]">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              data.map((item) => (
                <tr key={item.id} className="hover:bg-[#FFFCF3] transition-colors border-b border-[#F5F0E4] last:border-0">
                  {columns.map((column) => (
                    <td key={column.key} className="px-3 py-3 text-sm font-ManropeRegular text-[#4F5338]">
                      {column.render(item)}
                    </td>
                  ))}
                  {actions && actions.length > 0 && (
                    <td className="px-3 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {actions.map((action, idx) => (
                          <button
                            key={idx}
                            onClick={() => action.onClick(item)}
                            className={`px-3 py-1.5 text-xs font-ManropeMedium rounded-lg transition-colors whitespace-nowrap ${getActionStyles(action.variant)}`}
                            title={action.label}
                          >
                            {action.label}
                          </button>
                        ))}
                      </div>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile/Tablet Cards View */}
      <div className="lg:hidden">
        {loading ? (
          <div className="px-4 py-8 text-center">
            <div className="flex justify-center items-center gap-2 text-[#636846]">
              <div className="w-5 h-5 border-2 border-[#E8E2D5] border-t-[#5C6744] rounded-full animate-spin" />
              <span className="text-sm font-ManropeRegular">Загрузка...</span>
            </div>
          </div>
        ) : data.length === 0 ? (
          <div className="px-4 py-8 text-center text-sm font-ManropeRegular text-[#636846]">
            {emptyMessage}
          </div>
        ) : (
          data.map((item, idx) => (
            <div key={item.id} className={`px-4 py-4 space-y-3 ${idx !== 0 ? 'border-t border-[#E8E2D5]' : ''}`}>
              {/* Render all columns as key-value pairs */}
              {columns.map((column) => (
                <div key={column.key} className="flex justify-between items-start gap-4">
                  <span className="text-xs font-ManropeMedium text-[#636846]">
                    {column.label}:
                  </span>
                  <div className="text-sm font-ManropeRegular text-[#4F5338] text-right flex-1 break-words">
                    {column.render(item)}
                  </div>
                </div>
              ))}

              {/* Actions */}
              {actions && actions.length > 0 && (
                <div className="flex items-center gap-2 pt-2 border-t border-[#E8E2D5]">
                  {actions.map((action, idx) => (
                    <button
                      key={idx}
                      onClick={() => action.onClick(item)}
                      className={`flex-1 px-3 py-2 text-xs font-ManropeMedium rounded-lg transition-colors ${getActionStyles(action.variant)}`}
                      title={action.label}
                    >
                      {action.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {total > 0 && (
        <div className="px-4 py-3 border-t border-[#E8E2D5] flex items-center justify-between flex-wrap gap-4">
          <div className="text-xs sm:text-sm font-ManropeRegular text-[#636846]">
            Показано <span className="font-ManropeMedium text-[#4F5338]">{startItem}</span> - <span className="font-ManropeMedium text-[#4F5338]">{endItem}</span> из{" "}
            <span className="font-ManropeMedium text-[#4F5338]">{total}</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onPageChange(page - 1)}
              disabled={page === 1}
              className="px-3 py-2 text-xs sm:text-sm font-ManropeMedium text-[#967450] bg-[#F5F0E4] border border-[#E8E2D5] rounded-lg hover:bg-[#E8E2D5] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              aria-label="Предыдущая страница"
            >
              ← Назад
            </button>

            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
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
                    onClick={() => onPageChange(pageNum)}
                    className={`w-8 h-8 text-xs sm:text-sm font-ManropeMedium rounded-lg transition-colors ${
                      page === pageNum
                        ? "bg-[#5C6744] text-white"
                        : "text-[#967450] bg-[#F5F0E4] border border-[#E8E2D5] hover:bg-[#E8E2D5]"
                    }`}
                    aria-label={`Страница ${pageNum}`}
                    aria-current={page === pageNum ? "page" : undefined}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => onPageChange(page + 1)}
              disabled={page === totalPages}
              className="px-3 py-2 text-xs sm:text-sm font-ManropeMedium text-[#967450] bg-[#F5F0E4] border border-[#E8E2D5] rounded-lg hover:bg-[#E8E2D5] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              aria-label="Следующая страница"
            >
              Вперёд →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
