"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import toast from "react-hot-toast";
import * as Dialog from "@radix-ui/react-dialog";

type Category = {
  id: string;
  name: string;
  description: string | null;
  icon: string | null;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  _count?: { services: number };
};

type Props = {
  userId: string;
  filters: Record<string, string | string[] | undefined>;
};

const categorySchema = z.object({
  name: z.string().min(1, "Введите название"),
  description: z.string().optional(),
  icon: z.string().optional(),
  sortOrder: z.number().int().min(0, "Порядок должен быть >= 0"),
  isActive: z.boolean(),
});

type CategoryFormData = z.infer<typeof categorySchema>;

// Доступные иконки для выбора (косметология)
const AVAILABLE_ICONS = [
  // Уход за лицом и телом
  "💆", "💆‍♀️", "💆‍♂️", "🧖", "🧖‍♀️", "🧖‍♂️", "💇", "💇‍♀️", "💇‍♂️", "🧴",
  // Маникюр, педикюр, красота
  "💅", "💄", "💋", "👄", "💃", "🦶", "👐", "🤲", "✋", "🖐️",
  // Косметика и инструменты
  "🧼", "🧽", "🪒", "✂️", "💈", "🪞", "🔬", "💉", "🩹", "🧪",
  // Цветы и природа (релакс, SPA)
  "🌸", "🌺", "🌼", "🌻", "🌷", "🌹", "💐", "🌿", "🍃", "🌱",
  // Эффекты и акценты
  "✨", "💫", "⭐", "🌟", "💎", "👑", "🎀", "🦋", "🌈", "💝",
  // Wellness и здоровье
  "🧘", "🧘‍♀️", "🧘‍♂️", "💧", "🫧", "🕯️", "🛁", "🚿", "🌊", "☀️",
];

