"use client";

import { useState, useEffect } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import toast from "react-hot-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

type Props = {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
};

type Doctor = {
  id: string;
  name: string;
  title?: string;
  image?: string;
};

type Category = {
  id: string;
  name: string;
  icon?: string;
};

type Service = {
  id: string;
  name: string;
  durationMin: number;
  priceCents: number;
};

type TimeSlot = {
  startUtc: string;
  endUtc: string;
};

// Zod schema для валидации формы
const clientInfoSchema = z.object({
  clientName: z.string().min(1, "Введите имя клиента").max(100, "Имя слишком длинное"),
  clientEmail: z
    .string()
    .email("Введите корректный email")
    .optional()
    .or(z.literal("")),
  clientPhone: z
    .string()
    .regex(/^\+7 \(\d{3}\) \d{3}-\d{2}-\d{2}$/, "Введите телефон в формате +7 (XXX) XXX-XX-XX")
    .optional()
    .or(z.literal("")),
  comment: z.string().max(500, "Комментарий слишком длинный").optional(),
});

type ClientInfoForm = z.infer<typeof clientInfoSchema>;

// Функция форматирования телефона
function formatPhoneNumber(value: string): string {
  // Убираем все символы кроме цифр
  const digits = value.replace(/\D/g, "");

  // Если пусто, возвращаем пусто
  if (!digits) return "";

  // Если начинается с 8, заменяем на 7
  let cleaned = digits;
  if (cleaned.startsWith("8")) {
    cleaned = "7" + cleaned.slice(1);
  }

  // Если не начинается с 7, добавляем 7
  if (!cleaned.startsWith("7")) {
    cleaned = "7" + cleaned;
  }

  // Форматируем: +7 (XXX) XXX-XX-XX
  const match = cleaned.match(/^7(\d{0,3})(\d{0,3})(\d{0,2})(\d{0,2})$/);

  if (!match) return value;

  let formatted = "+7";
  if (match[1]) formatted += ` (${match[1]}`;
  if (match[1].length === 3) formatted += ")";
  if (match[2]) formatted += ` ${match[2]}`;
  if (match[3]) formatted += `-${match[3]}`;
  if (match[4]) formatted += `-${match[4]}`;

  return formatted;
}

