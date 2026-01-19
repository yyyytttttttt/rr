'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

type BookingData = {
  id: string;
  doctorName: string;
  serviceName: string;
  startUtc: string;
  endUtc: string;
  status: string;
  clientName: string;
};

type ConfirmResult = {
  success: boolean;
  message?: string;
  alreadyConfirmed?: boolean;
  booking?: BookingData;
  error?: string;
  code?: string;
};

export default function ConfirmBookingPage() {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [result, setResult] = useState<ConfirmResult | null>(null);

  useEffect(() => {
    const token = searchParams.get('token');
    const bookingId = searchParams.get('bookingId');

    if (!token || !bookingId) {
      setStatus('error');
      setResult({ success: false, error: 'Недействительная ссылка', code: 'MISSING_PARAMS' });
      return;
    }

    const confirmBooking = async () => {
      try {
        const response = await fetch(`/api/bookings/confirm?token=${token}&bookingId=${bookingId}`);
        const data = await response.json();

        if (response.ok && data.success) {
          setStatus('success');
          setResult(data);
        } else {
          setStatus('error');
          setResult(data);
        }
      } catch (error) {
        setStatus('error');
        setResult({ success: false, error: 'Ошибка соединения с сервером', code: 'NETWORK_ERROR' });
      }
    };

    confirmBooking();
  }, [searchParams]);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString('ru-RU', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="min-h-screen bg-[#FFFCF3] flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {status === 'loading' && (
          <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
            <div className="animate-spin w-12 h-12 border-4 border-[#5C6744] border-t-transparent rounded-full mx-auto mb-4"></div>
            <h2 className="text-xl font-ManropeMedium text-[#4F5338]">
              Подтверждаем запись...
            </h2>
          </div>
        )}

        {status === 'success' && result?.booking && (
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            <div className="bg-[#5C6744] p-6 text-center">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h1 className="text-2xl font-Manrope-SemiBold text-white">
                {result.alreadyConfirmed ? 'Запись уже подтверждена' : 'Запись подтверждена!'}
              </h1>
            </div>

            <div className="p-6">
              <p className="text-[#636846] text-center mb-6">
                {result.alreadyConfirmed
                  ? 'Ваша запись была подтверждена ранее.'
                  : 'Спасибо! Ваша запись успешно подтверждена. Ждём вас!'}
              </p>

              <div className="bg-[#F5F0E4] rounded-xl p-5 space-y-3">
                <div className="flex justify-between items-start">
                  <span className="text-sm text-[#636846]">Услуга</span>
                  <span className="text-sm font-ManropeMedium text-[#4F5338] text-right max-w-[60%]">
                    {result.booking.serviceName}
                  </span>
                </div>
                <div className="flex justify-between items-start">
                  <span className="text-sm text-[#636846]">Специалист</span>
                  <span className="text-sm font-ManropeMedium text-[#4F5338]">
                    {result.booking.doctorName}
                  </span>
                </div>
                <div className="flex justify-between items-start">
                  <span className="text-sm text-[#636846]">Дата</span>
                  <span className="text-sm font-ManropeMedium text-[#4F5338]">
                    {formatDate(result.booking.startUtc)}
                  </span>
                </div>
                <div className="flex justify-between items-start">
                  <span className="text-sm text-[#636846]">Время</span>
                  <span className="text-sm font-ManropeMedium text-[#4F5338]">
                    {formatTime(result.booking.startUtc)}
                  </span>
                </div>
              </div>

              <div className="mt-6 space-y-3">
                <Link
                  href="/"
                  className="block w-full bg-[#5C6744] text-white text-center py-3 rounded-xl font-ManropeMedium hover:bg-[#4F5338] transition"
                >
                  На главную
                </Link>
              </div>
            </div>
          </div>
        )}

        {status === 'error' && (
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            <div className="bg-red-500 p-6 text-center">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <h1 className="text-2xl font-Manrope-SemiBold text-white">
                Ошибка подтверждения
              </h1>
            </div>

            <div className="p-6">
              <p className="text-[#636846] text-center mb-6">
                {result?.error || 'Не удалось подтвердить запись'}
              </p>

              {result?.code === 'TOKEN_EXPIRED' && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
                  <p className="text-sm text-amber-700">
                    Срок действия ссылки истёк. Пожалуйста, создайте новую запись.
                  </p>
                </div>
              )}

              {result?.code === 'BOOKING_CANCELED' && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
                  <p className="text-sm text-red-700">
                    Эта запись была отменена. Вы можете создать новую запись.
                  </p>
                </div>
              )}

              <div className="space-y-3">
                <Link
                  href="/"
                  className="block w-full bg-[#5C6744] text-white text-center py-3 rounded-xl font-ManropeMedium hover:bg-[#4F5338] transition"
                >
                  На главную
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