export default function CategoriesPanel({ userId, filters }: Props) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [search, setSearch] = useState("");
  const [selectedIcon, setSelectedIcon] = useState<string>("");

  const form = useForm<CategoryFormData>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: "",
      description: "",
      icon: "",
      sortOrder: 0,
      isActive: true,
    },
  });

  useEffect(() => {
    loadData();

    // Listen for create category event from TopBar
    const handleCreateEvent = () => {
      handleCreate();
    };

    window.addEventListener('admin:createCategory', handleCreateEvent);
    return () => window.removeEventListener('admin:createCategory', handleCreateEvent);
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/services/categories");
      if (res.ok) {
        const data = await res.json();
        setCategories(data.categories || []);
      } else {
        toast.error("Не удалось загрузить категории");
      }
    } catch (error) {
      console.error("Failed to load categories:", error);
      toast.error("Ошибка загрузки");
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingCategory(null);
    setSelectedIcon("");
    form.reset({
      name: "",
      description: "",
      icon: "",
      sortOrder: categories.length,
      isActive: true,
    });
    setShowModal(true);
  };

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setSelectedIcon(category.icon || "");
    form.reset({
      name: category.name,
      description: category.description || "",
      icon: category.icon || "",
      sortOrder: category.sortOrder,
      isActive: category.isActive,
    });
    setShowModal(true);
  };

  const onSubmit = async (data: CategoryFormData) => {
    try {
      const payload = {
        name: data.name,
        description: data.description || null,
        icon: data.icon || null,
        sortOrder: data.sortOrder,
        isActive: data.isActive,
      };

      if (editingCategory) {
        const res = await fetch(`/api/admin/services/categories/${editingCategory.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (res.ok) {
          toast.success("Категория обновлена");
          setShowModal(false);
          loadData();
        } else {
          const err = await res.json();
          toast.error(err.error || "Не удалось обновить категорию");
        }
      } else {
        const res = await fetch("/api/admin/services/categories", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (res.ok) {
          toast.success("Категория создана");
          setShowModal(false);
          loadData();
        } else {
          const err = await res.json();
          toast.error(err.error || "Не удалось создать категорию");
        }
      }
    } catch (error) {
      console.error("Failed to save category:", error);
      toast.error("Ошибка сохранения");
    }
  };

  const handleDelete = async (categoryId: string) => {
    const category = categories.find((c) => c.id === categoryId);
    if (!category) return;

    const servicesCount = category._count?.services || 0;
    const confirmMessage =
      servicesCount > 0
        ? `У категории "${category.name}" есть ${servicesCount} услуг(и). При удалении они будут отвязаны от категории. Продолжить?`
        : `Вы уверены, что хотите удалить категорию "${category.name}"?`;

    if (!confirm(confirmMessage)) return;

    try {
      const res = await fetch(`/api/admin/services/categories/${categoryId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        toast.success("Категория удалена");
        loadData();
      } else {
        const err = await res.json();
        toast.error(err.message || err.error || "Не удалось удалить категорию");
      }
    } catch (error) {
      console.error("Failed to delete category:", error);
      toast.error("Ошибка удаления");
    }
  };

  const filteredCategories = categories.filter((c) => {
    if (search) {
      const lower = search.toLowerCase();
      if (!c.name.toLowerCase().includes(lower) && !c.description?.toLowerCase().includes(lower)) {
        return false;
      }
    }
    return true;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-[#636846] font-ManropeRegular">Загрузка...</p>
      </div>
    );
  }

  return (
    <div className="space-y-[1.5rem] px-[2%] max-w-full overflow-x-hidden">
      {/* Search */}
      <div className="bg-white rounded-2xl border border-[#E8E2D5] p-[clamp(1rem,0.8846rem+0.5128vw,1.5rem)]">
        <input
          type="text"
          placeholder="Поиск по названию или описанию..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full px-[1rem] py-[clamp(0.875rem,0.7596rem+0.5128vw,1.25rem)] bg-[#F5F0E4] border-none rounded-xl text-base font-ManropeRegular text-[#4F5338] placeholder:text-[#636846] focus:outline-none focus:ring-2 focus:ring-[#967450]"
        />
      </div>

      {/* Categories table - desktop */}
      <div className="bg-white rounded-2xl border border-[#E8E2D5] overflow-hidden">
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[#FFFCF3] border-b border-[#E8E2D5]">
              <tr>
                <th className="px-[clamp(1rem,0.8846rem+0.5128vw,1.5rem)] py-[clamp(0.875rem,0.7596rem+0.5128vw,1.25rem)] text-left text-sm font-ManropeMedium text-[#636846]">
                  Иконка
                </th>
                <th className="px-[clamp(1rem,0.8846rem+0.5128vw,1.5rem)] py-[clamp(0.875rem,0.7596rem+0.5128vw,1.25rem)] text-left text-sm font-ManropeMedium text-[#636846]">
                  Название
                </th>
                <th className="px-[clamp(1rem,0.8846rem+0.5128vw,1.5rem)] py-[clamp(0.875rem,0.7596rem+0.5128vw,1.25rem)] text-left text-sm font-ManropeMedium text-[#636846]">
                  Описание
                </th>
                <th className="px-[clamp(1rem,0.8846rem+0.5128vw,1.5rem)] py-[clamp(0.875rem,0.7596rem+0.5128vw,1.25rem)] text-left text-sm font-ManropeMedium text-[#636846]">
                  Порядок
                </th>
                <th className="px-[clamp(1rem,0.8846rem+0.5128vw,1.5rem)] py-[clamp(0.875rem,0.7596rem+0.5128vw,1.25rem)] text-left text-sm font-ManropeMedium text-[#636846]">
                  Услуг
                </th>
                <th className="px-[clamp(1rem,0.8846rem+0.5128vw,1.5rem)] py-[clamp(0.875rem,0.7596rem+0.5128vw,1.25rem)] text-left text-sm font-ManropeMedium text-[#636846]">
                  Статус
                </th>
                <th className="px-[clamp(1rem,0.8846rem+0.5128vw,1.5rem)] py-[clamp(0.875rem,0.7596rem+0.5128vw,1.25rem)] text-right text-sm font-ManropeMedium text-[#636846]">
                  Действия
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--admin-border)]">
              {filteredCategories.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-[clamp(1rem,0.8846rem+0.5128vw,1.5rem)] py-[2rem] text-center text-base font-ManropeRegular text-[#636846]">
                    Категории не найдены
                  </td>
                </tr>
              )}
              {filteredCategories.map((category) => (
                <tr key={category.id} className="hover:bg-[#FFFCF3] transition-colors">
                  <td className="px-[clamp(1rem,0.8846rem+0.5128vw,1.5rem)] py-[clamp(0.875rem,0.7596rem+0.5128vw,1.25rem)] text-xl">
                    {category.icon || "📁"}
                  </td>
                  <td className="px-[clamp(1rem,0.8846rem+0.5128vw,1.5rem)] py-[clamp(0.875rem,0.7596rem+0.5128vw,1.25rem)]">
                    <div className="font-ManropeMedium text-base text-[#4F5338] admin-text-truncate">{category.name}</div>
                  </td>
                  <td className="px-[clamp(1rem,0.8846rem+0.5128vw,1.5rem)] py-[clamp(0.875rem,0.7596rem+0.5128vw,1.25rem)] text-base font-ManropeRegular text-[#4F5338] max-w-xs admin-text-truncate">
                    {category.description || "—"}
                  </td>
                  <td className="px-[clamp(1rem,0.8846rem+0.5128vw,1.5rem)] py-[clamp(0.875rem,0.7596rem+0.5128vw,1.25rem)] text-base font-ManropeRegular text-[#4F5338]">
                    {category.sortOrder}
                  </td>
                  <td className="px-[clamp(1rem,0.8846rem+0.5128vw,1.5rem)] py-[clamp(0.875rem,0.7596rem+0.5128vw,1.25rem)]">
                    <span className="px-[0.75rem] py-[0.25rem] rounded-full text-sm font-ManropeMedium bg-[var(--admin-status-confirmed-bg)] text-[var(--admin-status-confirmed-text)] whitespace-nowrap">
                      {category._count?.services || 0}
                    </span>
                  </td>
                  <td className="px-[clamp(1rem,0.8846rem+0.5128vw,1.5rem)] py-[clamp(0.875rem,0.7596rem+0.5128vw,1.25rem)]">
                    <span
                      className={`px-[0.5rem] py-[0.25rem] text-sm font-ManropeMedium rounded-full whitespace-nowrap ${
                        category.isActive
                          ? "bg-[var(--admin-status-confirmed-bg)] text-[var(--admin-status-confirmed-text)]"
                          : "bg-[#F5F0E4] text-[#967450]"
                      }`}
                    >
                      {category.isActive ? "Активна" : "Неактивна"}
                    </span>
                  </td>
                  <td className="px-[clamp(1rem,0.8846rem+0.5128vw,1.5rem)] py-[clamp(0.875rem,0.7596rem+0.5128vw,1.25rem)] text-right">
                    <div className="flex items-center justify-end gap-[0.5rem]">
                      <button
                        onClick={() => handleEdit(category)}
                        className="px-[0.75rem] py-[0.5rem] text-sm font-ManropeRegular text-[#967450] bg-[#F5F0E4] rounded-lg hover:bg-[#E8E2D5] transition-colors"
                      >
                        Изменить
                      </button>
                      <button
                        onClick={() => handleDelete(category.id)}
                        className="px-[0.75rem] py-[0.5rem] text-sm font-ManropeRegular text-[#C74545] bg-[#C74545]-bg rounded-lg hover:bg-[#C74545]-bg-hover transition-colors"
                      >
                        Удалить
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards View */}
        <div className="md:hidden divide-y divide-[var(--admin-border)]">
          {filteredCategories.length === 0 ? (
            <div className="px-[clamp(1rem,0.8846rem+0.5128vw,1.5rem)] py-[2rem] text-center text-base font-ManropeRegular text-[#636846]">
              Категории не найдены
            </div>
          ) : (
            filteredCategories.map((category) => (
              <div key={category.id} className="px-[clamp(1rem,0.8846rem+0.5128vw,1.5rem)] py-[clamp(1rem,0.8846rem+0.5128vw,1.5rem)] space-y-[0.75rem]">
                {/* Icon + Name */}
                <div className="flex items-center gap-3">
                  <span className="text-xl flex-shrink-0">{category.icon || "📁"}</span>
                  <span className="font-ManropeMedium text-base text-[#4F5338] flex-1 admin-break-words">{category.name}</span>
                </div>

                {/* Description */}
                {category.description && (
                  <div className="flex justify-between items-start gap-4">
                    <span className="text-sm font-ManropeMedium text-[#636846]">Описание:</span>
                    <div className="text-base font-ManropeRegular text-[#4F5338] text-right flex-1 admin-break-words">
                      {category.description}
                    </div>
                  </div>
                )}

                {/* Order */}
                <div className="flex justify-between items-start gap-4">
                  <span className="text-sm font-ManropeMedium text-[#636846]">Порядок:</span>
                  <span className="text-base font-ManropeRegular text-[#4F5338]">{category.sortOrder}</span>
                </div>

                {/* Services Count */}
                <div className="flex justify-between items-center gap-4">
                  <span className="text-sm font-ManropeMedium text-[#636846]">Услуг:</span>
                  <span className="px-[0.75rem] py-[0.25rem] rounded-full text-sm font-ManropeMedium bg-[var(--admin-status-confirmed-bg)] text-[var(--admin-status-confirmed-text)]">
                    {category._count?.services || 0}
                  </span>
                </div>

                {/* Status */}
                <div className="flex justify-between items-center gap-4">
                  <span className="text-sm font-ManropeMedium text-[#636846]">Статус:</span>
                  <span
                    className={`px-[0.5rem] py-[0.25rem] text-sm font-ManropeMedium rounded-full ${
                      category.isActive
                        ? "bg-[var(--admin-status-confirmed-bg)] text-[var(--admin-status-confirmed-text)]"
                        : "bg-[#F5F0E4] text-[#967450]"
                    }`}
                  >
                    {category.isActive ? "Активна" : "Неактивна"}
                  </span>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-[0.5rem] pt-[0.5rem] border-t border-[#E8E2D5]">
                  <button
                    onClick={() => handleEdit(category)}
                    className="flex-1 px-[0.75rem] py-[0.5rem] text-sm font-ManropeRegular text-[#967450] bg-[#F5F0E4] rounded-lg hover:bg-[#E8E2D5] transition-colors"
                  >
                    Изменить
                  </button>
                  <button
                    onClick={() => handleDelete(category.id)}
                    className="flex-1 px-[0.75rem] py-[0.5rem] text-sm font-ManropeRegular text-[#C74545] bg-[#C74545]-bg rounded-lg hover:bg-[#C74545]-bg-hover transition-colors"
                  >
                    Удалить
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Modal */}
      <Dialog.Root open={showModal} onOpenChange={(isOpen) => !isOpen && setShowModal(false)}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50" />
          <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-[clamp(1rem,0.8846rem+0.5128vw,1.5rem)] shadow-2xl z-50 w-[calc(100%-2rem)] max-w-[clamp(36rem,32rem+16vw,52rem)] max-h-[90vh] overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between gap-4 px-[clamp(1.5rem,1.2692rem+1.0256vw,2.5rem)] py-[clamp(1.25rem,1.0192rem+1.0256vw,2.25rem)] border-b border-[#E8E2D5]">
              <Dialog.Title className="flex-1 min-w-0 text-[clamp(1.25rem,1.1346rem+0.5128vw,1.75rem)] font-ManropeBold text-[#4F5338] truncate">
                {editingCategory ? "Редактировать категорию" : "Создать категорию"}
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
            <div className="overflow-y-auto max-h-[calc(90vh-12rem)] px-[clamp(1.5rem,1.2692rem+1.0256vw,2.5rem)] py-[clamp(1.5rem,1.2692rem+1.0256vw,2.5rem)]">
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-[clamp(1.25rem,1.0192rem+1.0256vw,2.25rem)]">
                {/* Название */}
                <div>
                  <label className="block text-[clamp(0.875rem,0.8077rem+0.2885vw,1.125rem)] font-ManropeMedium text-[#4F5338] mb-[clamp(0.5rem,0.4423rem+0.2564vw,0.75rem)]">
                    Название <span className="text-[#C74545]">*</span>
                  </label>
                  <input
                    type="text"
                    {...form.register("name")}
                    className={`w-full px-[clamp(1rem,0.8846rem+0.5128vw,1.5rem)] py-[clamp(0.75rem,0.6346rem+0.5128vw,1.25rem)] bg-[#F5F0E4] border-none rounded-[clamp(0.5rem,0.4423rem+0.2564vw,0.75rem)] text-[clamp(0.875rem,0.8077rem+0.2885vw,1.125rem)] font-ManropeRegular text-[#4F5338] placeholder:text-[#636846] focus:outline-none focus:ring-2 ${
                      form.formState.errors.name ? "ring-2 ring-[#C74545]" : "focus:ring-[#967450]"
                    }`}
                  />
                  {form.formState.errors.name && (
                    <p className="mt-1 text-[clamp(0.75rem,0.6923rem+0.2564vw,1rem)] font-ManropeRegular text-[#C74545]">
                      {form.formState.errors.name.message}
                    </p>
                  )}
                </div>

                {/* Описание */}
                <div>
                  <label className="block text-[clamp(0.875rem,0.8077rem+0.2885vw,1.125rem)] font-ManropeMedium text-[#4F5338] mb-[clamp(0.5rem,0.4423rem+0.2564vw,0.75rem)]">
                    Описание
                  </label>
                  <textarea
                    {...form.register("description")}
                    rows={3}
                    className="w-full px-[clamp(1rem,0.8846rem+0.5128vw,1.5rem)] py-[clamp(0.75rem,0.6346rem+0.5128vw,1.25rem)] bg-[#F5F0E4] border-none rounded-[clamp(0.5rem,0.4423rem+0.2564vw,0.75rem)] text-[clamp(0.875rem,0.8077rem+0.2885vw,1.125rem)] font-ManropeRegular text-[#4F5338] placeholder:text-[#636846] focus:outline-none focus:ring-2 focus:ring-[#967450] resize-none"
                  />
                </div>

                {/* Иконка */}
                <div>
                  <label className="block text-[clamp(0.875rem,0.8077rem+0.2885vw,1.125rem)] font-ManropeMedium text-[#4F5338] mb-[clamp(0.5rem,0.4423rem+0.2564vw,0.75rem)]">
                    Иконка (необязательно)
                  </label>

                  {/* Сетка иконок */}
                  <div className="grid grid-cols-8 sm:grid-cols-10 gap-2 mb-3 max-h-[200px] overflow-y-auto p-3 bg-[#F5F0E4] rounded-[clamp(0.5rem,0.4423rem+0.2564vw,0.75rem)]">
                    {AVAILABLE_ICONS.map((icon) => (
                      <button
                        key={icon}
                        type="button"
                        onClick={() => {
                          setSelectedIcon(icon);
                          form.setValue("icon", icon);
                        }}
                        className={`aspect-square flex items-center justify-center text-2xl rounded-lg transition-all ${
                          selectedIcon === icon
                            ? "bg-[#5C6744] scale-110 shadow-md"
                            : "bg-white hover:bg-[#E8E2D5] hover:scale-105"
                        }`}
                      >
                        {icon}
                      </button>
                    ))}
                  </div>

                  {/* Выбранная иконка */}
                  {selectedIcon && (
                    <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-[#E8E2D5]">
                      <span className="text-3xl">{selectedIcon}</span>
                      <span className="text-sm font-ManropeMedium text-[#4F5338]">Выбранная иконка</span>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedIcon("");
                          form.setValue("icon", "");
                        }}
                        className="ml-auto text-sm font-ManropeRegular text-[#967450] hover:text-[#C74545] transition-colors"
                      >
                        Очистить
                      </button>
                    </div>
                  )}
                </div>

                {/* Порядок сортировки */}
                <div>
                  <label className="block text-[clamp(0.875rem,0.8077rem+0.2885vw,1.125rem)] font-ManropeMedium text-[#4F5338] mb-[clamp(0.5rem,0.4423rem+0.2564vw,0.75rem)]">
                    Порядок сортировки <span className="text-[#C74545]">*</span>
                  </label>
                  <input
                    type="number"
                    {...form.register("sortOrder", { valueAsNumber: true })}
                    className={`w-full px-[clamp(1rem,0.8846rem+0.5128vw,1.5rem)] py-[clamp(0.75rem,0.6346rem+0.5128vw,1.25rem)] bg-[#F5F0E4] border-none rounded-[clamp(0.5rem,0.4423rem+0.2564vw,0.75rem)] text-[clamp(0.875rem,0.8077rem+0.2885vw,1.125rem)] font-ManropeRegular text-[#4F5338] placeholder:text-[#636846] focus:outline-none focus:ring-2 ${
                      form.formState.errors.sortOrder ? "ring-2 ring-[#C74545]" : "focus:ring-[#967450]"
                    }`}
                  />
                  {form.formState.errors.sortOrder && (
                    <p className="mt-1 text-[clamp(0.75rem,0.6923rem+0.2564vw,1rem)] font-ManropeRegular text-[#C74545]">
                      {form.formState.errors.sortOrder.message}
                    </p>
                  )}
                </div>

                {/* Активна */}
                <div className="flex items-center gap-[clamp(0.5rem,0.4423rem+0.2564vw,0.75rem)]">
                  <input
                    type="checkbox"
                    {...form.register("isActive")}
                    className="w-[clamp(1rem,0.8846rem+0.5128vw,1.5rem)] h-[clamp(1rem,0.8846rem+0.5128vw,1.5rem)] accent-[var(--admin-primary)]"
                  />
                  <label className="text-[clamp(0.875rem,0.8077rem+0.2885vw,1.125rem)] font-ManropeMedium text-[#4F5338]">
                    Активна
                  </label>
                </div>

                {/* Buttons */}
                <div className="flex items-center gap-[clamp(0.75rem,0.6346rem+0.5128vw,1.25rem)] pt-[clamp(1rem,0.8846rem+0.5128vw,1.5rem)]">
                  <button
                    type="submit"
                    className="flex-1 py-[clamp(0.75rem,0.6346rem+0.5128vw,1.25rem)] bg-[#5C6744] text-white rounded-[clamp(0.5rem,0.4423rem+0.2564vw,0.75rem)] text-[clamp(0.875rem,0.8077rem+0.2885vw,1.125rem)] font-ManropeMedium hover:bg-[#4F5938] transition-colors"
                  >
                    {editingCategory ? "Сохранить" : "Создать"}
                  </button>
                  <Dialog.Close asChild>
                    <button
                      type="button"
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
    </div>
  );
}
