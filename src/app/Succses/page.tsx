'use client';

import Image from 'next/image';
import Link from 'next/link';

export default function PasswordChangedPage() {
  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2">
      {/* Левая панель */}
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
            Пароль изменен
          </h1>
          <p className="mt-2 text-center text-[clamp(1rem,0.8846rem+0.5128vw,1.5rem)] font-ManropeRegular text-[#9B9B9B]">
            Вы можете войти в аккаунт с новым паролем
          </p>

          <div className="mt-8">
            <Link
              href="/Login"
              className="block w-full text-center py-[2.5%] rounded-[5px] bg-[#5C6744] text-white
                         text-[clamp(0.875rem,0.7885rem+0.3846vw,1.25rem)] font-ManropeRegular
                         tracking-wide transition hover:opacity-90"
            >
              Войти
            </Link>
          </div>
        </div>
      </div>

      {/* Правая панель (изображение) */}
      <div className="relative hidden lg:block">
        <Image
          src="/images/login-side.png"
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
