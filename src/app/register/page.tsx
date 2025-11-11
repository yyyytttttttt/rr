'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';

const schema = z.object({
  name: z.string().trim().min(1, { message: 'укажите имя' }).max(50),
  email: z.string().email({ message: 'Неверный email' }),
  password: z.string().min(6, { message: 'Минимум 6 символов' }),
  phone: z.string().regex(/^\+7 \(\d{3}\) \d{3}-\d{2}-\d{2}$/, { message: 'Введите корректный телефон' }),
  birthDate: z.string().regex(/^\d{2}\.\d{2}\.\d{4}$/, { message: 'Введите дату в формате ДД.ММ.ГГГГ' }),
});
type FormValues = z.infer<typeof schema>;

export default function RegisterPage() {
  const [serverError, setServerError] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
    setValue,
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  // Форматирование телефона: +7 (999) 999-99-99
  const formatPhone = (value: string) => {
    const digits = value.replace(/\D/g, '');
    let formatted = '+7';

    if (digits.length > 1) {
      formatted += ' (' + digits.substring(1, 4);
    }
    if (digits.length >= 5) {
      formatted += ') ' + digits.substring(4, 7);
    }
    if (digits.length >= 8) {
      formatted += '-' + digits.substring(7, 9);
    }
    if (digits.length >= 10) {
      formatted += '-' + digits.substring(9, 11);
    }

    return formatted;
  };

  // Форматирование даты: ДД.ММ.ГГГГ
  const formatDate = (value: string) => {
    const digits = value.replace(/\D/g, '');
    let formatted = '';

    if (digits.length > 0) {
      formatted = digits.substring(0, 2);
    }
    if (digits.length >= 3) {
      formatted += '.' + digits.substring(2, 4);
    }
    if (digits.length >= 5) {
      formatted += '.' + digits.substring(4, 8);
    }

    return formatted;
  };

  const onSubmit = async (data: FormValues) => {
    setServerError('');
    const res = await fetch('/api/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    const body = await res.json().catch(() => ({}));

    if (res.ok && (body as any).needVerify) {
      setServerError('');
      alert('Мы отправили письмо с подтверждением. Проверьте почту.');
      return;
    }

    if (res.status === 409) {
      setError('email', { message: 'Email уже занят' });
    } else if (res.status === 400) {
      setServerError('Проверьте правильность полей');
    } else if (!res.ok) {
      setServerError((body as any)?.error || 'Ошибка сервера');
    }
  };

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
            Регистрация
          </h1>
          <p className="mt-1 text-[clamp(1rem,0.8846rem+0.5128vw,1.5rem)] font-ManropeRegular text-center text-[#9B9B9B]">
            Зарегистрируйтесь для входа в личный кабинет
          </p>

          <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-5">
            {/* Имя */}
            <div>
              <input
                placeholder="Введите имя и фамилию"
                {...register('name')}
                className={`w-full rounded-[12px] border border-[#967450] bg-white px-4 py-[3.5%]
                text-[clamp(0.875rem,0.7885rem+0.3846vw,1.25rem)] placeholder:text-[#B0B0B0]
                outline-none transition focus:ring-2 focus:ring-[#A0A47A]/40 ${
                  errors.name ? 'border-[#E07A5F] focus:ring-[#E07A5F]/30' : ''
                }`}
              />
              {errors.name && <div className="mt-1 text-sm text-[#E07A5F]">{errors.name.message}</div>}
            </div>

            {/* Телефон */}
            <div>
              <input
                type="tel"
                placeholder="+7 (999) 999-99-99"
                {...register('phone', {
                  onChange: (e) => {
                    const formatted = formatPhone(e.target.value);
                    setValue('phone', formatted);
                  },
                })}
                className={`w-full rounded-[12px] border border-[#967450] bg-white px-4 py-[3.5%]
                text-[clamp(0.875rem,0.7885rem+0.3846vw,1.25rem)] placeholder:text-[#B0B0B0]
                outline-none transition focus:ring-2 focus:ring-[#A0A47A]/40 ${
                  errors.phone ? 'border-[#E07A5F] focus:ring-[#E07A5F]/30' : ''
                }`}
              />
              {errors.phone && <div className="mt-1 text-sm text-[#E07A5F]">{errors.phone.message}</div>}
            </div>

            {/* Дата рождения */}
            <div>
              <input
                type="text"
                placeholder="ДД.ММ.ГГГГ"
                {...register('birthDate', {
                  onChange: (e) => {
                    const formatted = formatDate(e.target.value);
                    setValue('birthDate', formatted);
                  },
                })}
                className={`w-full rounded-[12px] border border-[#967450] bg-white px-4 py-[3.5%]
                text-[clamp(0.875rem,0.7885rem+0.3846vw,1.25rem)] placeholder:text-[#B0B0B0]
                outline-none transition focus:ring-2 focus:ring-[#A0A47A]/40 ${
                  errors.birthDate ? 'border-[#E07A5F] focus:ring-[#E07A5F]/30' : ''
                }`}
              />
              {errors.birthDate && <div className="mt-1 text-sm text-[#E07A5F]">{errors.birthDate.message}</div>}
            </div>

            {/* Email */}
            <div>
              <input
                type="email"
                placeholder="Введите вашу почту"
                {...register('email')}
                className={`w-full rounded-[12px] border border-[#967450] bg-white px-4 py-[3.5%]
                text-[clamp(0.875rem,0.7885rem+0.3846vw,1.25rem)] placeholder:text-[#B0B0B0]
                outline-none transition focus:ring-2 focus:ring-[#A0A47A]/40 ${
                  errors.email ? 'border-[#E07A5F] focus:ring-[#E07A5F]/30' : ''
                }`}
              />
              {errors.email && <div className="mt-1 text-sm text-[#E07A5F]">{errors.email.message}</div>}
            </div>

            {/* Пароль */}
            <div>
              <input
                type="password"
                placeholder="Введите пароль"
                {...register('password')}
                className={`w-full rounded-[12px] border border-[#967450] bg-white px-4 py-[3.5%]
                text-[clamp(0.875rem,0.7885rem+0.3846vw,1.25rem)] placeholder:text-[#B0B0B0]
                outline-none transition focus:ring-2 focus:ring-[#A0A47A]/40 ${
                  errors.password ? 'border-[#E07A5F] focus:ring-[#E07A5F]/30' : ''
                }`}
              />
              {errors.password && <div className="mt-1 text-sm text-[#E07A5F]">{errors.password.message}</div>}
            </div>

            {/* Подсказка/согласие */}
            <p className="text-[13px] leading-snug text-[#7A7A7A]">
              Нажимая «Зарегистрироваться», вы соглашаетесь на обработку персональных данных.
              {' '}
            
              *
            </p>

            {/* Ошибка с сервера */}
            {serverError && <p className="text-[14px] text-[#E07A5F]">{serverError}</p>}

            {/* Кнопка */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-[2.5%] rounded-[5px] bg-[#5C6744] text-white
              text-[clamp(0.875rem,0.7885rem+0.3846vw,1.25rem)] font-ManropeRegular tracking-wide
              transition hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Создаем…' : 'Зарегистрироваться'}
            </button>

            {/* Ссылка на вход */}
            <p className="text-center text-[clamp(0.875rem,0.7885rem+0.3846vw,1.25rem)] font-ManropeRegular text-[#7A7A7A]">
              У вас уже есть аккаунт?{' '}
              <Link href="/login" className="text-[#8B6F3D] hover:opacity-80">
                Войти
              </Link>
            </p>
          </form>
        </div>
      </div>

      {/* Правая панель (изображение) */}
      <div className="relative hidden lg:block">
        <Image
          src="/images/register-side.png" 
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
