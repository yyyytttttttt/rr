'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const email = searchParams.get('email') || '';
  const token = searchParams.get('token') || '';
  const [oldPassword, setOldPassword] = useState('');
  const [password, setPassword] = useState('');
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldError, setFieldError] = useState<'old' | 'new' | null>(null);

  // Проверяем наличие необходимых параметров
  if (!email || !token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FFFCF3] px-6">
        <div className="text-center max-w-md">
          <h1 className="text-2xl font-Manrope-SemiBold text-[#4F5338] mb-4">
            Неверная ссылка
          </h1>
          <p className="text-[#9B9B9B] mb-6">
            Ссылка для сброса пароля недействительна или устарела
          </p>
          <Link
            href="/forgetPassword"
            className="inline-block px-6 py-3 rounded-[5px] bg-[#5C6744] text-white hover:opacity-90 transition"
          >
            Запросить новую ссылку
          </Link>
        </div>
      </div>
    );
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setFieldError(null);

    if (oldPassword.trim().length < 6) {
      setError('Введите старый пароль (минимум 6 символов)');
      setFieldError('old');
      return;
    }

    if (password.trim().length < 6) {
      setError('Новый пароль: минимум 6 символов');
      setFieldError('new');
      return;
    }

    try {
      setIsSubmitting(true);

      const requestBody = { email, token, oldPassword, password };
      console.log('Отправка запроса:', requestBody);

      const res = await fetch('/api/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        console.error('Ошибка от сервера:', body);
        const errorMsg = body?.error;

        // Преобразуем коды ошибок в понятные сообщения
        const errorMessages: Record<string, string> = {
          'VALIDATION': 'Некорректные данные. Проверьте правильность заполнения полей',
          'TOKEN_INVALID': 'Ссылка для сброса пароля недействительна',
          'USER_NOT_FOUND': 'Пользователь не найден',
          'Старый пароль неверен': 'Неверный старый пароль',
          'Новый пароль не может совпадать со старым': 'Новый пароль должен отличаться от старого',
          'SAME_PASSWORD': 'Новый пароль должен отличаться от старого',
        };

        const displayError = errorMessages[errorMsg] || errorMsg || 'Не удалось сохранить пароль';
        setError(displayError);

        // Определяем, какое поле подсветить
        if (errorMsg === 'Старый пароль неверен') {
          setFieldError('old');
        } else if (errorMsg === 'Новый пароль не может совпадать со старым' || errorMsg === 'SAME_PASSWORD') {
          setFieldError('new');
        }

        return;
      }

      // пароль сохранён — отправим на логин
      window.location.href = '/Succses';
    } catch (e) {
      setError('Произошла ошибка. Попробуйте ещё раз');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2">
      {/* Левая панель (форма) */}
      <div className="relative flex items-center justify-center bg-[#FFFCF3] px-6 py-10 lg:px-12">
        {/* Назад */}
        <div className="absolute left-6 top-6 lg:left-10 lg:top-10">
          <Link
            href="/"
            className="inline-flex items-center gap-6 text-[clamp(1rem,0.8846rem+0.5128vw,1.5rem)] font-ManropeMedium text-[#8B6F3D] hover:opacity-80 transition"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="22" viewBox="0 0 12 22" fill="none">
              <path
                d="M0.219176 10.2016L10.2192 0.201597C10.3614 0.0691165 10.5494 -0.00300416 10.7437 0.000423367C10.938 0.00385089 11.1234 0.0825634 11.2608 0.219976C11.3982 0.357389 11.4769 0.542774 11.4804 0.737076C11.4838 0.931377 11.4117 1.11942 11.2792 1.2616L1.81043 10.7316L11.2792 20.2016C11.4117 20.3438 11.4838 20.5318 11.4804 20.7261C11.4769 20.9204 11.3982 21.1058 11.2608 21.2432C11.1234 21.3806 10.938 21.4593 10.7437 21.4628C10.5494 21.4662 10.3614 21.3941 10.2192 21.2616L0.219176 11.2616C0.0787258 11.121 -0.000163111 10.9303 -0.000163094 10.7316C-0.000163076 10.5328 0.0787258 10.3422 0.219176 10.2016Z"
                fill="#967450"
              />
            </svg>
            Назад
          </Link>
        </div>

        <div className="w-full max-w-[570px]">
          <h1 className="text-[clamp(1.5rem,1.2692rem+1.0256vw,2.5rem)] text-center font-Manrope-SemiBold tracking-tight text-[#4F5338]">
            Введите новый пароль
          </h1>
          <p className="mt-1 text-[clamp(1rem,0.8846rem+0.5128vw,1.5rem)] font-ManropeRegular text-center text-[#9B9B9B]">
            Чтобы восстановить доступ к аккаунту
          </p>

          <form onSubmit={onSubmit} className="mt-8 space-y-5">
            <div className="relative">
              <input
                type={showOldPassword ? 'text' : 'password'}
                placeholder="Введите старый пароль"
                value={oldPassword}
                onChange={(e) => {
                  setOldPassword(e.target.value);
                  if (error && fieldError === 'old') {
                    setError(null);
                    setFieldError(null);
                  }
                }}
                className={`w-full rounded-[12px] border bg-white px-4 py-[3.5%] pr-12
                           text-[clamp(0.875rem,0.7885rem+0.3846vw,1.25rem)] placeholder:text-[#B0B0B0]
                           outline-none transition focus:ring-2 ${
                             fieldError === 'old'
                               ? 'border-[#E07A5F] focus:ring-[#E07A5F]/40'
                               : 'border-[#967450] focus:ring-[#A0A47A]/40'
                           }`}
              />
              <button
                type="button"
                onClick={() => setShowOldPassword(!showOldPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-[#967450] hover:opacity-70 transition"
              >
                {showOldPassword ? (
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                    <line x1="1" y1="1" x2="23" y2="23"/>
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                    <circle cx="12" cy="12" r="3"/>
                  </svg>
                )}
              </button>
            </div>

            <div className="relative">
              <input
                type={showNewPassword ? 'text' : 'password'}
                placeholder="Введите новый пароль"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (error && fieldError === 'new') {
                    setError(null);
                    setFieldError(null);
                  }
                }}
                className={`w-full rounded-[12px] border bg-white px-4 py-[3.5%] pr-12
                           text-[clamp(0.875rem,0.7885rem+0.3846vw,1.25rem)] placeholder:text-[#B0B0B0]
                           outline-none transition focus:ring-2 ${
                             fieldError === 'new'
                               ? 'border-[#E07A5F] focus:ring-[#E07A5F]/40'
                               : 'border-[#967450] focus:ring-[#A0A47A]/40'
                           }`}
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-[#967450] hover:opacity-70 transition"
              >
                {showNewPassword ? (
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                    <line x1="1" y1="1" x2="23" y2="23"/>
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                    <circle cx="12" cy="12" r="3"/>
                  </svg>
                )}
              </button>
            </div>

            {error && (
              <div className="flex items-start gap-2 rounded-[8px] bg-[#FEE8E3] border border-[#E07A5F] p-3">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#E07A5F"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="flex-shrink-0 mt-0.5"
                >
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="12" y1="8" x2="12" y2="12"/>
                  <line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                <span className="text-[clamp(0.875rem,0.7885rem+0.3846vw,1.125rem)] text-[#E07A5F] font-ManropeRegular">
                  {error}
                </span>
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting || oldPassword.length < 6 || password.length < 6}
              className="w-full py-[2.5%] rounded-[5px] bg-[#5C6744] text-white
                         text-[clamp(0.875rem,0.7885rem+0.3846vw,1.25rem)] font-ManropeRegular
                         tracking-wide transition hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Сохраняем…' : 'Сохранить'}
            </button>

            <p className="text-center text-[clamp(0.875rem,0.7885rem+0.3846vw,1.25rem)] font-ManropeRegular text-[#7A7A7A]">
              Вспомнили пароль?{' '}
              <Link href="/Login" className="text-[#8B6F3D] hover:opacity-80">
                Вход
              </Link>
            </p>
          </form>
        </div>
      </div>

      {/* Правая панель (изображение) */}
      <div className="relative hidden lg:block">
        <Image
          src="/images/login-side.png" // та же текстура, что на логине
          alt=""
          fill
          priority
          quality={100}
          className="object-cover"
        />
        <div className="pointer-events-none absolute left-0 top-0 h-full w-[120px] bg-gradient-to-r from-[#FBF6EA] to-transparent" />
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-[#FFFCF3]">
        <div className="text-[#9B9B9B]">Загрузка...</div>
      </div>
    }>
      <ResetPasswordForm />
    </Suspense>
  );
}
