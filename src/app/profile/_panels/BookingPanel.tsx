'use client';

import { useState, useEffect } from 'react';
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
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [useProfileData, setUseProfileData] = useState(true);
  const [customName, setCustomName] = useState('');
  const [customEmail, setCustomEmail] = useState('');
  const [customPhone, setCustomPhone] = useState('');
  const [promoApplied, setPromoApplied] = useState(false);

  // Категории
  const [categories, setCategories] = useState<Array<{ id: string; name: string }>>([]);
  const [activeCat, setActiveCat] = useState<string>('all');
  const visibleServices =
    activeCat === 'all'
      ? services
      : services.filter((s) => s.category?.id === activeCat);

  // Загрузка категорий и услуг
  useEffect(() => {
    (async () => {
      try {
        // Загружаем категории
        const catRes = await fetch('/api/services/categories');
        if (catRes.ok) {
          const catData = await catRes.json();
          console.log('📂 Categories loaded:', catData.categories);
          setCategories(catData.categories || []);
        } else {
          console.error('❌ Categories request failed:', catRes.status);
        }

        // Загружаем услуги
        const servRes = await fetch('/api/services/catalog');
        if (servRes.ok) {
          const servData = await servRes.json();
          console.log('💼 Services loaded:', servData.services);
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
        promo: promoApplied && promo ? promo.trim() : undefined,
        payment,
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
        toast.success('Запись успешно создана!');
        // Небольшая задержка перед переходом, чтобы БД успела обновиться
        setTimeout(() => {
          router.replace('/profile?view=history', { scroll: false });
        }, 100);
      } else {
        toast.error(data.message || data.error || 'Не удалось создать запись');
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
      <section className="mb-6 sm:mb-8 lg:mb-10">
        <h2 className="text-[clamp(1rem,0.9135rem+0.3846vw,1.25rem)] font-Manrope-SemiBold text-[#4F5338] mb-3 sm:mb-4 lg:mb-6">
          Выберите процедуру
        </h2>

        {/* Табы категорий */}
        <div className="flex flex-wrap gap-2 sm:gap-3 lg:gap-4 mb-4 sm:mb-5 lg:mb-6">
          <button
            onClick={() => setActiveCat('all')}
            className={`px-3 py-2 sm:px-4 sm:py-3 lg:px-5 lg:py-4 rounded-[5px] text-[clamp(0.8125rem,0.7548rem+0.2564vw,1rem)] sm:text-[clamp(0.875rem,0.7885rem+0.3846vw,1.25rem)] font-ManropeMedium transition ${
              activeCat === 'all'
                ? 'bg-[#636846] text-white'
                : 'bg-[#F7EFE5] text-[#967450] hover:bg-[#E8E2D5]'
            }`}
          >
            Все
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCat(cat.id)}
              className={`px-3 py-2 sm:px-4 sm:py-3 lg:px-5 lg:py-4 rounded-[5px] text-[clamp(0.8125rem,0.7548rem+0.2564vw,1rem)] sm:text-[clamp(0.875rem,0.7885rem+0.3846vw,1.25rem)] font-ManropeMedium  transition ${
                activeCat === cat.id
                  ? 'bg-[#636846] text-white'
                : 'bg-[#F7EFE5] text-[#967450] hover:bg-[#E8E2D5]'
              }`}
            >
              {cat.name}
            </button>
          ))}
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
                      className="flex-1 px-3 sm:px-6 lg:px-10 py-2.5 sm:py-3 lg:py-4 rounded-[5px] bg-[#636846] text-white text-[clamp(0.8125rem,0.7692rem+0.1923vw,0.9375rem)] sm:text-[clamp(0.875rem,0.8077rem+0.2885vw,1.125rem)] font-ManropeRegular hover:opacity-90 transition"
                    >
                      Выбрано
                    </button>
                  )}
                  <button
                    onClick={() => handleServiceToggle(service)}
                    className={`flex-1 px-3 sm:px-6 lg:px-10 py-2.5 sm:py-3 lg:py-4 rounded-[5px] text-[clamp(0.8125rem,0.7692rem+0.1923vw,0.9375rem)] sm:text-[clamp(0.875rem,0.8077rem+0.2885vw,1.125rem)] font-ManropeRegular hover:opacity-90 transition ${
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
                    className={`min-w-[72px] sm:min-w-[84px] rounded-full border px-3 py-1.5 sm:px-4 sm:py-2 text-[clamp(0.8125rem,0.7692rem+0.1923vw,0.9375rem)] sm:text-[clamp(0.875rem,0.8077rem+0.2885vw,1.125rem)] font-ManropeRegular transition ${
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

              <button
                type="button"
                onClick={() => setShowDatePicker(!showDatePicker)}
                className="ml-1 sm:ml-2 rounded-full border border-[#E6DDCF] bg-white px-3 py-1.5 sm:px-4 sm:py-2 text-[clamp(0.8125rem,0.7692rem+0.1923vw,0.9375rem)] sm:text-[clamp(0.875rem,0.8077rem+0.2885vw,1.125rem)] font-ManropeRegular hover:bg-[#F5EFE4] transition"
              >
                Ещё
              </button>
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
                      className="text-[clamp(0.8125rem,0.7692rem+0.1923vw,0.9375rem)] sm:text-[clamp(0.875rem,0.8077rem+0.2885vw,1.125rem)] font-ManropeRegular text-[#8B6F3D] hover:opacity-80"
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
                    className="w-full rounded-[8px] sm:rounded-[10px] lg:rounded-[12px] border border-[#E6DDCF] bg-white px-3 py-2 sm:px-4 sm:py-2.5 lg:py-3 text-[clamp(0.8125rem,0.7692rem+0.1923vw,0.9375rem)] sm:text-[clamp(0.875rem,0.8077rem+0.2885vw,1.125rem)] font-ManropeRegular outline-none placeholder:text-[#B0B0B0] focus:ring-2 focus:ring-[#A0A47A]/40"
                  />
                  <input
                    type="email"
                    value={customEmail}
                    onChange={(e) => setCustomEmail(e.target.value)}
                    placeholder="Email"
                    className="w-full rounded-[8px] sm:rounded-[10px] lg:rounded-[12px] border border-[#E6DDCF] bg-white px-3 py-2 sm:px-4 sm:py-2.5 lg:py-3 text-[clamp(0.8125rem,0.7692rem+0.1923vw,0.9375rem)] sm:text-[clamp(0.875rem,0.8077rem+0.2885vw,1.125rem)] font-ManropeRegular outline-none placeholder:text-[#B0B0B0] focus:ring-2 focus:ring-[#A0A47A]/40"
                  />
                  <input
                    type="tel"
                    value={customPhone}
                    onChange={(e) => setCustomPhone(e.target.value)}
                    placeholder="Телефон"
                    className="w-full rounded-[8px] sm:rounded-[10px] lg:rounded-[12px] border border-[#E6DDCF] bg-white px-3 py-2 sm:px-4 sm:py-2.5 lg:py-3 text-[clamp(0.8125rem,0.7692rem+0.1923vw,0.9375rem)] sm:text-[clamp(0.875rem,0.8077rem+0.2885vw,1.125rem)] font-ManropeRegular outline-none placeholder:text-[#B0B0B0] focus:ring-2 focus:ring-[#A0A47A]/40"
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
                className="w-full rounded-[8px] sm:rounded-[10px] lg:rounded-[12px] border border-[#E6DDCF] bg-white px-3 py-2 sm:px-4 sm:py-2.5 lg:py-3 text-[clamp(0.8125rem,0.7692rem+0.1923vw,0.9375rem)] sm:text-[clamp(0.875rem,0.8077rem+0.2885vw,1.125rem)] font-ManropeRegular outline-none placeholder:text-[#B0B0B0] focus:ring-2 focus:ring-[#A0A47A]/40"
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
                  className={`w-full rounded-[8px] sm:rounded-[10px] lg:rounded-[12px] border bg-white px-3 py-2 sm:px-4 sm:py-2.5 lg:py-3 text-[clamp(0.8125rem,0.7692rem+0.1923vw,0.9375rem)] sm:text-[clamp(0.875rem,0.8077rem+0.2885vw,1.125rem)] font-ManropeRegular outline-none placeholder:text-[#B0B0B0] focus:ring-2 transition ${
                    promoApplied
                      ? 'border-[#5C6744] focus:ring-[#5C6744]/40'
                      : 'border-[#E6DDCF] focus:ring-[#A0A47A]/40'
                  }`}
                  disabled={promoApplied}
                />
                <button
                  type="button"
                  onClick={() => {
                    if (promo && !promoApplied) {
                      setPromoApplied(true);
                      toast.success('Промокод применён');
                    } else if (promoApplied) {
                      setPromoApplied(false);
                      setPromo('');
                      toast('Промокод удалён');
                    }
                  }}
                  disabled={!promo && !promoApplied}
                  className={`rounded-[5px] px-4 py-2 sm:px-5 sm:py-2.5 lg:px-6 lg:py-3 text-[clamp(0.8125rem,0.7692rem+0.1923vw,0.9375rem)] sm:text-[clamp(0.875rem,0.8077rem+0.2885vw,1.125rem)] font-ManropeRegular transition disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap ${
                    promoApplied
                      ? 'bg-[#F7E9E8] text-[#9B6B6B] hover:bg-[#F1DDDB]'
                      : 'bg-[#F5F1E8] text-[#7A7A7A] hover:bg-[#E8E2D5]'
                  }`}
                >
                  {promoApplied ? 'Удалить' : 'Применить'}
                </button>
              </div>
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

      {/* Modal календаря */}
      {showDatePicker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowDatePicker(false)}>
          <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full mx-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-Manrope-SemiBold text-[#4F5338] mb-4">Выберите дату</h3>
            <input
              type="date"
              className="w-full px-4 py-3 border border-[#E6DDCF] rounded-lg text-sm font-ManropeRegular outline-none focus:ring-2 focus:ring-[#5C6744]/40"
              min={format(minDate, 'yyyy-MM-dd')}
              value={selectedDate}
              onChange={(e) => {
                if (e.target.value) {
                  setSelectedDate(e.target.value);
                  setSelectedSlot(null);
                }
              }}
            />
            <div className="flex gap-3 mt-4">
              <button
                type="button"
                onClick={() => setShowDatePicker(false)}
                className="flex-1 px-4 py-2.5 bg-[#F5F1E8] text-[#7A7A7A] rounded-lg hover:bg-[#E8E2D5] transition font-ManropeRegular"
              >
                Отмена
              </button>
              <button
                type="button"
                onClick={() => {
                  if (selectedDate) {
                    setShowDatePicker(false);
                  }
                }}
                disabled={!selectedDate}
                className={`flex-1 px-4 py-2.5 rounded-lg transition font-ManropeRegular ${
                  selectedDate
                    ? 'bg-[#5C6744] text-white hover:bg-[#4F5938]'
                    : 'bg-[#EDE3D4] text-[#9A8F7D] cursor-not-allowed'
                }`}
              >
                Выбрать
              </button>
            </div>
          </div>
        </div>
      )}
      <div className='h-20 sm:h-32 lg:h-52'>

      </div>
    </div>
  );
}
