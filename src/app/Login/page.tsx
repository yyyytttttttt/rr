'use client';

import Image from 'next/image';
import Link from 'next/link';
import { signIn } from 'next-auth/react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

const schema = z.object({
  email: z.string().email({ message: 'неверный email' }),
  password: z.string().min(6, 'минимум 6 символов'),
});
type FormValues = z.infer<typeof schema>;

export default function LoginPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  // Проверяем ошибки из URL при монтировании компонента
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const urlParams = new URLSearchParams(window.location.search);
    const error = urlParams.get('error');

    if (error) {
      // Очищаем URL от параметра error
      window.history.replaceState({}, '', '/Login');

      // Показываем ошибку пользователю
      const errorMessages: Record<string, { field: 'email' | 'password', message: string }> = {
        'Configuration': { field: 'password', message: 'Ошибка конфигурации сервера' },
        'AccessDenied': { field: 'password', message: 'Доступ запрещён' },
        'Verification': { field: 'email', message: 'Email не подтверждён' },
        'CredentialsSignin': { field: 'password', message: 'Неверный email или пароль' },
        'Default': { field: 'password', message: 'Произошла ошибка при входе' },
      };

      const errorInfo = errorMessages[error] || errorMessages['Default'];
      setError(errorInfo.field, { message: errorInfo.message });
    }
  }, [setError]);

  const onSubmit = async (data: FormValues) => {
    try {
      const res = await signIn('credentials', {
        email: data.email,
        password: data.password,
        redirect: false,
      });

      console.log('SignIn response:', res);

      if (!res) {
        setError('password', { message: 'Ошибка подключения к серверу' });
        return;
      }

      if (res.error) {
        // Обработка специфичных ошибок
        if (res.error === 'EMAIL_NOT_VERIFIED') {
          setError('email', { message: 'Email не подтвержден. Проверьте почту' });
        } else if (res.error === 'CredentialsSignin') {
          setError('password', { message: 'Неверный email или пароль' });
        } else {
          setError('password', { message: 'Ошибка входа: ' + res.error });
        }
        return;
      }

      if (res.ok) {
        // Получаем сессию для определения роли
        const { getSession } = await import('next-auth/react');
        const session = await getSession();

        // Перенаправляем в зависимости от роли
        if (session?.user?.role === 'ADMIN') {
          window.location.href = '/admin';
        } else if (session?.user?.role === 'DOCTOR') {
          window.location.href = '/doctor';
        } else {
          window.location.href = '/profile';
        }
      }
    } catch (error) {
      console.error('Login error:', error);
      setError('password', { message: 'Произошла ошибка при входе' });
    }
  };

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2">
      {/* Левая панель (форма) */}
      <div className="relative flex items-center justify-center bg-[#FFFCF3] px-6 py-10 lg:px-12">
        {/* Навигация назад */}
        <div className="absolute left-6 top-6 lg:left-10 lg:top-10">
          <Link
            href="/"
            className="inline-flex items-center gap-6 text-[clamp(1rem,0.8846rem+0.5128vw,1.5rem)] font-ManropeMedium text-[#8B6F3D] hover:opacity-80 transition"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="22" viewBox="0 0 12 22" fill="none">
                <path d="M0.219176 10.2016L10.2192 0.201597C10.3614 0.0691165 10.5494 -0.00300416 10.7437 0.000423367C10.938 0.00385089 11.1234 0.0825634 11.2608 0.219976C11.3982 0.357389 11.4769 0.542774 11.4804 0.737076C11.4838 0.931377 11.4117 1.11942 11.2792 1.2616L1.81043 10.7316L11.2792 20.2016C11.4117 20.3438 11.4838 20.5318 11.4804 20.7261C11.4769 20.9204 11.3982 21.1058 11.2608 21.2432C11.1234 21.3806 10.938 21.4593 10.7437 21.4628C10.5494 21.4662 10.3614 21.3941 10.2192 21.2616L0.219176 11.2616C0.0787258 11.121 -0.000163111 10.9303 -0.000163094 10.7316C-0.000163076 10.5328 0.0787258 10.3422 0.219176 10.2016Z" fill="#967450"/>
                </svg>
            Назад
          </Link>
        </div>

        <div className="w-full max-w-[570px]">
          <h1 className="text-[clamp(1.5rem,1.2692rem+1.0256vw,2.5rem)] text-center  font-Manrope-SemiBold tracking-tight text-[#4F5338]">
            Вход в профиль
          </h1>
          <p className=" text-[clamp(1rem,0.8846rem+0.5128vw,1.5rem)] font-ManropeRegular text-center text-[#9B9B9B]">
            Введите данные, чтобы войти в аккаунт
          </p>

          <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-5">
            {/* Email */}
            <div>
              
              <input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="example@mail.ru"
                aria-invalid={!!errors.email}
                {...register('email')}
                className={`w-full  rounded-[12px]  border border-[#967450] text-[clamp(0.875rem,0.7885rem+0.3846vw,1.25rem)] bg-white px-4 outline-none transition py-[3.5%] placeholder:text-[#B0B0B0] 
                ${errors.email ? 'border-[#E07A5F] focus:ring-2 focus:ring-[#E07A5F]/30' : 'border-transparent focus:ring-2 focus:ring-[#A0A47A]/40'}`}
              />
              {errors.email && (
                <div className="mt-1 text-sm text-[#E07A5F]">
                  {errors.email.message}
                </div>
              )}
            </div>

            {/* Пароль */}
            <div>
              <div className="mb-2 flex items-center justify-between">


              </div>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="Введите пароль"
                  aria-invalid={!!errors.password}
                  {...register('password')}
                  className={`w-full  rounded-[12px]  border border-[#967450] text-[clamp(0.875rem,0.7885rem+0.3846vw,1.25rem)] bg-white px-4 pr-12 outline-none transition py-[3.5%] placeholder:text-[#B0B0B0]
                  ${errors.password ? 'border-[#E07A5F] focus:ring-2 focus:ring-[#E07A5F]/30' : 'border-transparent focus:ring-2 focus:ring-[#A0A47A]/40'}`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[#967450] hover:opacity-70 transition"
                  aria-label={showPassword ? "Скрыть пароль" : "Показать пароль"}
                >
                  {showPassword ? (
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                      <line x1="1" y1="1" x2="23" y2="23"/>
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                      <circle cx="12" cy="12" r="3"/>
                    </svg>
                  )}
                </button>
              </div>
              {errors.password && (
                <div className="mt-1 text-sm text-[#E07A5F]">
                  {errors.password.message}
                </div>
              )}
            </div>
            <div className='w-full text-center'>
                <Link
                      href="/forgetPassword"
                      className="text-[clamp(0.875rem,0.7885rem+0.3846vw,1.25rem)] w-full font-ManropeMedium text-center text-[#967450] hover:opacity-80"
                    >
                      Не помню пароль
                    </Link>
            </div>

            {/* Кнопка входа */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-[2.5%] cursor-pointer  text-[clamp(0.875rem,0.7885rem+0.3846vw,1.25rem)] rounded-[5px] bg-[#5C6744] text-white font-ManropeRegular tracking-wide transition
              hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Входим…' : 'Войти'}
            </button>

            {/* Регистрация */}
            <p className="text-center text-[clamp(0.875rem,0.7885rem+0.3846vw,1.25rem)] font-ManropeRegular text-[#7A7A7A]">
              У вас ещё нет аккаунта?{' '}
              <Link href="/register" className="text-[#8B6F3D] hover:opacity-80">
                Регистрация
              </Link>
            </p>
          </form>
        </div>
      </div>

      {/* Правая панель (изображение) */}
      <div className="relative hidden lg:block">
        {/* Замените src на вашу картинку из /public */}
        <Image
          src="/images/login-side.png"
          alt=""
          fill
          priority
          className="object-cover"
          quality={100}
        />
        {/* Мягкая тень слева для визуального разделения */}
        <div className="pointer-events-none absolute left-0 top-0 h-full w-[120px] bg-gradient-to-r from-[#FBF6EA] to-transparent" />
      </div>
    </div>
  );
}
