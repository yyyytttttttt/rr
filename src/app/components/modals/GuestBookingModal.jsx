'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://novay-y.com';

// Кастомный Select компонент
function CustomSelect({ value, onChange, options, placeholder, disabled }) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const selectedOption = options.find(opt => opt.value === value);

  return (
    <div ref={containerRef}>
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`relative w-full rounded-[8px] sm:rounded-[10px] border border-[#EEE7DC] bg-white px-3 sm:px-4 pr-10 py-2 sm:py-2.5 text-sm sm:text-base font-ManropeRegular text-left outline-none focus:border-[#5C6744] transition ${
          disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
        } ${value ? 'text-[#636846]' : 'text-[#636846]/60'}`}
      >
        {selectedOption ? selectedOption.label : placeholder}
        <div className={`absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 pointer-events-none transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}>
          <svg width="12" height="8" viewBox="0 0 12 8" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M1 1.5L6 6.5L11 1.5" stroke="#636846" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
      </button>

      <div
        className={`overflow-hidden transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] ${
          isOpen ? 'max-h-[250px] mt-2 opacity-100' : 'max-h-0 mt-0 opacity-0'
        }`}
      >
        <div className={`bg-white border border-[#EEE7DC] rounded-[8px] sm:rounded-[10px] shadow-lg max-h-[250px] overflow-y-auto transition-transform duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] ${
          isOpen ? 'translate-y-0' : '-translate-y-2'
        }`}>
          {options.map((option) => (
            <div
              key={option.value}
              onClick={() => {
                onChange(option.value);
                setIsOpen(false);
              }}
              className={`px-3 sm:px-4 py-2 sm:py-2.5 text-sm sm:text-base font-ManropeRegular cursor-pointer transition-all duration-200 ease-out ${
                option.value === value
                  ? 'bg-[#5C6744] text-white'
                  : 'text-[#636846] hover:bg-[#5C6744]/10'
              }`}
            >
              {option.label}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function GuestBookingModal({ isOpen, onClose }) {
  const [activeTab, setActiveTab] = useState('service');
  const [loading, setLoading] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [tabDirection, setTabDirection] = useState('forward');

  // Списки для выбора
  const [categories, setCategories] = useState([]);
  const [services, setServices] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [slots, setSlots] = useState([]);

  // Для календаря и времени
  const [selectedDate, setSelectedDate] = useState(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // Данные формы
  const [formData, setFormData] = useState({
    categoryId: '',
    serviceId: '',
    doctorId: '',
    start: '',
    clientName: '',
    clientEmail: '',
    clientPhone: '',
    note: ''
  });

  // Анимация и загрузка при открытии
  useEffect(() => {
    if (isOpen) {
      setIsAnimating(true);
      loadCategories();
    } else {
      setIsAnimating(false);
    }
  }, [isOpen]);

  // Загрузка услуг при выборе категории
  useEffect(() => {
    if (formData.categoryId) {
      loadServices(formData.categoryId);
    }
  }, [formData.categoryId]);

  // Загрузка врачей при выборе услуги
  useEffect(() => {
    if (formData.serviceId) {
      loadDoctors(formData.serviceId);
    }
  }, [formData.serviceId]);

  // Загрузка слотов при выборе врача
  useEffect(() => {
    if (formData.serviceId && formData.doctorId) {
      loadSlots();
    }
  }, [formData.serviceId, formData.doctorId]);

  const loadCategories = async () => {
    try {
      const response = await fetch(`${API_URL}/api/services/categories`);
      const data = await response.json();
      setCategories(data.categories || []);
    } catch (error) {
      console.error('Ошибка загрузки категорий:', error);
    }
  };

  const loadServices = async (categoryId) => {
    try {
      const response = await fetch(`${API_URL}/api/services/catalog?categoryId=${categoryId}`);
      const data = await response.json();
      setServices(data.services || []);
    } catch (error) {
      console.error('Ошибка загрузки услуг:', error);
    }
  };

  const loadDoctors = async (serviceId) => {
    try {
      const response = await fetch(`${API_URL}/api/services/${serviceId}/doctors`);
      const data = await response.json();
      setDoctors(data.doctors || []);
    } catch (error) {
      console.error('Ошибка загрузки врачей:', error);
    }
  };

  const loadSlots = async () => {
    try {
      const from = new Date();
      const to = new Date();
      to.setDate(to.getDate() + 14);

      const response = await fetch(
        `${API_URL}/api/doctor/slots?doctorId=${formData.doctorId}&serviceId=${formData.serviceId}&from=${from.toISOString()}&to=${to.toISOString()}`
      );
      const data = await response.json();
      setSlots(data.slots || []);
    } catch (error) {
      console.error('Ошибка загрузки слотов:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/api/bookings/guest`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          doctorId: formData.doctorId,
          serviceId: formData.serviceId,
          start: formData.start,
          clientName: formData.clientName,
          clientEmail: formData.clientEmail,
          clientPhone: formData.clientPhone || undefined,
          note: formData.note || undefined,
        })
      });

      const data = await response.json();

      if (data.success) {
        alert('✅ ' + data.message);
        handleClose();
      } else {
        alert('❌ ' + (data.error || 'Ошибка записи'));
      }
    } catch (error) {
      alert('❌ Ошибка связи с сервером');
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (newTab) => {
    const tabOrder = ['service', 'doctor', 'time', 'contact'];
    const currentIndex = tabOrder.indexOf(activeTab);
    const newIndex = tabOrder.indexOf(newTab);
    setTabDirection(newIndex > currentIndex ? 'forward' : 'backward');

    // Сброс выбранной даты при возврате на вкладку "Время"
    if (newTab === 'time' && activeTab !== 'time') {
      setSelectedDate(null);
    }

    setActiveTab(newTab);
  };

  const handleClose = () => {
    setIsAnimating(false);
    setTimeout(() => {
      setActiveTab('service');
      setSelectedDate(null);
      setCurrentMonth(new Date());
      setFormData({
        categoryId: '',
        serviceId: '',
        doctorId: '',
        start: '',
        clientName: '',
        clientEmail: '',
        clientPhone: '',
        note: ''
      });
      setServices([]);
      setDoctors([]);
      setSlots([]);
      onClose();
    }, 300);
  };

  const formatPhoneNumber = (value) => {
    const digitsOnly = value.replace(/\D/g, '');
    const limited = digitsOnly.slice(0, 11);

    if (limited.length === 0) return '';

    let formatted = '+7';
    if (limited.length > 1) {
      formatted += ` (${limited.slice(1, 4)}`;
      if (limited.length >= 4) formatted += ')';
      if (limited.length >= 5) formatted += ` ${limited.slice(4, 7)}`;
      if (limited.length >= 8) formatted += `-${limited.slice(7, 9)}`;
      if (limited.length >= 10) formatted += `-${limited.slice(9, 11)}`;
    }

    return formatted;
  };

  const handlePhoneChange = (value) => {
    const formatted = formatPhoneNumber(value);
    setFormData({ ...formData, clientPhone: formatted });
  };

  // Функции для календаря
  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1; // Понедельник = 0

    const days = [];

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

  const changeMonth = (offset) => {
    const newMonth = new Date(currentMonth);
    newMonth.setMonth(newMonth.getMonth() + offset);
    setCurrentMonth(newMonth);
  };

  const handleDateSelect = (date) => {
    setSelectedDate(date);
    setFormData({ ...formData, start: '' }); // Сброс выбранного времени
  };

  // Фильтрация слотов по выбранной дате
  const getTimeSlotsForSelectedDate = () => {
    if (!selectedDate) return [];

    const selectedDateStr = selectedDate.toLocaleDateString('ru-RU');
    return slots.filter(slot => {
      const slotDate = new Date(slot.start);
      return slotDate.toLocaleDateString('ru-RU') === selectedDateStr;
    });
  };

  // Получить уникальные даты из слотов
  const getAvailableDates = () => {
    const dates = new Set();
    slots.forEach(slot => {
      const date = new Date(slot.start);
      date.setHours(0, 0, 0, 0);
      dates.add(date.toISOString());
    });
    return Array.from(dates).map(d => new Date(d));
  };

  const isDateAvailable = (date) => {
    if (!date) return false;
    const dateStr = date.toLocaleDateString('ru-RU');
    return slots.some(slot => {
      const slotDate = new Date(slot.start);
      return slotDate.toLocaleDateString('ru-RU') === dateStr;
    });
  };

  if (!isOpen) return null;

  const canGoToDoctor = formData.serviceId;
  const canGoToTime = formData.doctorId;
  const canGoToContact = formData.start;

  // Опции для селектов
  const categoryOptions = [
    { value: '', label: 'Выберите категорию' },
    ...categories.map(cat => ({ value: cat.id, label: cat.name }))
  ];

  const serviceOptions = [
    { value: '', label: 'Выберите услугу' },
    ...services.map(service => ({
      value: service.id,
      label: `${service.name} - ${(service.priceCents / 100).toFixed(0)} ₽`
    }))
  ];

  return (
    <div
      className={`fixed inset-0 bg-black/60 z-[9999] flex items-center justify-center p-3 sm:p-4 transition-opacity duration-300 ${
        isAnimating ? 'opacity-100' : 'opacity-0'
      }`}
      onClick={handleClose}
    >
      <div
        className={`bg-white rounded-[12px] sm:rounded-[16px] w-full max-w-[90%] sm:max-w-[600px] md:max-w-[700px] max-h-[90vh] overflow-y-auto shadow-2xl transition-all duration-300 ${
          isAnimating ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Заголовок */}
        <div className="flex justify-between items-center p-4 sm:p-6 border-b border-[#EEE7DC]">
          <h2 className="text-xl sm:text-2xl font-Manrope-SemiBold text-[#4F5338]">
            Записаться на прием
          </h2>
          <button
            onClick={handleClose}
            className="text-[#636846] hover:text-[#4F5338] text-2xl sm:text-3xl leading-none transition w-8 h-8 flex items-center justify-center"
          >
            ×
          </button>
        </div>

        {/* Вкладки */}
        <div className="flex border-b border-[#EEE7DC] px-4 sm:px-6">
          <button
            type="button"
            onClick={() => handleTabChange('service')}
            className={`px-3 sm:px-4 py-3 sm:py-4 text-sm sm:text-base font-ManropeMedium transition-all duration-300 relative ${
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
            className={`px-3 sm:px-4 py-3 sm:py-4 text-sm sm:text-base font-ManropeMedium transition-all duration-300 relative ${
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
            className={`px-3 sm:px-4 py-3 sm:py-4 text-sm sm:text-base font-ManropeMedium transition-all duration-300 relative ${
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
            className={`px-3 sm:px-4 py-3 sm:py-4 text-sm sm:text-base font-ManropeMedium transition-all duration-300 relative ${
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
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-6">
          {/* Вкладка: Услуга */}
          {activeTab === 'service' && (
            <div className={`space-y-3 sm:space-y-4 ${tabDirection === 'forward' ? 'animate-slideInRight' : 'animate-slideInLeft'}`}>
              <label className="block">
                <span className="mb-1.5 sm:mb-2 block text-sm sm:text-base font-ManropeMedium text-[#4F5338]">
                  Категория
                </span>
                <CustomSelect
                  value={formData.categoryId}
                  onChange={(value) => setFormData({ ...formData, categoryId: value, serviceId: '' })}
                  options={categoryOptions}
                  placeholder="Выберите категорию"
                />
              </label>

              {formData.categoryId && (
                <label className="block">
                  <span className="mb-1.5 sm:mb-2 block text-sm sm:text-base font-ManropeMedium text-[#4F5338]">
                    Услуга
                  </span>
                  <CustomSelect
                    value={formData.serviceId}
                    onChange={(value) => setFormData({ ...formData, serviceId: value })}
                    options={serviceOptions}
                    placeholder="Выберите услугу"
                  />
                </label>
              )}

              <button
                type="button"
                onClick={() => handleTabChange('doctor')}
                disabled={!formData.serviceId}
                className="w-full mt-2 sm:mt-3 rounded-[8px] sm:rounded-[10px] bg-[#5C6744] px-4 sm:px-6 py-2.5 sm:py-3 text-sm sm:text-base font-ManropeMedium text-white hover:bg-[#4F5338] disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                Далее
              </button>
            </div>
          )}

          {/* Вкладка: Врач */}
          {activeTab === 'doctor' && (
            <div className={`space-y-3 sm:space-y-4 ${tabDirection === 'forward' ? 'animate-slideInRight' : 'animate-slideInLeft'}`}>
              <h3 className="text-base sm:text-lg font-Manrope-SemiBold text-[#4F5338]">Выберите врача</h3>

              <div className="space-y-2 sm:space-y-3 max-h-[400px] overflow-y-auto">
                {doctors.map((doctor) => (
                  <div
                    key={doctor.id}
                    onClick={() => setFormData({ ...formData, doctorId: doctor.id })}
                    className={`p-3 sm:p-4 border-2 rounded-[8px] sm:rounded-[10px] cursor-pointer transition ${
                      formData.doctorId === doctor.id
                        ? 'border-[#5C6744] bg-[#5C6744]/5'
                        : 'border-[#EEE7DC] hover:border-[#5C6744]/50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {doctor.image && (
                        <Image
                          src={doctor.image}
                          alt={doctor.name}
                          width={50}
                          height={50}
                          className="rounded-full w-12 h-12 sm:w-14 sm:h-14 object-cover"
                        />
                      )}
                      <div>
                        <p className="font-ManropeMedium text-sm sm:text-base text-[#4F5338]">{doctor.name}</p>
                        <p className="text-xs sm:text-sm text-[#636846]">{doctor.title}</p>
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
                  <h3 className="text-base sm:text-lg font-Manrope-SemiBold text-[#4F5338]">Выберите дату</h3>

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
                            onClick={() => isAvailable && !isPast && handleDateSelect(day)}
                            disabled={!isAvailable || isPast}
                            className={`
                              aspect-square p-1 sm:p-2 rounded-lg text-xs sm:text-sm font-ManropeMedium transition-all duration-200
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
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-center justify-between">
                    <h3 className="text-base sm:text-lg font-Manrope-SemiBold text-[#4F5338]">
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
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 sm:gap-3 max-h-[350px] overflow-y-auto">
                    {getTimeSlotsForSelectedDate().map((slot) => {
                      const time = new Date(slot.start);
                      return (
                        <button
                          key={slot.start}
                          type="button"
                          onClick={() => setFormData({ ...formData, start: slot.start })}
                          className={`p-3 sm:p-4 border-2 rounded-[8px] sm:rounded-[10px] text-sm sm:text-base transition-all duration-200 ${
                            formData.start === slot.start
                              ? 'border-[#5C6744] bg-[#5C6744] text-white'
                              : 'border-[#EEE7DC] text-[#636846] hover:border-[#5C6744] hover:bg-[#5C6744]/5'
                          }`}
                        >
                          <div className="font-ManropeMedium">
                            {time.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </button>
                      );
                    })}
                  </div>
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
            <div className={`space-y-3 sm:space-y-4 ${tabDirection === 'forward' ? 'animate-slideInRight' : 'animate-slideInLeft'}`}>
              <h3 className="text-base sm:text-lg font-Manrope-SemiBold text-[#4F5338]">Ваши контакты</h3>

              <label className="block">
                <span className="mb-1.5 sm:mb-2 block text-sm sm:text-base font-ManropeMedium text-[#4F5338]">
                  Имя и фамилия *
                </span>
                <input
                  type="text"
                  value={formData.clientName}
                  onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
                  placeholder="Иван Иванов"
                  className="w-full rounded-[8px] sm:rounded-[10px] border border-[#EEE7DC] bg-white px-3 sm:px-4 py-2 sm:py-2.5 text-sm sm:text-base font-ManropeRegular text-[#636846] outline-none focus:border-[#5C6744] transition"
                  required
                />
              </label>

              <label className="block">
                <span className="mb-1.5 sm:mb-2 block text-sm sm:text-base font-ManropeMedium text-[#4F5338]">
                  Электронная почта *
                </span>
                <input
                  type="email"
                  value={formData.clientEmail}
                  onChange={(e) => setFormData({ ...formData, clientEmail: e.target.value })}
                  placeholder="example@mail.ru"
                  className="w-full rounded-[8px] sm:rounded-[10px] border border-[#EEE7DC] bg-white px-3 sm:px-4 py-2 sm:py-2.5 text-sm sm:text-base font-ManropeRegular text-[#636846] outline-none focus:border-[#5C6744] transition"
                  required
                />
              </label>

              <label className="block">
                <span className="mb-1.5 sm:mb-2 block text-sm sm:text-base font-ManropeMedium text-[#4F5338]">
                  Номер телефона
                </span>
                <input
                  type="tel"
                  value={formData.clientPhone}
                  onChange={(e) => handlePhoneChange(e.target.value)}
                  placeholder="+7 (900) 800-76-56"
                  maxLength={18}
                  className="w-full rounded-[8px] sm:rounded-[10px] border border-[#EEE7DC] bg-white px-3 sm:px-4 py-2 sm:py-2.5 text-sm sm:text-base font-ManropeRegular text-[#636846] outline-none focus:border-[#5C6744] transition"
                />
              </label>

              <label className="block">
                <span className="mb-1.5 sm:mb-2 block text-sm sm:text-base font-ManropeMedium text-[#4F5338]">
                  Примечание
                </span>
                <textarea
                  value={formData.note}
                  onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                  placeholder="Дополнительная информация..."
                  rows={3}
                  className="w-full rounded-[8px] sm:rounded-[10px] border border-[#EEE7DC] bg-white px-3 sm:px-4 py-2 sm:py-2.5 text-sm sm:text-base font-ManropeRegular text-[#636846] outline-none focus:border-[#5C6744] transition resize-none"
                />
              </label>

              <div className="flex gap-2 sm:gap-3 mt-4">
                <button
                  type="button"
                  onClick={() => handleTabChange('time')}
                  className="flex-1 rounded-[8px] sm:rounded-[10px] border border-[#5C6744] text-[#5C6744] px-4 sm:px-6 py-2.5 sm:py-3 text-sm sm:text-base font-ManropeMedium hover:bg-[#5C6744]/5 transition"
                >
                  Назад
                </button>
                <button
                  type="submit"
                  disabled={loading || !formData.clientName || !formData.clientEmail}
                  className="flex-1 rounded-[8px] sm:rounded-[10px] bg-[#5C6744] text-white px-4 sm:px-6 py-2.5 sm:py-3 text-sm sm:text-base font-ManropeMedium hover:bg-[#4F5338] disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  {loading ? 'Отправка...' : 'Записаться'}
                </button>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
