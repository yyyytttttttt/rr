'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { format, addDays } from 'date-fns';
import { ru } from 'date-fns/locale';

type Service = {
  id: string;
  name: string;
  description: string | null;
  priceCents: number;
  currency: string;
  durationMin: number;
  category: { id: string; name: string } | null;
};

type Doctor = {
  id: string;
  name: string;
  title: string | null;
  image: string | null;
  rating?: number;
  reviewCount?: number;
};

type Slot = { start: string; end: string };

type QuoteData = {
  baseAmountCents: number;
  discountAmountCents: number;
  finalAmountCents: number;
  currency: string;
  totalDurationMin: number;
  services: Array<{ id: string; name: string; priceCents: number; durationMin: number }>;
  promoValid: boolean;
  promoMessage: string;
};

type Props = {
  userId: string;
  tzid: string;
  userName: string;
  userEmail: string;
  initialDate?: string;
};

export default function BookingPanel({ userName, userEmail, initialDate }: Props) {
  const router = useRouter();

  // Состояния
  const [services, setServices] = useState<Service[]>([]);
  const [selectedServices, setSelectedServices] = useState<Service[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>(initialDate || '');
  const [slots, setSlots] = useState<Slot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
  const [note, setNote] = useState('');
  const [promo, setPromo] = useState('');
  const [payment, setPayment] = useState<'online' | 'onsite' | null>(null);
  const [loading, setLoading] = useState(false);
  const dateInputRef = useRef<HTMLInputElement>(null);
  const [useProfileData, setUseProfileData] = useState(true);
  const [customName, setCustomName] = useState('');
  const [customEmail, setCustomEmail] = useState('');
  const [customPhone, setCustomPhone] = useState('');
  const [promoApplied, setPromoApplied] = useState(false);
  const [quoteData, setQuoteData] = useState<QuoteData | null>(null);
  const [promoLoading, setPromoLoading] = useState(false);
  const [promoMessage, setPromoMessage] = useState('');

  // Категории
  const [categories, setCategories] = useState<Array<{ id: string; name: string }>>([]);
  const [activeCat, setActiveCat] = useState<string>('all');
  const [catDropdownOpen, setCatDropdownOpen] = useState(false);
  const catDropdownRef = useRef<HTMLDivElement>(null);

  // Пагинация услуг
  const PAGE_SIZE = 6;
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const filteredServices =
    activeCat === 'all'
      ? services
      : services.filter((s) => s.category?.id === activeCat);
  const visibleServices = filteredServices.slice(0, visibleCount);
  const hasMore = filteredServices.length > visibleCount;

  const handleCatChange = useCallback((catId: string) => {
    setActiveCat(catId);
    setCatDropdownOpen(false);
    setVisibleCount(PAGE_SIZE);
  }, []);

  // Закрытие dropdown при клике снаружи
  useEffect(() => {
    if (!catDropdownOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (catDropdownRef.current && !catDropdownRef.current.contains(e.target as Node)) {
        setCatDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [catDropdownOpen]);

  // Загрузка категорий и услуг
  useEffect(() => {
    (async () => {
      try {
        // Загружаем категории
        const catRes = await fetch('/api/services/categories');
        if (catRes.ok) {
          const catData = await catRes.json();
          setCategories(catData.categories || []);
        } else {
          console.error('❌ Categories request failed:', catRes.status);
        }

        // Загружаем услуги
        const servRes = await fetch('/api/services/catalog');
        if (servRes.ok) {
          const servData = await servRes.json();
          setServices(servData.services || []);
        } else {
          console.error('❌ Services request failed:', servRes.status);
        }
      } catch (e) {
        console.error('❌ Error loading data:', e);
        toast.error('Не удалось загрузить данные');
      }
    })();
  }, []);

  // Загрузка врачей при выборе услуг
  useEffect(() => {
    if (selectedServices.length === 0) {
      setDoctors([]);
      return;
    }
    (async () => {
      try {
        // Загружаем врачей для первой выбранной услуги
        const res = await fetch(`/api/services/${selectedServices[0].id}/doctors`);
        if (res.ok) {
          const data = await res.json();
          setDoctors(data.doctors || []);
        }
      } catch (e) {
        console.error(e);
        toast.error('Не удалось загрузить врачей');
      }
    })();
  }, [selectedServices]);

  // Загрузка слотов
  useEffect(() => {
    if (selectedServices.length === 0 || !selectedDoctor || !selectedDate) return;
    (async () => {
      try {
        const res = await fetch(
          `/api/availability?serviceId=${selectedServices[0].id}&doctorId=${selectedDoctor.id}&date=${selectedDate}`
        );
        if (res.ok) {
          const data = await res.json();
          const doctorSlots = data.doctors?.find((d: any) => d.id === selectedDoctor.id);
          setSlots(doctorSlots?.slots || []);
        } else {
          toast.error('Не удалось загрузить доступное время');
        }
      } catch (e) {
        console.error(e);
        toast.error('Не удалось загрузить доступное время');
      }
    })();
  }, [selectedServices, selectedDoctor, selectedDate]);

  // Auto-fetch quote when selected services change
  useEffect(() => {
    if (selectedServices.length === 0) {
      setQuoteData(null);
      setPromoApplied(false);
      setPromoMessage('');
      setPromo('');
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/bookings/quote', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ serviceIds: selectedServices.map((s) => s.id) }),
        });
        if (!cancelled && res.ok) {
          const data = await res.json();
          setQuoteData(data);
        }
      } catch {
        // silent — quote is optional for display
      }
    })();
    // Reset promo when services change
    setPromoApplied(false);
    setPromoMessage('');
    return () => { cancelled = true; };
  }, [selectedServices]);

  const handleServiceToggle = (service: Service) => {
    setSelectedServices((prev) => {
      const exists = prev.find((s) => s.id === service.id);
      if (exists) {
        return prev.filter((s) => s.id !== service.id);
      } else {
        return [...prev, service];
      }
    });
  };

  const handleBooking = async () => {
    if (selectedServices.length === 0 || !selectedDoctor || !selectedSlot) {
      toast.error('Выберите услугу, врача и время');
      return;
    }
    if (!payment) {
      toast.error('Выберите способ оплаты');
      return;
    }
    if (!useProfileData && (!customName || !customEmail)) {
      toast.error('Заполните имя и email');
      return;
    }
    setLoading(true);
    try {
      const bookingData: any = {
        doctorId: selectedDoctor.id,
        serviceId: selectedServices[0].id,
        start: selectedSlot.start,
        note: note.trim() || undefined,
        promoCode: promoApplied && promo ? promo.trim() : undefined,
        paymentMethod: payment,
      };

      if (!useProfileData) {
        bookingData.clientName = customName;
        bookingData.clientEmail = customEmail;
        bookingData.clientPhone = customPhone || undefined;
      }

      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bookingData),
      });
      const data = await res.json();
      if (res.ok) {
        const finalMsg = data.finalAmountCents != null
          ? `Запись создана! Сумма: ${formatPrice(data.finalAmountCents, data.currency || 'RUB')}`
          : 'Запись успешно создана!';
        toast.success(finalMsg);
        setTimeout(() => {
          router.replace('/profile?view=history', { scroll: false });
        }, 100);
      } else {
        // Specific error messages from server
        if (data.error === 'PROMO_ALREADY_USED') {
          toast.error('Вы уже использовали этот промокод');
        } else if (data.error === 'PROMO_EXHAUSTED') {
          toast.error('Промокод исчерпан');
        } else if (data.error === 'SLOT_TAKEN') {
          toast.error('Это время уже занято. Выберите другое время.');
        } else {
          toast.error(data.message || data.error || 'Не удалось создать запись');
        }
      }
    } catch (e) {
      console.error(e);
      toast.error('Произошла ошибка');
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (cents: number, currency: string) =>
    `${(cents / 100).toLocaleString('ru-RU')} ₽`;

  const minDate = new Date();
  const dateTabs = Array.from({ length: 7 }).map((_, i) => addDays(minDate, i));

  return (
    <div className="min-h-screen bg-[#FFFCF3] px-3 py-4 sm:px-6 sm:py-6 lg:px-10">


      <h1 className="text-[clamp(1.125rem,0.8269rem+1.3248vw,2rem)] font-ManropeBold text-[#4F5338] mb-4 sm:mb-6 lg:mb-8">
        Оформление записи на приём
      </h1>

      {/* 1. Выберите процедуру */}
      <section className="mb-8 sm:mb-8 lg:mb-10">
        <h2 className="text-[clamp(1rem,0.9135rem+0.3846vw,1.25rem)] font-Manrope-SemiBold text-[#4F5338] mb-3 sm:mb-4 lg:mb-6">
          Выберите процедуру
        </h2>

        {/* Выпадающий список категорий */}
        <div ref={catDropdownRef} className="relative mb-4 sm:mb-5 lg:mb-6 max-w-xs sm:max-w-sm">
          <button
            type="button"
            onClick={() => setCatDropdownOpen((v) => !v)}
            className={`w-full flex items-center justify-between gap-2 px-4 py-2.5 sm:px-5 sm:py-3 lg:px-6 lg:py-3.5 rounded-[10px] sm:rounded-[12px] border text-left transition-colors ${
              catDropdownOpen
                ? 'border-[#5C6744] bg-white shadow-sm'
                : 'border-[#E8E2D5] bg-white hover:border-[#C5BFAF]'
            }`}
          >
            <span className="text-[clamp(0.875rem,0.8269rem+0.2137vw,1rem)] sm:text-[clamp(0.9375rem,0.8798rem+0.2564vw,1.125rem)] font-ManropeMedium text-[#4F5338] truncate">
              {activeCat === 'all' ? 'Все категории' : categories.find((c) => c.id === activeCat)?.name || 'Все категории'}
            </span>
            <svg
              className={`w-4 h-4 sm:w-5 sm:h-5 text-[#967450] shrink-0 transition-transform duration-200 ${catDropdownOpen ? 'rotate-180' : ''}`}
              fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {catDropdownOpen && (
            <div className="absolute z-20 mt-1.5 w-full bg-white border border-[#E8E2D5] rounded-[10px] sm:rounded-[12px] shadow-lg overflow-hidden max-h-[280px] overflow-y-auto">
              <button
                type="button"
                onClick={() => handleCatChange('all')}
                className={`w-full text-left px-4 py-2.5 sm:px-5 sm:py-3 text-[clamp(0.875rem,0.8269rem+0.2137vw,1rem)] sm:text-[clamp(0.9375rem,0.8798rem+0.2564vw,1.125rem)] font-ManropeMedium transition-colors ${
                  activeCat === 'all'
                    ? 'bg-[#F5F0E4] text-[#4F5338]'
                    : 'text-[#636846] hover:bg-[#FAFAF5]'
                }`}
              >
                Все категории
                {activeCat === 'all' && (
                  <span className="ml-2 text-[#5C6744]">&#10003;</span>
                )}
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => handleCatChange(cat.id)}
                  className={`w-full text-left px-4 py-2.5 sm:px-5 sm:py-3 text-[clamp(0.875rem,0.8269rem+0.2137vw,1rem)] sm:text-[clamp(0.9375rem,0.8798rem+0.2564vw,1.125rem)] font-ManropeMedium transition-colors ${
                    activeCat === cat.id
                      ? 'bg-[#F5F0E4] text-[#4F5338]'
                      : 'text-[#636846] hover:bg-[#FAFAF5]'
                  }`}
                >
                  {cat.name}
                  {activeCat === cat.id && (
                    <span className="ml-2 text-[#5C6744]">&#10003;</span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Карточки услуг */}
        {visibleServices.length === 0 ? (
          <div className="text-center py-8 sm:py-10 lg:py-12 bg-white rounded-[12px] border border-[#E8E2D5]">
            <p className="text-[clamp(0.875rem,0.8269rem+0.2137vw,1rem)] sm:text-[clamp(1rem,0.9423rem+0.2564vw,1.25rem)] font-ManropeRegular text-[#7A7A7A] px-4">
              {services.length === 0
                ? 'Пока нет доступных услуг. Пожалуйста, добавьте услуги через админ-панель.'
                : 'В этой категории пока нет услуг'}
            </p>
          </div>
        ) : (
          <>
            <div className="grid gap-3 sm:gap-4 md:grid-cols-2 lg:grid-cols-3">
              {visibleServices.map((service) => {
              const isSelected = selectedServices.some((s) => s.id === service.id);
              return (
                <div
                  key={service.id}
                  className="bg-white rounded-[12px] sm:rounded-[16px] lg:rounded-[20px] p-4 sm:p-6 lg:p-8"
                >
                  <h3 className="text-[clamp(0.9375rem,0.8798rem+0.2564vw,1.125rem)] sm:text-[clamp(1rem,0.9423rem+0.2564vw,1.25rem)] font-semibold text-[#4F5338] mb-1.5 sm:mb-2">
                    {service.name}
                  </h3>
                  <p className="text-[clamp(0.8125rem,0.7692rem+0.1923vw,0.9375rem)] sm:text-[clamp(0.875rem,0.8077rem+0.2885vw,1.125rem)] font-ManropeRegular text-[#636846] mb-2 sm:mb-3 line-clamp-2">
                    {service.description || 'Поддерживает мягкие ткани лица, предотвращая возрастные изменения'}
                  </p>
                  <p className="text-[clamp(0.9375rem,0.8798rem+0.2564vw,1.125rem)] sm:text-[clamp(1rem,0.9423rem+0.2564vw,1.25rem)] font-ManropeBold text-[#4F5338] mb-3 sm:mb-4">
                    {formatPrice(service.priceCents, service.currency)}
                  </p>

                  <div className="flex gap-2 sm:gap-3 lg:gap-4">
                    {isSelected && (
                      <button
                        onClick={() => handleServiceToggle(service)}
                        className="flex-1 px-3 sm:px-6 lg:px-10 min-h-11 sm:min-h-0 py-2.5 sm:py-3 lg:py-4 rounded-[5px] bg-[#636846] text-white text-[clamp(0.8125rem,0.7692rem+0.1923vw,0.9375rem)] sm:text-[clamp(0.875rem,0.8077rem+0.2885vw,1.125rem)] font-ManropeRegular hover:opacity-90 transition"
                      >
                        Выбрано
                      </button>
                    )}
                    <button
                      onClick={() => handleServiceToggle(service)}
                      className={`flex-1 px-3 sm:px-6 lg:px-10 min-h-11 sm:min-h-0 py-2.5 sm:py-3 lg:py-4 rounded-[5px] text-[clamp(0.8125rem,0.7692rem+0.1923vw,0.9375rem)] sm:text-[clamp(0.875rem,0.8077rem+0.2885vw,1.125rem)] font-ManropeRegular hover:opacity-90 transition ${
                        isSelected
                          ? 'bg-[#FBECEC] text-[#EB5A5A] hover:bg-[#E8E2D5]'
                          : 'bg-[#F5F1E8] text-[#7A7A7A] hover:bg-[#E8E2D5]'
                      }`}
                    >
                      {isSelected ? 'Отменить' : 'Выбрать'}
                    </button>
                  </div>
                </div>
              );
            })}
            </div>

            {/* Счётчик и кнопка «Показать ещё» */}
            <div className="mt-4 sm:mt-5 flex flex-col items-center gap-2">
              {filteredServices.length > PAGE_SIZE && (
                <p className="text-xs sm:text-sm font-ManropeRegular text-[#7A7A5A]">
                  Показано {Math.min(visibleCount, filteredServices.length)} из {filteredServices.length}
                </p>
              )}
              {hasMore && (
                <button
                  type="button"
                  onClick={() => setVisibleCount((v) => v + PAGE_SIZE)}
                  className="px-6 py-2.5 sm:px-8 sm:py-3 rounded-[10px] border border-[#E8E2D5] bg-white text-[clamp(0.875rem,0.8269rem+0.2137vw,1rem)] sm:text-[clamp(0.9375rem,0.8798rem+0.2564vw,1.125rem)] font-ManropeMedium text-[#967450] hover:bg-[#F5F0E4] hover:border-[#C5BFAF] active:scale-[0.98] transition-all"
                >
                  Показать ещё
                </button>
              )}
            </div>
          </>
        )}
      </section>

      {/* 2. Выберите время и специалиста */}
      {selectedServices.length > 0 && (
        <section className="mb-6 sm:mb-8 lg:mb-10">
          <h2 className="text-[clamp(1rem,0.9135rem+0.3846vw,1.25rem)] font-Manrope-SemiBold text-[#4F5338] mb-3 sm:mb-4">
            Выберите время и специалиста
          </h2>

          {/* Календарь */}
          <div className="mb-4 sm:mb-5 lg:mb-6">
            <p className="text-[clamp(0.9375rem,0.8798rem+0.2564vw,1.125rem)] sm:text-[clamp(1rem,0.9423rem+0.2564vw,1.25rem)] font-ManropeMedium text-[#4F5338] mb-2 sm:mb-3">
              2025
            </p>

            {/* Табы дат */}
            <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto pb-2">
              {dateTabs.map((d, idx) => {
                const val = format(d, 'yyyy-MM-dd');
                const active = selectedDate === val;
                return (
                  <button
                    key={idx}
                    onClick={() => {
                      setSelectedDate(val);
                      setSelectedSlot(null);
                    }}
                    className={`min-w-[72px] sm:min-w-[84px] min-h-11 sm:min-h-0 rounded-full border px-3 py-2.5 sm:px-4 sm:py-2 text-[clamp(0.8125rem,0.7692rem+0.1923vw,0.9375rem)] sm:text-[clamp(0.875rem,0.8077rem+0.2885vw,1.125rem)] font-ManropeRegular transition ${
                      active
                        ? 'bg-[#5C6744] text-white border-[#5C6744]'
                        : 'bg-white text-[#4F5338] border-[#E6DDCF] hover:bg-[#F5EFE4]'
                    }`}
                    title={format(d, 'd MMMM yyyy', { locale: ru })}
                  >
                    {format(d, 'd EE', { locale: ru })}
                  </button>
                );
              })}

              <div
                className="relative ml-1 sm:ml-2 cursor-pointer"
                onClick={() => { try { dateInputRef.current?.showPicker(); } catch { dateInputRef.current?.focus(); } }}
              >
                <input
                  ref={dateInputRef}
                  type="date"
                  className="absolute inset-0 w-full h-full opacity-0 z-10"
                  min={format(minDate, 'yyyy-MM-dd')}
                  value={selectedDate}
                  onChange={(e) => {
                    if (e.target.value) {
                      setSelectedDate(e.target.value);
                      setSelectedSlot(null);
                    }
                  }}
                />
                <div
                  className="rounded-full border border-[#E6DDCF] bg-white px-3 py-2.5 sm:px-4 sm:py-2 min-h-11 sm:min-h-0 text-[clamp(0.8125rem,0.7692rem+0.1923vw,0.9375rem)] sm:text-[clamp(0.875rem,0.8077rem+0.2885vw,1.125rem)] font-ManropeRegular hover:bg-[#F5EFE4] transition pointer-events-none select-none"
                >
                  Ещё
                </div>
              </div>
            </div>
          </div>

          {/* Список специалистов с временными слотами */}
          {selectedDate && doctors.length > 0 && (
            <div className="space-y-3 sm:space-y-4">
              {doctors.map((doctor) => (
                <div
                  key={doctor.id}
                  className="bg-white rounded-[10px] sm:rounded-[12px] p-3 sm:p-4 border border-[#E8E2D5]"
                >
                  <div className="flex items-start gap-2 sm:gap-3 mb-2 sm:mb-3">
                    {doctor.image ? (
                      <img
                        src={doctor.image}
                        alt={doctor.name}
                        className="w-10 h-10 sm:w-12 sm:h-12 rounded-full object-cover flex-shrink-0"
                      />
                    ) : (
                      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-[#ECE6D8] flex items-center justify-center text-xl sm:text-2xl flex-shrink-0">
                        👩‍⚕️
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-[clamp(0.9375rem,0.8798rem+0.2564vw,1.125rem)] sm:text-[clamp(1rem,0.9423rem+0.2564vw,1.25rem)] font-ManropeMedium text-[#4F5338] truncate">
                        {doctor.name}
                      </h3>
                      {doctor.title && (
                        <p className="text-[clamp(0.8125rem,0.7692rem+0.1923vw,0.9375rem)] sm:text-[clamp(0.875rem,0.8077rem+0.2885vw,1.125rem)] font-ManropeRegular text-[#7A7A7A] truncate">
                          {doctor.title}
                        </p>
                      )}
                      <div className="flex items-center gap-1 mt-0.5 sm:mt-1">
                        <span className="text-yellow-500 text-sm sm:text-base">★</span>
                        <span className="text-[clamp(0.8125rem,0.7692rem+0.1923vw,0.9375rem)] sm:text-[clamp(0.875rem,0.8077rem+0.2885vw,1.125rem)] font-ManropeRegular text-[#7A7A7A]">
                          {doctor.rating?.toFixed(1) || '5.0'} ({doctor.reviewCount || 0})
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Временные слоты */}
                  {selectedDoctor?.id === doctor.id && slots.length > 0 && (
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-1.5 sm:gap-2">
                      {slots.map((slot) => {
                        const startTime = new Date(slot.start);
                        const isSelected = selectedSlot?.start === slot.start;
                        return (
                          <button
                            key={slot.start}
                            onClick={() => setSelectedSlot(slot)}
                            className={`px-2 py-1.5 sm:px-3 sm:py-2 rounded-[5px] text-[clamp(0.8125rem,0.7692rem+0.1923vw,0.9375rem)] sm:text-[clamp(0.875rem,0.8077rem+0.2885vw,1.125rem)] font-ManropeRegular transition ${
                              isSelected
                                ? 'bg-[#5C6744] text-white'
                                : 'bg-[#F5F1E8] text-[#7A7A7A] hover:bg-[#E8E2D5]'
                            }`}
                          >
                            {format(startTime, 'HH:mm')}
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {selectedDoctor?.id !== doctor.id && (
                    <button
                      onClick={() => {
                        setSelectedDoctor(doctor);
                        setSelectedSlot(null);
                      }}
                      className="min-h-11 sm:min-h-0 inline-flex items-center text-[clamp(0.8125rem,0.7692rem+0.1923vw,0.9375rem)] sm:text-[clamp(0.875rem,0.8077rem+0.2885vw,1.125rem)] font-ManropeRegular text-[#8B6F3D] hover:opacity-80"
                    >
                      Показать доступное время
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* 3. Ваши данные */}
      {selectedSlot && (
        <section className="mb-6 sm:mb-8 lg:mb-10">
          <h2 className="text-[clamp(1rem,0.9135rem+0.3846vw,1.25rem)] font-Manrope-SemiBold text-[#4F5338] mb-3 sm:mb-4">
            Ваши данные
          </h2>

          <div className="bg-white rounded-[10px] sm:rounded-[12px] p-4 sm:p-5 lg:p-6 border border-[#E8E2D5]">
            {/* Табы */}
            <div className="flex gap-4 sm:gap-6 lg:gap-10 text-[clamp(0.875rem,0.8269rem+0.2137vw,1rem)] sm:text-[clamp(1rem,0.9423rem+0.2564vw,1.25rem)] mb-4 sm:mb-5 lg:mb-6 border-b border-[#E8E2D5]">
              <button
                onClick={() => setUseProfileData(true)}
                className={`relative pb-2 sm:pb-3 font-ManropeRegular transition whitespace-nowrap ${
                  useProfileData
                    ? 'text-[#4F5338] after:absolute after:left-0 after:bottom-0 after:h-[2px] after:w-full after:bg-[#5C6744]'
                    : 'text-[#7A7A7A] hover:text-[#4F5338]'
                }`}
              >
                Из профиля
              </button>
              <button
                onClick={() => setUseProfileData(false)}
                className={`relative pb-2 sm:pb-3 font-ManropeRegular transition whitespace-nowrap ${
                  !useProfileData
                    ? 'text-[#4F5338] after:absolute after:left-0 after:bottom-0 after:h-[2px] after:w-full after:bg-[#5C6744]'
                    : 'text-[#7A7A7A] hover:text-[#4F5338]'
                }`}
              >
                Новые данные
              </button>
            </div>

            <div className="space-y-3 sm:space-y-4">
              {/* Поля для ввода новых данных */}
              {!useProfileData && (
                <>
                  <input
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    placeholder="Имя и фамилия"
                    className="w-full rounded-[8px] sm:rounded-[10px] lg:rounded-[12px] border border-[#E6DDCF] bg-white px-4 py-3 sm:px-4 sm:py-2.5 lg:py-3 min-h-11 sm:min-h-0 text-[clamp(0.8125rem,0.7692rem+0.1923vw,0.9375rem)] sm:text-[clamp(0.875rem,0.8077rem+0.2885vw,1.125rem)] font-ManropeRegular outline-none placeholder:text-[#B0B0B0] focus:ring-2 focus:ring-[#A0A47A]/40"
                  />
                  <input
                    type="email"
                    value={customEmail}
                    onChange={(e) => setCustomEmail(e.target.value)}
                    placeholder="Email"
                    className="w-full rounded-[8px] sm:rounded-[10px] lg:rounded-[12px] border border-[#E6DDCF] bg-white px-4 py-3 sm:px-4 sm:py-2.5 lg:py-3 min-h-11 sm:min-h-0 text-[clamp(0.8125rem,0.7692rem+0.1923vw,0.9375rem)] sm:text-[clamp(0.875rem,0.8077rem+0.2885vw,1.125rem)] font-ManropeRegular outline-none placeholder:text-[#B0B0B0] focus:ring-2 focus:ring-[#A0A47A]/40"
                  />
                  <input
                    type="tel"
                    value={customPhone}
                    onChange={(e) => setCustomPhone(e.target.value)}
                    placeholder="Телефон"
                    className="w-full rounded-[8px] sm:rounded-[10px] lg:rounded-[12px] border border-[#E6DDCF] bg-white px-4 py-3 sm:px-4 sm:py-2.5 lg:py-3 min-h-11 sm:min-h-0 text-[clamp(0.8125rem,0.7692rem+0.1923vw,0.9375rem)] sm:text-[clamp(0.875rem,0.8077rem+0.2885vw,1.125rem)] font-ManropeRegular outline-none placeholder:text-[#B0B0B0] focus:ring-2 focus:ring-[#A0A47A]/40"
                  />
                </>
              )}

              {/* Данные из профиля */}
              {useProfileData && (
                <div className="p-3 sm:p-4 bg-[#F5EFE4] rounded-[6px] sm:rounded-[8px] text-[clamp(0.8125rem,0.7692rem+0.1923vw,0.9375rem)] sm:text-[clamp(0.875rem,0.8077rem+0.2885vw,1.125rem)] font-ManropeRegular text-[#4F5338]">
                  <div className="mb-0.5 sm:mb-1"><strong>Имя:</strong> {userName}</div>
                  <div><strong>Email:</strong> {userEmail}</div>
                </div>
              )}

              {/* Комментарий */}
              <textarea
                rows={3}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Комментарий (по желанию)"
                className="w-full rounded-[8px] sm:rounded-[10px] lg:rounded-[12px] border border-[#E6DDCF] bg-white px-4 py-3 sm:px-4 sm:py-2.5 lg:py-3 min-h-11 sm:min-h-0 text-[clamp(0.8125rem,0.7692rem+0.1923vw,0.9375rem)] sm:text-[clamp(0.875rem,0.8077rem+0.2885vw,1.125rem)] font-ManropeRegular outline-none placeholder:text-[#B0B0B0] focus:ring-2 focus:ring-[#A0A47A]/40"
              />

              {/* Промокод */}
              <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-2 sm:gap-3">
                <input
                  value={promo}
                  onChange={(e) => {
                    setPromo(e.target.value);
                    setPromoApplied(false);
                  }}
                  placeholder="Промокод"
                  className={`w-full rounded-[8px] sm:rounded-[10px] lg:rounded-[12px] border bg-white px-4 py-3 sm:px-4 sm:py-2.5 lg:py-3 min-h-11 sm:min-h-0 text-[clamp(0.8125rem,0.7692rem+0.1923vw,0.9375rem)] sm:text-[clamp(0.875rem,0.8077rem+0.2885vw,1.125rem)] font-ManropeRegular outline-none placeholder:text-[#B0B0B0] focus:ring-2 transition ${
                    promoApplied
                      ? 'border-[#5C6744] focus:ring-[#5C6744]/40'
                      : 'border-[#E6DDCF] focus:ring-[#A0A47A]/40'
                  }`}
                  disabled={promoApplied}
                />
                <button
                  type="button"
                  onClick={async () => {
                    if (promoApplied) {
                      // Remove promo — re-fetch quote without it
                      setPromoApplied(false);
                      setPromo('');
                      setPromoMessage('');
                      if (selectedServices.length > 0) {
                        try {
                          const res = await fetch('/api/bookings/quote', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ serviceIds: selectedServices.map((s) => s.id) }),
                          });
                          if (res.ok) setQuoteData(await res.json());
                        } catch { /* silent */ }
                      }
                      toast('Промокод удалён');
                      return;
                    }
                    if (!promo.trim() || selectedServices.length === 0) return;
                    setPromoLoading(true);
                    setPromoMessage('');
                    try {
                      const res = await fetch('/api/bookings/quote', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          serviceIds: selectedServices.map((s) => s.id),
                          promoCode: promo.trim(),
                        }),
                      });
                      const data = await res.json();
                      if (res.ok) {
                        setQuoteData(data);
                        if (data.promoValid) {
                          setPromoApplied(true);
                          setPromoMessage(data.promoMessage);
                          toast.success(data.promoMessage || 'Промокод применён');
                        } else {
                          setPromoMessage(data.promoMessage);
                          toast.error(data.promoMessage || 'Промокод недействителен');
                        }
                      } else {
                        toast.error(data.message || 'Ошибка проверки промокода');
                      }
                    } catch {
                      toast.error('Не удалось проверить промокод');
                    } finally {
                      setPromoLoading(false);
                    }
                  }}
                  disabled={(!promo && !promoApplied) || promoLoading}
                  className={`rounded-[5px] px-4 py-2 sm:px-5 sm:py-2.5 lg:px-6 lg:py-3 text-[clamp(0.8125rem,0.7692rem+0.1923vw,0.9375rem)] sm:text-[clamp(0.875rem,0.8077rem+0.2885vw,1.125rem)] font-ManropeRegular transition disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap ${
                    promoApplied
                      ? 'bg-[#F7E9E8] text-[#9B6B6B] hover:bg-[#F1DDDB]'
                      : 'bg-[#F5F1E8] text-[#7A7A7A] hover:bg-[#E8E2D5]'
                  }`}
                >
                  {promoLoading ? '...' : promoApplied ? 'Удалить' : 'Применить'}
                </button>
              {promoMessage && !promoApplied && (
                <p className="text-[clamp(0.8125rem,0.7692rem+0.1923vw,0.9375rem)] font-ManropeRegular text-[#EB5A5A] mt-1">
                  {promoMessage}
                </p>
              )}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Итог записи */}
      {selectedSlot && quoteData && (
        <section className="mb-6 sm:mb-8 lg:mb-10 w-full flex flex-col justify-center items-center ">
          <h2 className="text-[clamp(1rem,0.9135rem+0.3846vw,1.25rem)] font-Manrope-SemiBold  text-[#4F5338] mb-3 sm:mb-4">
            Итог записи
          </h2>
          <div className="bg-white rounded-[10px] sm:rounded-[12px] border border-[#E8E2D5] w-full max-w-[1040px] overflow-hidden">
            {/* Rows */}
            <div className="grid grid-cols-[auto_1fr] text-[clamp(0.875rem,0.8269rem+0.2137vw,1rem)] sm:text-[clamp(0.9375rem,0.8798rem+0.2564vw,1.125rem)]">
              <div className="px-4 sm:px-5 py-2.5 sm:py-3 font-ManropeRegular text-[#7A7A7A] border-b border-[#F1EADF]">Услуга</div>
              <div className="px-4 sm:px-5 py-2.5 sm:py-3 font-ManropeMedium text-[#4F5338] text-right border-b border-[#F1EADF]">{selectedServices[0]?.name}</div>

              {selectedDoctor && (
                <>
                  <div className="px-4 sm:px-5 py-2.5 sm:py-3 font-ManropeRegular text-[#7A7A7A] border-b border-[#F1EADF]">Специалист</div>
                  <div className="px-4 sm:px-5 py-2.5 sm:py-3 font-ManropeMedium text-[#4F5338] text-right border-b border-[#F1EADF]">{selectedDoctor.name}</div>
                </>
              )}

              <div className="px-4 sm:px-5 py-2.5 sm:py-3 font-ManropeRegular text-[#7A7A7A] border-b border-[#F1EADF]">Дата / время</div>
              <div className="px-4 sm:px-5 py-2.5 sm:py-3 font-ManropeMedium text-[#4F5338] text-right border-b border-[#F1EADF]">
                {format(new Date(selectedSlot.start), 'd MMM, HH:mm', { locale: ru })}
              </div>

              <div className="px-4 sm:px-5 py-2.5 sm:py-3 font-ManropeRegular text-[#7A7A7A] border-b border-[#F1EADF]">Длительность</div>
              <div className="px-4 sm:px-5 py-2.5 sm:py-3 font-ManropeMedium text-[#4F5338] text-right border-b border-[#F1EADF]">{quoteData.totalDurationMin} мин</div>

              <div className="px-4 sm:px-5 py-2.5 sm:py-3 font-ManropeRegular text-[#7A7A7A] border-b border-[#F1EADF]">Стоимость</div>
              <div className="px-4 sm:px-5 py-2.5 sm:py-3 font-ManropeMedium text-[#4F5338] text-right border-b border-[#F1EADF]">{formatPrice(quoteData.baseAmountCents, quoteData.currency)}</div>

              {quoteData.discountAmountCents > 0 && (
                <>
                  <div className="px-4 sm:px-5 py-2.5 sm:py-3 font-ManropeRegular text-[#5C6744] border-b border-[#F1EADF]">
                    Скидка{promoApplied && promo ? ` (${promo})` : ''}
                  </div>
                  <div className="px-4 sm:px-5 py-2.5 sm:py-3 font-ManropeMedium text-[#5C6744] text-right border-b border-[#F1EADF]">
                    -{formatPrice(quoteData.discountAmountCents, quoteData.currency)}
                  </div>
                </>
              )}
            </div>

            {/* Total row */}
            <div className="flex items-center justify-between px-4 sm:px-5 py-3 sm:py-4 bg-[#F9F6EF]">
              <span className="text-[clamp(1rem,0.9135rem+0.3846vw,1.25rem)] font-ManropeBold text-[#4F5338]">Итого</span>
              <span className="text-[clamp(1rem,0.9135rem+0.3846vw,1.25rem)] font-ManropeBold text-[#4F5338]">{formatPrice(quoteData.finalAmountCents, quoteData.currency)}</span>
            </div>
          </div>
        </section>
      )}

      {/* 4. Способ оплаты */}
      {selectedSlot && (
        <section className="mb-6 sm:mb-8 lg:mb-10">
          <h2 className="text-[clamp(1rem,0.9135rem+0.3846vw,1.25rem)] font-Manrope-SemiBold text-[#4F5338] mb-3 sm:mb-4">
            Выберите способ оплаты
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-4 sm:mb-5 lg:mb-6">
            <button
              onClick={() => setPayment('online')}
              className={`px-4 py-3 sm:px-5 sm:py-3.5 lg:px-6 lg:py-4 rounded-[6px] sm:rounded-[8px] text-[clamp(0.9375rem,0.8798rem+0.2564vw,1.125rem)] sm:text-[clamp(1rem,0.9423rem+0.2564vw,1.25rem)] font-ManropeRegular transition ${
                payment === 'online'
                  ? 'bg-[#5C6744] text-white'
                  : 'bg-[#F5F1E8] text-[#7A7A7A] hover:bg-[#E8E2D5]'
              }`}
            >
              Оплатить онлайн
            </button>
            <button
              onClick={() => setPayment('onsite')}
              className={`px-4 py-3 sm:px-5 sm:py-3.5 lg:px-6 lg:py-4 rounded-[6px] sm:rounded-[8px] text-[clamp(0.9375rem,0.8798rem+0.2564vw,1.125rem)] sm:text-[clamp(1rem,0.9423rem+0.2564vw,1.25rem)] font-ManropeRegular transition ${
                payment === 'onsite'
                  ? 'bg-[#5C6744] text-white'
                  : 'bg-[#F5F1E8] text-[#7A7A7A] hover:bg-[#E8E2D5]'
              }`}
            >
              Оплата на месте
            </button>
          </div>

          {/* Кнопка записаться */}
          <button
            onClick={handleBooking}
            disabled={loading || !payment || (!useProfileData && (!customName || !customEmail))}
            className={`w-full py-3 sm:py-3.5 lg:py-4 rounded-[5px] text-[clamp(0.9375rem,0.8798rem+0.2564vw,1.125rem)] sm:text-[clamp(1rem,0.9423rem+0.2564vw,1.25rem)] font-ManropeRegular transition ${
              loading || !payment || (!useProfileData && (!customName || !customEmail))
                ? 'bg-[#EDE3D4] text-[#9A8F7D] cursor-not-allowed'
                : 'bg-[#5C6744] text-white hover:bg-[#4F5938]'
            }`}
          >
            {loading ? 'Записываемся…' : 'Записаться'}
          </button>
        </section>
      )}

      <div className='h-20 sm:h-32 lg:h-52'>

      </div>
    </div>
  );
}
