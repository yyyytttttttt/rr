'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import Toast from '../components/Toast';

const schema = z.object({
  email: z.string().email({ message: 'неверный email' }),
});
type FormValues = z.infer<typeof schema>;

export default function ForgotPasswordPage() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });
  const [showToast, setShowToast] = useState(false);

  const onSubmit = async (data: FormValues) => {
    try {
      await fetch('/api/request-password-reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: data.email }),
      });
      setShowToast(true);
    } catch (error) {
      console.error('Password reset request error:', error);
      alert('Произошла ошибка при отправке запроса');
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
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="12"
              height="22"
              viewBox="0 0 12 22"
              fill="none"
              className="-ml-[2px]"
            >
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
            Сбросить пароль
          </h1>
          <p className="mt-1 text-[clamp(1rem,0.8846rem+0.5128vw,1.5rem)] font-ManropeRegular text-center text-[#9B9B9B]">
            Введите&nbsp;почту, чтобы сбросить пароль
          </p>

          <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-6">
            <div>
              <input
                type="email"
                placeholder="Введите вашу почту"
                aria-invalid={!!errors.email}
                {...register('email')}
                className={`w-full rounded-[12px] border border-[#967450] bg-white px-4 py-[3.5%]
                           text-[clamp(0.875rem,0.7885rem+0.3846vw,1.25rem)] placeholder:text-[#B0B0B0]
                           outline-none transition ${errors.email ? 'border-[#E07A5F] focus:ring-2 focus:ring-[#E07A5F]/30' : 'focus:ring-2 focus:ring-[#A0A47A]/40'}`}
              />
              {errors.email && (
                <div className="mt-1 text-sm text-[#E07A5F]">
                  {errors.email.message}
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-[2.5%] rounded-[5px] bg-[#5C6744] text-white
                         text-[clamp(0.875rem,0.7885rem+0.3846vw,1.25rem)] font-ManropeRegular
                         tracking-wide transition hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Отправляем…' : 'Сбросить пароль'}
            </button>

            <p className="text-center text-[clamp(0.875rem,0.7885rem+0.3846vw,1.25rem)] font-ManropeRegular text-[#7A7A7A]">
              Вспомнили пароль?{' '}
              <Link href="/login" className="text-[#8B6F3D] hover:opacity-80">
                Вход
              </Link>
            </p>
          </form>
        </div>

        {/* Toast уведомление */}
        {showToast && (
          <Toast
            message="Письмо успешно отправлено, проверьте вашу электронную почту"
            onClose={() => setShowToast(false)}
          />
        )}
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