export default function AddBookingModal({ open, onClose, onSuccess }: Props) {
  const [activeTab, setActiveTab] = useState<'service' | 'doctor' | 'time' | 'contact' | 'summary'>('service');
  const [loading, setLoading] = useState(false);
  const [tabDirection, setTabDirection] = useState<'forward' | 'backward'>('forward');

  // Списки для выбора
  const [categories, setCategories] = useState<Category[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [slots, setSlots] = useState<TimeSlot[]>([]);

  // Для календаря и времени
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // Данные формы
  const [formData, setFormData] = useState({
    categoryIds: [] as string[], // Массив выбранных категорий
    serviceIds: [] as string[], // Массив выбранных услуг
    doctorId: '',
    start: '',
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm<ClientInfoForm>({
    resolver: zodResolver(clientInfoSchema),
    defaultValues: {
      clientName: "",
      clientEmail: "",
      clientPhone: "",
      comment: "",
    },
  });

  const phoneValue = watch("clientPhone");

  useEffect(() => {
    if (open) {
      loadCategories();
    } else {
      resetForm();
    }
  }, [open]);

  // Загрузка услуг при выборе категорий
  useEffect(() => {
    if (formData.categoryIds && formData.categoryIds.length > 0) {
      loadServices(formData.categoryIds);
    } else {
      setServices([]);
    }
  }, [formData.categoryIds]);

  // Загрузка врачей при выборе услуг
  useEffect(() => {
    if (formData.serviceIds && formData.serviceIds.length > 0) {
      loadDoctors(formData.serviceIds);
    } else {
      setDoctors([]);
    }
  }, [formData.serviceIds]);

  // Загрузка слотов при выборе врача
  useEffect(() => {
    if (formData.serviceIds.length > 0 && formData.doctorId) {
      loadSlots();
    } else {
      setSlots([]);
    }
  }, [formData.serviceIds, formData.doctorId]);

  const resetForm = () => {
    setActiveTab('service');
    setFormData({
      categoryIds: [],
      serviceIds: [],
      doctorId: '',
      start: '',
    });
    setSelectedDate(null);
    setCurrentMonth(new Date());
    reset();
  };

  const loadCategories = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/services/categories");
      const data = await res.json();
      setCategories(data.categories || []);
    } catch (error) {
      console.error("Failed to load categories:", error);
      toast.error("Не удалось загрузить категории");
    } finally {
      setLoading(false);
    }
  };

  const loadServices = async (categoryIds: string[]) => {
    try {
      // Загружаем услуги из всех выбранных категорий
      const allServices: Service[] = [];

      for (const categoryId of categoryIds) {
        const response = await fetch(`/api/services/catalog?categoryId=${categoryId}`);
        const data = await response.json();
        if (data.services) {
          allServices.push(...data.services);
        }
      }

      // Убираем дубликаты по ID
      const uniqueServices = Array.from(
        new Map(allServices.map(service => [service.id, service])).values()
      );

      setServices(uniqueServices);
    } catch (error) {
      console.error('Ошибка загрузки услуг:', error);
      toast.error("Не удалось загрузить услуги");
    }
  };

  const loadDoctors = async (serviceIds: string[]) => {
    try {
      // Загружаем врачей которые могут делать хотя бы одну из выбранных услуг
      const allDoctors: Doctor[] = [];

      for (const serviceId of serviceIds) {
        const response = await fetch(`/api/services/${serviceId}/doctors`);
        const data = await response.json();
        if (data.doctors) {
          allDoctors.push(...data.doctors);
        }
      }

      // Убираем дубликаты по ID
      const uniqueDoctors = Array.from(
        new Map(allDoctors.map(doctor => [doctor.id, doctor])).values()
      );

      setDoctors(uniqueDoctors);
    } catch (error) {
      console.error('Ошибка загрузки врачей:', error);
      toast.error("Не удалось загрузить врачей");
    }
  };

  const loadSlots = async () => {
    try {
      // Загружаем слоты на 14 дней вперед
      const firstServiceId = formData.serviceIds[0];
      if (!firstServiceId) return;

      const allSlots: TimeSlot[] = [];
      const today = new Date();

      // Делаем запросы для каждого дня
      for (let i = 0; i < 14; i++) {
        const day = new Date(today);
        day.setDate(day.getDate() + i);
        const dayStr = day.toISOString().split('T')[0]; // YYYY-MM-DD

        const response = await fetch(
          `/api/doctor/slots?doctorId=${formData.doctorId}&serviceId=${firstServiceId}&day=${dayStr}`
        );
        const data = await response.json();

        if (data.slots && data.slots.length > 0) {
          const daySlots = data.slots.map((slot: any) => ({
            startUtc: slot.startUtc,
            endUtc: slot.startUtc // API не возвращает end
          }));
          allSlots.push(...daySlots);
        }
      }

      setSlots(allSlots);

      if (allSlots.length === 0) {
        toast.error('У выбранного специалиста нет доступных слотов', {
          duration: 4000,
        });
      }
    } catch (error) {
      console.error('Ошибка загрузки слотов:', error);
      toast.error('Не удалось загрузить доступное время');
    }
  };

  const onSubmit = async (data: ClientInfoForm) => {
    if (!formData.doctorId || formData.serviceIds.length === 0 || !formData.start) {
      toast.error("Заполните все обязательные поля");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        doctorId: formData.doctorId,
        serviceId: formData.serviceIds[0], // Используем первую выбранную услугу
        start: formData.start,
        note: data.comment || undefined,
        clientName: data.clientName || undefined,
        clientEmail: data.clientEmail || undefined,
        clientPhone: data.clientPhone || undefined,
      };

      const res = await fetch("/api/admin/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const error = await res.json();
        const errorMessage = error.message || error.error || "Не удалось создать запись";
        toast.error(errorMessage);
        setLoading(false);
        return;
      }

      toast.success("Запись создана успешно");
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error("Failed to create booking:", error);
      const message = error instanceof Error ? error.message : "Не удалось создать запись";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  // Обработчик изменения телефона с автоформатированием
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value);
    setValue("clientPhone", formatted, { shouldValidate: true });
  };

  // Функции для вкладок
  const handleTabChange = (newTab: typeof activeTab) => {
    const tabOrder: (typeof activeTab)[] = ['service', 'doctor', 'time', 'contact', 'summary'];
    const currentIndex = tabOrder.indexOf(activeTab);
    const newIndex = tabOrder.indexOf(newTab);
    setTabDirection(newIndex > currentIndex ? 'forward' : 'backward');

    // Сброс выбранной даты при возврате на вкладку "Время"
    if (newTab === 'time' && activeTab !== 'time') {
      setSelectedDate(null);
    }

    setActiveTab(newTab);
  };

  // Функции для календаря
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1; // Понедельник = 0

    const days: (Date | null)[] = [];

    // Пустые ячейки для выравнивания
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }

    // Дни месяца
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }

    return days;
  };

  const changeMonth = (offset: number) => {
    const newMonth = new Date(currentMonth);
    newMonth.setMonth(newMonth.getMonth() + offset);
    setCurrentMonth(newMonth);
  };

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    setFormData({ ...formData, start: '' }); // Сброс выбранного времени
  };

  // Фильтрация слотов по выбранной дате
  const getTimeSlotsForSelectedDate = () => {
    if (!selectedDate || !slots || slots.length === 0) return [];

    const checkDate = new Date(selectedDate);
    checkDate.setHours(0, 0, 0, 0);

    return slots.filter(slot => {
      const slotDate = new Date(slot.startUtc);
      slotDate.setHours(0, 0, 0, 0);
      return slotDate.getTime() === checkDate.getTime();
    });
  };

  const isDateAvailable = (date: Date | null) => {
    if (!date || !slots || slots.length === 0) return false;

    const checkDate = new Date(date);
    checkDate.setHours(0, 0, 0, 0);

    return slots.some(slot => {
      const slotDate = new Date(slot.startUtc);
      slotDate.setHours(0, 0, 0, 0);
      return slotDate.getTime() === checkDate.getTime();
    });
  };

  // Рассчитать общую стоимость выбранных услуг
  const getTotalPrice = () => {
    return services
      .filter(service => formData.serviceIds.includes(service.id))
      .reduce((sum, service) => sum + service.priceCents, 0) / 100;
  };

  // Получить выбранные услуги
  const getSelectedServices = () => {
    return services.filter(service => formData.serviceIds.includes(service.id));
  };

  // Получить выбранного врача
  const getSelectedDoctor = () => {
    return doctors.find(doctor => doctor.id === formData.doctorId);
  };

  // Функция для переключения категории
  const toggleCategory = (categoryId: string) => {
    setFormData(prev => {
      const categoryIds = prev.categoryIds.includes(categoryId)
        ? prev.categoryIds.filter(id => id !== categoryId)
        : [...prev.categoryIds, categoryId];

      return {
        ...prev,
        categoryIds,
        serviceIds: [] // Сбрасываем выбранные услуги при смене категорий
      };
    });
  };

  // Функция для переключения услуги
  const toggleService = (serviceId: string) => {
    setFormData(prev => {
      const serviceIds = prev.serviceIds.includes(serviceId)
        ? prev.serviceIds.filter(id => id !== serviceId)
        : [...prev.serviceIds, serviceId];

      return {
        ...prev,
        serviceIds
      };
    });
  };

  const canGoToDoctor = formData.serviceIds.length > 0;
  const canGoToTime = formData.doctorId;
  const canGoToContact = formData.start;
  const canGoToSummary = watch("clientName") && watch("clientEmail");

  return (
    <Dialog.Root open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50" />
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-[clamp(1rem,0.8846rem+0.5128vw,1.5rem)] shadow-2xl z-50 w-[calc(100%-2rem)] max-w-[clamp(36rem,32rem+16vw,52rem)] max-h-[90vh] overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between gap-4 px-[clamp(1.5rem,1.2692rem+1.0256vw,2.5rem)] py-[clamp(1.25rem,1.0192rem+1.0256vw,2.25rem)] border-b border-[#E8E2D5]">
            <Dialog.Title className="flex-1 min-w-0 text-[clamp(1.25rem,1.1346rem+0.5128vw,1.75rem)] font-ManropeBold text-[#4F5338] truncate">
              Добавить запись
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

          {/* Вкладки */}
          <div className="flex border-b border-[#E8E2D5] px-[clamp(1.5rem,1.2692rem+1.0256vw,2.5rem)] overflow-x-auto">
            <button
              type="button"
              onClick={() => handleTabChange('service')}
              className={`px-3 sm:px-4 py-3 sm:py-4 text-sm sm:text-base font-ManropeMedium transition-all duration-300 relative whitespace-nowrap ${
                activeTab === 'service'
                  ? 'text-[#4F5338]'
                  : 'text-[#636846] hover:text-[#4F5338]'
              }`}
            >
              Услуга
              {activeTab === 'service' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#5C6744] transition-all duration-300"></div>
              )}
            </button>
            <button
              type="button"
              onClick={() => canGoToDoctor && handleTabChange('doctor')}
              disabled={!canGoToDoctor}
              className={`px-3 sm:px-4 py-3 sm:py-4 text-sm sm:text-base font-ManropeMedium transition-all duration-300 relative whitespace-nowrap ${
                activeTab === 'doctor'
                  ? 'text-[#4F5338]'
                  : canGoToDoctor
                  ? 'text-[#636846] hover:text-[#4F5338]'
                  : 'text-[#636846]/40 cursor-not-allowed'
              }`}
            >
              Врач
              {activeTab === 'doctor' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#5C6744] transition-all duration-300"></div>
              )}
            </button>
            <button
              type="button"
              onClick={() => canGoToTime && handleTabChange('time')}
              disabled={!canGoToTime}
              className={`px-3 sm:px-4 py-3 sm:py-4 text-sm sm:text-base font-ManropeMedium transition-all duration-300 relative whitespace-nowrap ${
                activeTab === 'time'
                  ? 'text-[#4F5338]'
                  : canGoToTime
                  ? 'text-[#636846] hover:text-[#4F5338]'
                  : 'text-[#636846]/40 cursor-not-allowed'
              }`}
            >
              Время
              {activeTab === 'time' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#5C6744] transition-all duration-300"></div>
              )}
            </button>
            <button
              type="button"
              onClick={() => canGoToContact && handleTabChange('contact')}
              disabled={!canGoToContact}
              className={`px-3 sm:px-4 py-3 sm:py-4 text-sm sm:text-base font-ManropeMedium transition-all duration-300 relative whitespace-nowrap ${
                activeTab === 'contact'
                  ? 'text-[#4F5338]'
                  : canGoToContact
                  ? 'text-[#636846] hover:text-[#4F5338]'
                  : 'text-[#636846]/40 cursor-not-allowed'
              }`}
            >
              Контакты
              {activeTab === 'contact' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#5C6744] transition-all duration-300"></div>
              )}
            </button>
            <button
              type="button"
              onClick={() => canGoToSummary && handleTabChange('summary')}
              disabled={!canGoToSummary}
              className={`px-3 sm:px-4 py-3 sm:py-4 text-sm sm:text-base font-ManropeMedium transition-all duration-300 relative whitespace-nowrap ${
                activeTab === 'summary'
                  ? 'text-[#4F5338]'
                  : canGoToSummary
                  ? 'text-[#636846] hover:text-[#4F5338]'
                  : 'text-[#636846]/40 cursor-not-allowed'
              }`}
            >
              Итого
              {activeTab === 'summary' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#5C6744] transition-all duration-300"></div>
              )}
            </button>
          </div>

          {/* Content */}
          <div className="overflow-y-auto max-h-[calc(90vh-12rem)] px-[clamp(1.5rem,1.2692rem+1.0256vw,2.5rem)] py-[clamp(1.5rem,1.2692rem+1.0256vw,2.5rem)]">

            {/* Вкладка: Услуга */}
            {activeTab === 'service' && (
              <div className={`space-y-3 sm:space-y-4 ${tabDirection === 'forward' ? 'animate-slideInRight' : 'animate-slideInLeft'}`}>
                <div className="block">
                  <span className="mb-1.5 sm:mb-2 block text-sm sm:text-base font-ManropeMedium text-[#4F5338]">
                    Категории {formData.categoryIds.length > 0 && `(${formData.categoryIds.length})`}
                  </span>
                  {loading ? (
                    <div className="flex justify-center py-[clamp(2rem,1.7692rem+1.0256vw,3rem)]">
                      <div className="w-8 h-8 border-2 border-[#E8E2D5] border-t-[var(--admin-text-accent)] rounded-full animate-spin" />
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {categories.map((category) => {
                        const isSelected = formData.categoryIds.includes(category.id);
                        return (
                          <label
                            key={category.id}
                            className={`flex items-center gap-3 p-3 border-2 rounded-[8px] sm:rounded-[10px] cursor-pointer transition-all duration-200 ${
                              isSelected
                                ? 'border-[#5C6744] bg-[#5C6744]/5'
                                : 'border-[#E8E2D5] bg-white hover:border-[#5C6744]/50'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={formData.categoryIds.includes(category.id)}
                              onChange={() => toggleCategory(category.id)}
                              className="w-5 h-5 rounded border-[#E8E2D5] text-[#5C6744] focus:ring-[#5C6744] focus:ring-offset-0 cursor-pointer"
                            />
                            <span className="text-sm sm:text-base font-ManropeRegular text-[#636846] flex-1">
                              {category.icon && <span className="mr-2">{category.icon}</span>}
                              {category.name}
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div className="block">
                  <span className="mb-1.5 sm:mb-2 block text-sm sm:text-base font-ManropeMedium text-[#4F5338]">
                    Услуги {formData.serviceIds.length > 0 && `(${formData.serviceIds.length})`}
                  </span>
                  {formData.categoryIds.length === 0 ? (
                    <div className="p-4 bg-[#EEE7DC]/30 rounded-[8px] sm:rounded-[10px] text-center">
                      <p className="text-sm text-[#636846]/60">
                        Сначала выберите категорию
                      </p>
                    </div>
                  ) : services.length === 0 ? (
                    <div className="p-4 bg-[#EEE7DC]/30 rounded-[8px] sm:rounded-[10px] text-center">
                      <p className="text-sm text-[#636846]/60">
                        Загрузка услуг...
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-[300px] overflow-y-auto">
                      {services.map((service) => {
                        const isSelected = formData.serviceIds.includes(service.id);
                        return (
                          <label
                            key={service.id}
                            className={`flex items-center gap-3 p-3 border-2 rounded-[8px] sm:rounded-[10px] cursor-pointer transition-all duration-200 ${
                              isSelected
                                ? 'border-[#5C6744] bg-[#5C6744]/5'
                                : 'border-[#E8E2D5] bg-white hover:border-[#5C6744]/50'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={formData.serviceIds.includes(service.id)}
                              onChange={() => toggleService(service.id)}
                              className="w-5 h-5 rounded border-[#E8E2D5] text-[#5C6744] focus:ring-[#5C6744] focus:ring-offset-0 cursor-pointer"
                            />
                            <span className="text-sm sm:text-base font-ManropeRegular text-[#636846] flex-1">
                              {service.name}
                            </span>
                            <span className="text-sm sm:text-base font-ManropeMedium text-[#5C6744]">
                              {(service.priceCents / 100).toFixed(0)} ₽
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => handleTabChange('doctor')}
                  disabled={formData.serviceIds.length === 0}
                  className="w-full mt-2 sm:mt-3 rounded-[8px] sm:rounded-[10px] bg-[#5C6744] px-4 sm:px-6 py-2.5 sm:py-3 text-sm sm:text-base font-ManropeMedium text-white hover:bg-[#4F5338] disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  Далее
                </button>
              </div>
            )}

            {/* Вкладка: Врач */}
            {activeTab === 'doctor' && (
              <div className={`space-y-3 sm:space-y-4 ${tabDirection === 'forward' ? 'animate-slideInRight' : 'animate-slideInLeft'}`}>
                <h3 className="text-base sm:text-lg font-ManropeSemiBold text-[#4F5338]">Выберите врача</h3>

                <div className="space-y-2 sm:space-y-3 max-h-[400px] overflow-y-auto">
                  {doctors.map((doctor) => (
                    <div
                      key={doctor.id}
                      onClick={() => setFormData({ ...formData, doctorId: doctor.id })}
                      className={`p-3 sm:p-4 border-2 rounded-[8px] sm:rounded-[10px] cursor-pointer transition ${
                        formData.doctorId === doctor.id
                          ? 'border-[#5C6744] bg-[#5C6744]/5'
                          : 'border-[#E8E2D5] hover:border-[#5C6744]/50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div>
                          <p className="font-ManropeMedium text-sm sm:text-base text-[#4F5338]">{doctor.name}</p>
                          {doctor.title && <p className="text-xs sm:text-sm text-[#636846]">{doctor.title}</p>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex gap-2 sm:gap-3 mt-4">
                  <button
                    type="button"
                    onClick={() => handleTabChange('service')}
                    className="flex-1 rounded-[8px] sm:rounded-[10px] border border-[#5C6744] text-[#5C6744] px-4 sm:px-6 py-2.5 sm:py-3 text-sm sm:text-base font-ManropeMedium hover:bg-[#5C6744]/5 transition"
                  >
                    Назад
                  </button>
                  <button
                    type="button"
                    onClick={() => handleTabChange('time')}
                    disabled={!formData.doctorId}
                    className="flex-1 rounded-[8px] sm:rounded-[10px] bg-[#5C6744] text-white px-4 sm:px-6 py-2.5 sm:py-3 text-sm sm:text-base font-ManropeMedium hover:bg-[#4F5338] disabled:opacity-50 disabled:cursor-not-allowed transition"
                  >
                    Далее
                  </button>
                </div>
              </div>
            )}

            {/* Вкладка: Время */}
            {activeTab === 'time' && (
              <div className={`space-y-4 sm:space-y-5 ${tabDirection === 'forward' ? 'animate-slideInRight' : 'animate-slideInLeft'}`}>
                {!selectedDate ? (
                  <>
                    <h3 className="text-base sm:text-lg font-ManropeSemiBold text-[#4F5338]">Выберите дату</h3>

                    {/* Календарь */}
                    <div>
                      {/* Заголовок календаря */}
                      <div className="flex items-center justify-between mb-3 sm:mb-4">
                        <button
                          type="button"
                          onClick={() => changeMonth(-1)}
                          className="p-2 hover:bg-[#5C6744]/10 rounded-lg transition"
                        >
                          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                            <path d="M12.5 15L7.5 10L12.5 5" stroke="#5C6744" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </button>
                        <h4 className="text-base sm:text-lg font-ManropeMedium text-[#4F5338]">
                          {currentMonth.toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' })}
                        </h4>
                        <button
                          type="button"
                          onClick={() => changeMonth(1)}
                          className="p-2 hover:bg-[#5C6744]/10 rounded-lg transition"
                        >
                          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                            <path d="M7.5 5L12.5 10L7.5 15" stroke="#5C6744" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </button>
                      </div>

                      {/* Дни недели */}
                      <div className="grid grid-cols-7 gap-1 sm:gap-2 mb-2">
                        {['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'].map(day => (
                          <div key={day} className="text-center text-xs sm:text-sm font-ManropeMedium text-[#636846] py-1">
                            {day}
                          </div>
                        ))}
                      </div>

                      {/* Дни месяца */}
                      <div className="grid grid-cols-7 gap-1 sm:gap-2">
                        {getDaysInMonth(currentMonth).map((day, index) => {
                          if (!day) {
                            return <div key={`empty-${index}`} />;
                          }

                          const isAvailable = isDateAvailable(day);
                          const isToday = day.toDateString() === new Date().toDateString();
                          const isPast = day < new Date(new Date().setHours(0, 0, 0, 0));

                          return (
                            <button
                              key={day.toISOString()}
                              type="button"
                              onClick={() => {
                                if (isAvailable && !isPast) {
                                  handleDateSelect(day);
                                }
                              }}
                              disabled={!isAvailable || isPast}
                              className={`
                                relative aspect-square p-1 sm:p-2 rounded-lg text-xs sm:text-sm font-ManropeMedium transition-all duration-200 z-10
                                ${isAvailable && !isPast
                                  ? 'bg-[#5C6744]/5 text-[#4F5338] hover:bg-[#5C6744] hover:text-white cursor-pointer'
                                  : 'text-[#636846]/30 cursor-not-allowed'
                                }
                                ${isToday && isAvailable ? 'ring-2 ring-[#5C6744]' : ''}
                              `}
                            >
                              {day.getDate()}
                            </button>
                          );
                        })}
                      </div>

                      {/* Сообщение если нет доступных дат */}
                      {slots.length === 0 && (
                        <div className="mt-4 p-4 bg-[#5C6744]/5 rounded-lg text-center">
                          <p className="text-sm text-[#636846]">
                            У выбранного специалиста нет доступных слотов. Попробуйте выбрать другого врача.
                          </p>
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex items-center justify-between">
                      <h3 className="text-base sm:text-lg font-ManropeSemiBold text-[#4F5338]">
                        {selectedDate.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })}
                      </h3>
                      <button
                        type="button"
                        onClick={() => setSelectedDate(null)}
                        className="text-sm text-[#5C6744] hover:text-[#4F5338] font-ManropeMedium transition"
                      >
                        Изменить дату
                      </button>
                    </div>

                    {/* Список времени */}
                    {getTimeSlotsForSelectedDate().length > 0 ? (
                      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 sm:gap-3 max-h-[350px] overflow-y-auto">
                        {getTimeSlotsForSelectedDate().map((slot) => {
                          const time = new Date(slot.startUtc);
                          return (
                            <button
                              key={slot.startUtc}
                              type="button"
                              onClick={() => {
                                setFormData({ ...formData, start: slot.startUtc });
                              }}
                              className={`relative z-10 p-3 sm:p-4 border-2 rounded-[8px] sm:rounded-[10px] text-sm sm:text-base transition-all duration-200 ${
                                formData.start === slot.startUtc
                                  ? 'border-[#5C6744] bg-[#5C6744] text-white'
                                  : 'border-[#E8E2D5] text-[#636846] hover:border-[#5C6744] hover:bg-[#5C6744]/5'
                              }`}
                            >
                              <div className="font-ManropeMedium">
                                {time.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="p-4 bg-[#5C6744]/5 rounded-lg text-center">
                        <p className="text-sm text-[#636846]">
                          На выбранную дату нет доступного времени
                        </p>
                      </div>
                    )}
                  </>
                )}

                <div className="flex gap-2 sm:gap-3 mt-4">
                  <button
                    type="button"
                    onClick={() => handleTabChange('doctor')}
                    className="flex-1 rounded-[8px] sm:rounded-[10px] border border-[#5C6744] text-[#5C6744] px-4 sm:px-6 py-2.5 sm:py-3 text-sm sm:text-base font-ManropeMedium hover:bg-[#5C6744]/5 transition"
                  >
                    Назад
                  </button>
                  <button
                    type="button"
                    onClick={() => handleTabChange('contact')}
                    disabled={!formData.start}
                    className="flex-1 rounded-[8px] sm:rounded-[10px] bg-[#5C6744] text-white px-4 sm:px-6 py-2.5 sm:py-3 text-sm sm:text-base font-ManropeMedium hover:bg-[#4F5338] disabled:opacity-50 disabled:cursor-not-allowed transition"
                  >
                    Далее
                  </button>
                </div>
              </div>
            )}

            {/* Вкладка: Контакты */}
            {activeTab === 'contact' && (
              <form onSubmit={handleSubmit(onSubmit)} className={`space-y-3 sm:space-y-4 ${tabDirection === 'forward' ? 'animate-slideInRight' : 'animate-slideInLeft'}`}>
                <h3 className="text-base sm:text-lg font-ManropeSemiBold text-[#4F5338]">Данные клиента</h3>

                {/* Имя */}
                <div>
                  <label className="block text-sm sm:text-base font-ManropeMedium text-[#4F5338] mb-1.5 sm:mb-2">
                    Имя и фамилия <span className="text-[#C74545]">*</span>
                  </label>
                  <input
                    type="text"
                    {...register("clientName")}
                    placeholder="Иван Иванов"
                    className={`w-full rounded-[8px] sm:rounded-[10px] border ${
                      errors.clientName ? 'border-[#C74545]' : 'border-[#E8E2D5]'
                    } bg-white px-3 sm:px-4 py-2 sm:py-2.5 text-sm sm:text-base font-ManropeRegular text-[#636846] outline-none focus:border-[#5C6744] transition`}
                  />
                  {errors.clientName && (
                    <p className="mt-1 text-xs sm:text-sm font-ManropeRegular text-[#C74545]">{errors.clientName.message}</p>
                  )}
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm sm:text-base font-ManropeMedium text-[#4F5338] mb-1.5 sm:mb-2">
                    Электронная почта
                  </label>
                  <input
                    type="email"
                    {...register("clientEmail")}
                    placeholder="example@mail.ru"
                    className={`w-full rounded-[8px] sm:rounded-[10px] border ${
                      errors.clientEmail ? 'border-[#C74545]' : 'border-[#E8E2D5]'
                    } bg-white px-3 sm:px-4 py-2 sm:py-2.5 text-sm sm:text-base font-ManropeRegular text-[#636846] outline-none focus:border-[#5C6744] transition`}
                  />
                  {errors.clientEmail && (
                    <p className="mt-1 text-xs sm:text-sm font-ManropeRegular text-[#C74545]">{errors.clientEmail.message}</p>
                  )}
                </div>

                {/* Телефон */}
                <div>
                  <label className="block text-sm sm:text-base font-ManropeMedium text-[#4F5338] mb-1.5 sm:mb-2">
                    Номер телефона
                  </label>
                  <input
                    type="tel"
                    value={phoneValue || ""}
                    onChange={handlePhoneChange}
                    placeholder="+7 (900) 800-76-56"
                    className={`w-full rounded-[8px] sm:rounded-[10px] border ${
                      errors.clientPhone ? 'border-[#C74545]' : 'border-[#E8E2D5]'
                    } bg-white px-3 sm:px-4 py-2 sm:py-2.5 text-sm sm:text-base font-ManropeRegular text-[#636846] outline-none focus:border-[#5C6744] transition`}
                  />
                  {errors.clientPhone && (
                    <p className="mt-1 text-xs sm:text-sm font-ManropeRegular text-[#C74545]">{errors.clientPhone.message}</p>
                  )}
                </div>

                {/* Комментарий */}
                <div>
                  <label className="block text-sm sm:text-base font-ManropeMedium text-[#4F5338] mb-1.5 sm:mb-2">
                    Примечание
                  </label>
                  <textarea
                    {...register("comment")}
                    placeholder="Дополнительная информация..."
                    rows={3}
                    className={`w-full rounded-[8px] sm:rounded-[10px] border ${
                      errors.comment ? 'border-[#C74545]' : 'border-[#E8E2D5]'
                    } bg-white px-3 sm:px-4 py-2 sm:py-2.5 text-sm sm:text-base font-ManropeRegular text-[#636846] outline-none focus:border-[#5C6744] transition resize-none`}
                  />
                  {errors.comment && (
                    <p className="mt-1 text-xs sm:text-sm font-ManropeRegular text-[#C74545]">{errors.comment.message}</p>
                  )}
                </div>

                <div className="flex gap-2 sm:gap-3 mt-4">
                  <button
                    type="button"
                    onClick={() => handleTabChange('time')}
                    className="flex-1 rounded-[8px] sm:rounded-[10px] border border-[#5C6744] text-[#5C6744] px-4 sm:px-6 py-2.5 sm:py-3 text-sm sm:text-base font-ManropeMedium hover:bg-[#5C6744]/5 transition"
                  >
                    Назад
                  </button>
                  <button
                    type="button"
                    onClick={() => handleTabChange('summary')}
                    disabled={!watch("clientName") || !watch("clientEmail")}
                    className="flex-1 rounded-[8px] sm:rounded-[10px] bg-[#5C6744] text-white px-4 sm:px-6 py-2.5 sm:py-3 text-sm sm:text-base font-ManropeMedium hover:bg-[#4F5338] disabled:opacity-50 disabled:cursor-not-allowed transition"
                  >
                    Далее
                  </button>
                </div>
              </form>
            )}

            {/* Вкладка: Итого */}
            {activeTab === 'summary' && (
              <div className={`space-y-3 sm:space-y-4 ${tabDirection === 'forward' ? 'animate-slideInRight' : 'animate-slideInLeft'}`}>
                <h3 className="text-base sm:text-lg font-ManropeSemiBold text-[#4F5338]">Итого</h3>

                {/* Выбранные услуги */}
                <div className="bg-[#EEE7DC]/20 rounded-[8px] sm:rounded-[10px] p-3 sm:p-4">
                  <h4 className="text-sm sm:text-base font-ManropeMedium text-[#4F5338] mb-2 sm:mb-3">
                    Выбранные услуги:
                  </h4>
                  <div className="space-y-2">
                    {getSelectedServices().map((service) => (
                      <div key={service.id} className="flex justify-between items-center">
                        <span className="text-sm sm:text-base font-ManropeRegular text-[#636846]">
                          {service.name}
                        </span>
                        <span className="text-sm sm:text-base font-ManropeMedium text-[#5C6744]">
                          {(service.priceCents / 100).toFixed(0)} ₽
                        </span>
                      </div>
                    ))}
                    <div className="border-t border-[#EEE7DC] pt-2 mt-2">
                      <div className="flex justify-between items-center">
                        <span className="text-base sm:text-lg font-ManropeSemiBold text-[#4F5338]">
                          Итого:
                        </span>
                        <span className="text-lg sm:text-xl font-ManropeSemiBold text-[#5C6744]">
                          {getTotalPrice().toFixed(0)} ₽
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Информация о записи */}
                <div className="bg-[#EEE7DC]/20 rounded-[8px] sm:rounded-[10px] p-3 sm:p-4 space-y-2">
                  <h4 className="text-sm sm:text-base font-ManropeMedium text-[#4F5338] mb-2">
                    Детали записи:
                  </h4>
                  <div className="space-y-1.5">
                    <div className="flex items-start gap-2">
                      <span className="text-sm sm:text-base font-ManropeRegular text-[#636846]/70 min-w-[80px]">
                        Врач:
                      </span>
                      <span className="text-sm sm:text-base font-ManropeMedium text-[#636846]">
                        {getSelectedDoctor()?.name || '—'}
                      </span>
                    </div>
                    {formData.start && (
                      <>
                        <div className="flex items-start gap-2">
                          <span className="text-sm sm:text-base font-ManropeRegular text-[#636846]/70 min-w-[80px]">
                            Дата:
                          </span>
                          <span className="text-sm sm:text-base font-ManropeMedium text-[#636846]">
                            {new Date(formData.start).toLocaleDateString('ru-RU', {
                              day: 'numeric',
                              month: 'long',
                              year: 'numeric'
                            })}
                          </span>
                        </div>
                        <div className="flex items-start gap-2">
                          <span className="text-sm sm:text-base font-ManropeRegular text-[#636846]/70 min-w-[80px]">
                            Время:
                          </span>
                          <span className="text-sm sm:text-base font-ManropeMedium text-[#636846]">
                            {new Date(formData.start).toLocaleTimeString('ru-RU', {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Контактные данные */}
                <div className="bg-[#EEE7DC]/20 rounded-[8px] sm:rounded-[10px] p-3 sm:p-4 space-y-2">
                  <h4 className="text-sm sm:text-base font-ManropeMedium text-[#4F5338] mb-2">
                    Контактные данные клиента:
                  </h4>
                  <div className="space-y-1.5">
                    <div className="flex items-start gap-2">
                      <span className="text-sm sm:text-base font-ManropeRegular text-[#636846]/70 min-w-[80px]">
                        Имя:
                      </span>
                      <span className="text-sm sm:text-base font-ManropeMedium text-[#636846]">
                        {watch("clientName")}
                      </span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-sm sm:text-base font-ManropeRegular text-[#636846]/70 min-w-[80px]">
                        Email:
                      </span>
                      <span className="text-sm sm:text-base font-ManropeMedium text-[#636846]">
                        {watch("clientEmail")}
                      </span>
                    </div>
                    {watch("clientPhone") && (
                      <div className="flex items-start gap-2">
                        <span className="text-sm sm:text-base font-ManropeRegular text-[#636846]/70 min-w-[80px]">
                          Телефон:
                        </span>
                        <span className="text-sm sm:text-base font-ManropeMedium text-[#636846]">
                          {watch("clientPhone")}
                        </span>
                      </div>
                    )}
                    {watch("comment") && (
                      <div className="flex items-start gap-2">
                        <span className="text-sm sm:text-base font-ManropeRegular text-[#636846]/70 min-w-[80px]">
                          Примечание:
                        </span>
                        <span className="text-sm sm:text-base font-ManropeMedium text-[#636846]">
                          {watch("comment")}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex gap-2 sm:gap-3 mt-4">
                  <button
                    type="button"
                    onClick={() => handleTabChange('contact')}
                    className="flex-1 rounded-[8px] sm:rounded-[10px] border border-[#5C6744] text-[#5C6744] px-4 sm:px-6 py-2.5 sm:py-3 text-sm sm:text-base font-ManropeMedium hover:bg-[#5C6744]/5 transition"
                  >
                    Назад
                  </button>
                  <button
                    type="button"
                    onClick={handleSubmit(onSubmit)}
                    disabled={loading}
                    className="flex-1 rounded-[8px] sm:rounded-[10px] bg-[#5C6744] text-white px-4 sm:px-6 py-2.5 sm:py-3 text-sm sm:text-base font-ManropeMedium hover:bg-[#4F5338] disabled:opacity-50 disabled:cursor-not-allowed transition"
                  >
                    {loading ? "Создание..." : "Создать запись"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
