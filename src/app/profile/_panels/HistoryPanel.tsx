'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import toast from 'react-hot-toast';

type Booking = {
  id: string;
  startUtc: string;
  endUtc: string;
  status: string;
  note: string | null;
  service: { name: string; priceCents: number; currency: string };
  doctor: { name: string; image: string | null };
};

type Props = {
  userId: string;
  tzid: string;
};

export default function HistoryPanel({ userId }: Props) {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const [cancelModal, setCancelModal] = useState<{ isOpen: boolean; bookingId: string | null }>({
    isOpen: false,
    bookingId: null,
  });

  useEffect(() => {
    loadBookings();
  }, [refreshKey]);

  // Обновление при фокусе на странице (когда возвращаются после создания записи)
  useEffect(() => {
    const handleFocus = () => {
      setRefreshKey(prev => prev + 1);
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, []);

  // Закрытие модалки по ESC
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && cancelModal.isOpen) {
        closeCancelModal();
      }
    };

    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [cancelModal.isOpen]);

  const loadBookings = async () => {
    try {
      const res = await fetch('/api/bookings?mine=1');
      if (res.ok) {
        const data = await res.json();
        const bookingsArray = data.bookings || data.items || [];
        setBookings(bookingsArray);
      } else {
        console.error('Bookings API error', { status: res.status });
        toast.error('Не удалось загрузить записи');
      }
    } catch (error) {
      console.error('Failed to load bookings:', error);
      toast.error('Произошла ошибка');
    } finally {
      setLoading(false);
    }
  };

  const openCancelModal = (bookingId: string) => {
    setCancelModal({ isOpen: true, bookingId });
  };

  const closeCancelModal = () => {
    setCancelModal({ isOpen: false, bookingId: null });
  };

  const handleCancelBooking = async () => {
    if (!cancelModal.bookingId) return;

    try {
      const res = await fetch(`/api/bookings/${cancelModal.bookingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'CANCELED' }),
      });

      if (res.ok) {
        toast.success('Запись успешно отменена');
        setBookings(prev =>
          prev.map(b => (b.id === cancelModal.bookingId ? { ...b, status: 'CANCELED' } : b))
        );
        closeCancelModal();
      } else {
        const error = await res.json();
        toast.error(error.error || 'Не удалось отменить запись');
      }
    } catch (error) {
      console.error('Failed to cancel booking:', error);
      toast.error('Произошла ошибка');
    }
  };

  const formatPrice = (cents: number, currency: string) =>
    new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: currency || 'RUB',
      maximumFractionDigits: 0,
    }).format((cents || 0) / 100);

  const isActual = (b: Booking) =>
    new Date(b.startUtc).getTime() > Date.now() && b.status === 'CONFIRMED';

  const getStatusLabel = (status: string): string => {
    const statusMap: Record<string, string> = {
      'PENDING': 'Ожидает подтверждения',
      'CONFIRMED': 'Подтверждена',
      'CANCELED': 'Отменена',
      'COMPLETED': 'Завершена',
      'NO_SHOW': 'Не явился',
    };
    return statusMap[status] || status;
  };

  const statusPill = (b: Booking) => {
    if (isActual(b)) {
      return (
        <span className="rounded-full bg-[#EAF9EF] text-[#1F8B4D] px-[clamp(0.75rem,0.6346rem+0.5128vw,1.25rem)] py-[clamp(0.25rem,0.1923rem+0.2564vw,0.5rem)] text-[clamp(0.75rem,0.6923rem+0.2564vw,1rem)] font-medium">
          Актуально
        </span>
      );
    }
    if (b.status === 'CANCELED') {
      return (
        <span className="text-[#CF5E5E] text-[clamp(0.875rem,0.8077rem+0.2985vw,1.125rem)] font-medium">
          Отменена
        </span>
      );
    }
    if (b.status === 'COMPLETED') {
      return (
        <span className="rounded-full bg-[#E8F5E9] text-[#2E7D32] px-[clamp(0.75rem,0.6346rem+0.5128vw,1.25rem)] py-[clamp(0.25rem,0.1923rem+0.2564vw,0.5rem)] text-[clamp(0.75rem,0.6923rem+0.2564vw,1rem)] font-medium">
          Завершена
        </span>
      );
    }
    if (b.status === 'NO_SHOW') {
      return (
        <span className="rounded-full bg-[#FFF3E0] text-[#E65100] px-[clamp(0.75rem,0.6346rem+0.5128vw,1.25rem)] py-[clamp(0.25rem,0.1923rem+0.2564vw,0.5rem)] text-[clamp(0.75rem,0.6923rem+0.2564vw,1rem)] font-medium">
          Не явился
        </span>
      );
    }
    // fallback (другие статусы)
    return (
      <span className="rounded-full bg-slate-50 text-slate-700 px-[clamp(0.75rem,0.6346rem+0.5128vw,1.25rem)] py-[clamp(0.25rem,0.1923rem+0.2564vw,0.5rem)] text-[clamp(0.75rem,0.6923rem+0.2564vw,1rem)] font-medium">
        {getStatusLabel(b.status)}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="min-h-[40vh] bg-[#FFFCF3] rounded-[clamp(1rem,0.8846rem+0.5128vw,1.5rem)] border border-[#EFE9DF] p-[clamp(1.5rem,1.2692rem+1.0256vw,2.5rem)] animate-pulse">
        <div className="h-[clamp(1.5rem,1.3846rem+0.5128vw,2rem)] w-[clamp(10rem,9.2308rem+3.4188vw,13rem)] bg-[#EEE7DC] rounded mb-[clamp(1rem,0.8846rem+0.5128vw,1.5rem)]" />
        <div className="space-y-[clamp(0.75rem,0.6346rem+0.5128vw,1.25rem)]">
          <div className="h-[clamp(6rem,5.3846rem+2.7350vw,8.5rem)] bg-[#F6F2EA] rounded-[clamp(1rem,0.8846rem+0.5128vw,1.5rem)]" />
          <div className="h-[clamp(6rem,5.3846rem+2.7350vw,8.5rem)] bg-[#F6F2EA] rounded-[clamp(1rem,0.8846rem+0.5128vw,1.5rem)]" />
          <div className="h-[clamp(6rem,5.3846rem+2.7350vw,8.5rem)] bg-[#F6F2EA] rounded-[clamp(1rem,0.8846rem+0.5128vw,1.5rem)]" />
        </div>
      </div>
    );
  }

  // не меняем поведение пустого состояния (оно у тебя выше в другом блоке)

  return (
    <div className="min-h-screen bg-[#FFFCF3]">
      <div className="mx-auto w-full px-[clamp(1rem,0.5385rem+2.0513vw,3rem)] py-[clamp(2rem,1.7692rem+1.0256vw,3rem)]">
        <div className="flex items-center justify-between mb-[clamp(2rem,1.5385rem+2.0513vw,4rem)]">
          <h1 className="text-[clamp(1.5rem,1.3846rem+0.5128vw,2rem)] font-ManropeBold text-[#4F5338]">
            История записей
          </h1>
          <button
            onClick={() => {
              setRefreshKey(prev => prev + 1);
            }}
            className="px-[clamp(1rem,0.7692rem+1.0256vw,2rem)] py-[clamp(0.5rem,0.3846rem+0.5128vw,1rem)] rounded-[clamp(0.5rem,0.4423rem+0.2564vw,0.75rem)] bg-[#F5F0E4] text-[#967450] text-[clamp(0.875rem,0.7885rem+0.3846vw,1.125rem)] font-ManropeRegular hover:bg-[#4c503b] hover:text-white transition-colors duration-300"
          >
            Обновить
          </button>
        </div>

        {bookings.length === 0 ? (
          <div className="flex items-center justify-center min-h-[clamp(25rem,20rem+20vw,40rem)] bg-white rounded-[20px] border border-[#E8E2D5]">
            <div className="text-center space-y-[clamp(0.5rem,calc(0.333rem+0.833vw),1rem)] px-[8%] py-[4%]">
              <h2 className="text-[clamp(1.5rem,1.2692rem+1.0256vw,2.5rem)] font-ManropeBold text-[#4F5338]">
                У вас пока нет записей
              </h2>
              <p className="text-[clamp(1rem,0.9231rem+0.3419vw,1.25rem)] font-ManropeRegular text-[#636846]">
                Запишитесь на процедуру, и ваши записи появятся здесь
              </p>
              <a
                href="/profile?view=booking"
                className="inline-flex cursor-pointer items-center justify-center rounded-[clamp(0.5rem,0.4423rem+0.2564vw,0.75rem)] bg-[#F5F0E4] px-[clamp(2rem,1.6538rem+1.5385vw,3.5rem)] py-[clamp(0.75rem,0.6346rem+0.5128vw,1.25rem)] text-[clamp(1rem,0.9423rem+0.2564vw,1.25rem)] font-ManropeRegular text-[#967450] hover:bg-[#4c503b] hover:text-white duration-500 transition-colors"
              >
                Записаться
              </a>
            </div>
          </div>
        ) : (
          <div className="space-y-[clamp(2rem,1.5385rem+2.0513vw,4rem)]">
            {bookings.map((b, index) => {
              // Защита от отсутствующих данных
              if (!b.service || !b.doctor) {
                console.error('[HistoryPanel] Booking missing data', { id: b.id });
                return null;
              }

              return (
              <div key={b.id} className="space-y-[clamp(0.75rem,0.6346rem+0.5128vw,1.25rem)]">
                {/* Заголовок «Запись № …» */}
                <div className="text-[clamp(1.25rem,1.1346rem+0.5128vw,1.75rem)] font-Manrope-SemiBold text-[#4F5338]">
                  Запись № {bookings.length - index}
                </div>

                {/* Две карточки в ряд */}
                <div className="grid gap-[clamp(1rem,0.8846rem+0.5128vw,1.5rem)] md:grid-cols-[2fr_1.5fr]">
                  {/* Левая карточка — детали */}
                  <div className="rounded-[clamp(1rem,0.8846rem+0.5128vw,1.5rem)] border border-[#F5F0E4] bg-white overflow-hidden">
                    <div className="grid grid-cols-[1fr,2fr,auto] items-center">
                      {/* Процедура */}
                      <div className="px-[clamp(1rem,0.7692rem+1.0256vw,2rem)] py-[clamp(0.75rem,0.5769rem+0.7692vw,1.5rem)] text-[clamp(1rem,0.8846rem+0.5128vw,1.5rem)] font-Manrope-SemiBold text-[#4F5338]">Процедура</div>
                      <div className="px-[clamp(1rem,0.7692rem+1.0256vw,2rem)] py-[clamp(0.75rem,0.5769rem+0.7692vw,1.5rem)] text-[clamp(1rem,0.8846rem+0.5128vw,1.5rem)] font-ManropeMedium text-[#636846]">
                        {b.service.name}
                      </div>
                      <div className="px-[clamp(1rem,0.7692rem+1.0256vw,2rem)] py-[clamp(0.75rem,0.5769rem+0.7692vw,1.5rem)]" />

                      {/* Специалист */}
                      <div className="col-start-1 row-start-2 px-[clamp(1rem,0.7692rem+1.0256vw,2rem)] py-[clamp(0.75rem,0.5769rem+0.7692vw,1.5rem)] text-[clamp(1rem,0.8846rem+0.5128vw,1.5rem)] font-Manrope-SemiBold text-[#4F5338] border-t border-[#F1EADF]">
                        Специалист
                      </div>
                      <div className="row-start-2 px-[clamp(1rem,0.7692rem+1.0256vw,2rem)] py-[clamp(0.75rem,0.5769rem+0.7692vw,1.5rem)] text-[clamp(1rem,0.8846rem+0.5128vw,1.5rem)] font-ManropeMedium text-[#636846] border-t border-[#F1EADF]">
                        {b.doctor.name}
                      </div>
                      <div className="row-start-2 px-[clamp(1rem,0.7692rem+1.0256vw,2rem)] py-[clamp(0.75rem,0.5769rem+0.7692vw,1.5rem)] flex items-center justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-[#967450] opacity-60">
                          <path d="M7 17L17 7M17 7H7M17 7V17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </div>

                      {/* Дата и время */}
                      <div className="col-start-1 row-start-3 px-[clamp(1rem,0.7692rem+1.0256vw,2rem)] py-[clamp(0.75rem,0.5769rem+0.7692vw,1.5rem)] text-[clamp(1rem,0.8846rem+0.5128vw,1.5rem)] font-Manrope-SemiBold text-[#4F5338] border-t border-[#F1EADF]">
                        Дата и время
                      </div>
                      <div className="row-start-3 px-[clamp(1rem,0.7692rem+1.0256vw,2rem)] py-[clamp(0.75rem,0.5769rem+0.7692vw,1.5rem)] text-[clamp(1rem,0.8846rem+0.5128vw,1.5rem)] font-ManropeMedium text-[#636846] border-t border-[#F1EADF]">
                        {format(new Date(b.startUtc), 'd.MM.yyyy, HH:mm', { locale: ru })}
                      </div>
                      <div className="row-start-3 px-[clamp(1rem,0.7692rem+1.0256vw,2rem)] py-[clamp(0.75rem,0.5769rem+0.7692vw,1.5rem)]" />

                      {/* Адрес */}
                      <div className="col-start-1 row-start-4 px-[clamp(1rem,0.7692rem+1.0256vw,2rem)] py-[clamp(0.75rem,0.5769rem+0.7692vw,1.5rem)] text-[clamp(1rem,0.8846rem+0.5128vw,1.5rem)] font-Manrope-SemiBold text-[#4F5338] border-t border-[#F1EADF]">
                        Адрес
                      </div>
                      <div className="row-start-4 px-[clamp(1rem,0.7692rem+1.0256vw,2rem)] py-[clamp(0.75rem,0.5769rem+0.7692vw,1.5rem)] text-[clamp(1rem,0.8846rem+0.5128vw,1.5rem)] font-ManropeMedium text-[#636846] border-t border-[#F1EADF]">
                        г. Балашиха, ул. Заречная 48
                      </div>
                      <div className="row-start-4 px-[clamp(1rem,0.7692rem+1.0256vw,2rem)] py-[clamp(0.75rem,0.5769rem+0.7692vw,1.5rem)] flex items-center justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-[#967450] opacity-60">
                          <path d="M7 17L17 7M17 7H7M17 7V17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </div>

                      {/* Статус */}
                      <div className="col-start-1 row-start-5 px-[clamp(1rem,0.7692rem+1.0256vw,2rem)] py-[clamp(0.75rem,0.5769rem+0.7692vw,1.5rem)] text-[clamp(1rem,0.8846rem+0.5128vw,1.5rem)] font-Manrope-SemiBold text-[#4F5338] border-t border-[#F1EADF]">
                        Статус
                      </div>
                      <div className="row-start-5 px-[clamp(1rem,0.7692rem+1.0256vw,2rem)] py-[clamp(0.75rem,0.5769rem+0.7692vw,1.5rem)] text-[clamp(1rem,0.8846rem+0.5128vw,1.5rem)] font-ManropeMedium text-[#636846] border-t border-[#F1EADF]">
                        {statusPill(b)}
                      </div>
                      <div className="row-start-5 px-[clamp(1rem,0.7692rem+1.0256vw,2rem)] py-[clamp(0.75rem,0.5769rem+0.7692vw,1.5rem)]" />
                    </div>
                  </div>

                  {/* Правая карточка — оплата и действия */}
                  <div className="rounded-[clamp(1rem,0.8846rem+0.5128vw,1.5rem)] border border-[#EEE7DC] bg-white p-[clamp(1.5rem,1.1538rem+1.5385vw,3rem)]">
                    <div className="mb-[clamp(0.5rem,0.3846rem+0.5128vw,1rem)] flex items-center justify-between">
                      <div className="text-[#4F5338] font-Manrope-SemiBold text-[clamp(1rem,0.8846rem+0.5128vw,1.5rem)]">Оплачено онлайн</div>
                      <div className="text-[#4F5338] font-Manrope-SemiBold text-[clamp(1rem,0.8846rem+0.5128vw,1.5rem)]">
                        {formatPrice(b.service.priceCents, b.service.currency)}
                      </div>
                    </div>

                    {/* Пункты списка */}
                    <button
                      type="button"
                      className="w-full mt-[clamp(1.5rem,1.1538rem+1.5385vw,3rem)] mb-[clamp(2rem,1.5385rem+2.0513vw,4rem)] flex items-center justify-between rounded-[clamp(0.75rem,0.6346rem+0.5128vw,1.25rem)] bg-white hover:bg-[#F7F2E8] text-left transition"
                    >
                      <span className="inline-flex items-center gap-[clamp(0.75rem,0.6346rem+0.5128vw,1.25rem)] text-[#2E2E2E]">
                        <span className="">
                          <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32" fill="none">
                            <g clip-path="url(#clip0_10308_477)">
                            <path d="M20 5H25C25.2652 5 25.5196 5.10536 25.7071 5.29289C25.8946 5.48043 26 5.73478 26 6V27C26 27.2652 25.8946 27.5196 25.7071 27.7071C25.5196 27.8946 25.2652 28 25 28H7C6.73478 28 6.48043 27.8946 6.29289 27.7071C6.10536 27.5196 6 27.2652 6 27V6C6 5.73478 6.10536 5.48043 6.29289 5.29289C6.48043 5.10536 6.73478 5 7 5H12" stroke="#636846" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                            <path d="M11 9V8C11 6.67392 11.5268 5.40215 12.4645 4.46447C13.4021 3.52678 14.6739 3 16 3C17.3261 3 18.5979 3.52678 19.5355 4.46447C20.4732 5.40215 21 6.67392 21 8V9H11Z" stroke="#636846" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                            </g>
                            <defs>
                            <clipPath id="clip0_10308_477">
                            <rect width="32" height="32" fill="white"/>
                            </clipPath>
                            </defs>
                            </svg>


                          </span>
                          <span className='text-[clamp(1rem,0.8846rem+0.5128vw,1.5rem)] font-ManropeMedium text-[#636846]'>Чеки по заказу</span>
                      </span>
                      <span className=" text-[clamp(1rem,0.8846rem+0.5128vw,1.5rem)] font-ManropeMedium text-[#636846]">
                        <svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 30 30" fill="none">
                        <path d="M21.1219 15.4969L11.7469 24.8719C11.6136 24.9961 11.4373 25.0637 11.2552 25.0605C11.073 25.0573 10.8992 24.9835 10.7704 24.8547C10.6416 24.7259 10.5678 24.5521 10.5646 24.3699C10.5613 24.1877 10.629 24.0115 10.7532 23.8782L19.6301 15L10.7532 6.12191C10.629 5.98863 10.5613 5.81233 10.5646 5.63017C10.5678 5.44802 10.6416 5.27422 10.7704 5.14539C10.8992 5.01657 11.073 4.94278 11.2552 4.93956C11.4373 4.93635 11.6136 5.00396 11.7469 5.12816L21.1219 14.5032C21.2536 14.635 21.3275 14.8137 21.3275 15C21.3275 15.1864 21.2536 15.3651 21.1219 15.4969Z" fill="#636846"/>
                        </svg>

                      </span>
                    </button>



                    {/* Кнопки действий */}
                    <div className="mt-[clamp(1rem,0.8846rem+0.5128vw,1.5rem)] grid grid-cols-2 gap-[clamp(0.75rem,0.6346rem+0.5128vw,1.25rem)]">
                      <a
                        href="/profile?view=booking"
                        className="rounded-[clamp(0.5rem,0.4423rem+0.2564vw,0.75rem)] bg-[#5C6744] text-white text-[clamp(0.875rem,0.7885rem+0.3846vw,1.125rem)] py-[clamp(0.75rem,0.6346rem+0.5128vw,1.25rem)] px-[clamp(0.75rem,0.5769rem+0.7692vw,1.5rem)] flex items-center justify-center text-center font-ManropeRegular hover:opacity-90 transition whitespace-nowrap"
                      >
                        Записаться еще
                      </a>

                      {b.status !== 'CANCELED' &&
                        b.status !== 'COMPLETED' &&
                        b.status !== 'NO_SHOW' && (
                          <button
                            type="button"
                            onClick={() => openCancelModal(b.id)}
                            className="rounded-[clamp(0.5rem,0.4423rem+0.2564vw,0.75rem)] text-[clamp(0.875rem,0.7885rem+0.3846vw,1.125rem)] py-[clamp(0.75rem,0.6346rem+0.5128vw,1.25rem)] px-[clamp(0.75rem,0.5769rem+0.7692vw,1.5rem)] flex items-center justify-center text-center font-ManropeRegular cursor-pointer hover:opacity-90 transition bg-[#F5E8E7] text-[#B56B6B] hover:bg-[#F0DCDC] whitespace-nowrap"
                          >
                            Отменить запись
                          </button>
                        )}
                    </div>
                  </div>
                </div>
              </div>
              );
            })}
          </div>
        )}
      </div>
      <div className="h-[clamp(8rem,6.1538rem+8.2051vw,16rem)]" />

      {/* Модальное окно подтверждения отмены */}
      {cancelModal.isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
          onClick={closeCancelModal}
        >
          <div
            className="bg-[#FFFCF3] rounded-[clamp(1rem,0.8846rem+0.5128vw,1.5rem)] border border-[#E8E2D5] shadow-2xl p-[clamp(1.5rem,1.2692rem+1.0256vw,2.5rem)] max-w-[clamp(20rem,18rem+10vw,30rem)] w-[90%] mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-[clamp(1.25rem,1.1346rem+0.5128vw,1.75rem)] font-ManropeBold text-[#4F5338] mb-[clamp(0.75rem,0.6346rem+0.5128vw,1.25rem)]">
              Отменить запись?
            </h3>
            <p className="text-[clamp(1rem,0.9231rem+0.3419vw,1.25rem)] font-ManropeRegular text-[#636846] mb-[clamp(1.5rem,1.2692rem+1.0256vw,2.5rem)]">
              Вы действительно хотите отменить эту запись? Это действие необратимо.
            </p>
            <div className="flex gap-[clamp(0.75rem,0.6346rem+0.5128vw,1.25rem)]">
              <button
                type="button"
                onClick={closeCancelModal}
                className="flex-1 rounded-[clamp(0.5rem,0.4423rem+0.2564vw,0.75rem)] bg-[#F5F0E4] text-[#967450] text-[clamp(0.875rem,0.7885rem+0.3846vw,1.125rem)] py-[clamp(0.75rem,0.6346rem+0.5128vw,1.25rem)] px-[clamp(1rem,0.7692rem+1.0256vw,2rem)] font-ManropeRegular hover:bg-[#E8E2D5] transition-colors duration-300"
              >
                Нет, оставить
              </button>
              <button
                type="button"
                onClick={handleCancelBooking}
                className="flex-1 rounded-[clamp(0.5rem,0.4423rem+0.2564vw,0.75rem)] bg-[#E8A5A5] text-[#7A3434] text-[clamp(0.875rem,0.7885rem+0.3846vw,1.125rem)] py-[clamp(0.75rem,0.6346rem+0.5128vw,1.25rem)] px-[clamp(1rem,0.7692rem+1.0256vw,2rem)] font-ManropeRegular hover:bg-[#DC8F8F] transition-colors duration-300"
              >
                Да, отменить
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
