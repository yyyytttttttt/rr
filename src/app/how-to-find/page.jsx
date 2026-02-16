import LayoutOverlay3 from "../components/LayoutOverlay3";
import BottomNav from "../components/menus/BottomNav";
import YandexMap from "../components/how-to-find/YandexMap";

export default function HowToFindPage() {
  return (
    <LayoutOverlay3 title="Как нас найти">
      <main className="min-h-screen ">
        <div className="mx-auto max-w-[1920px] px-[4%] lg:px-[134px] pb-24">
          {/* Хлебные крошки */}
          <nav className="pt-[0%] text-[clamp(0.875rem,0.8077rem+0.2885vw,1.125rem)] text-[#636846] font-ManropeRegular">
            <ol className="flex items-center gap-2">
              <li>
                <a className="hover:text-[#967450] transition" href="/">
                  Главная
                </a>
              </li>
              <li className="opacity-60">›</li>
              <li className="text-[#4F5338]">Как нас найти</li>
            </ol>
          </nav>

          {/* Верхний блок: Контакты + Как добраться */}
          <section className="mt-6 sm:mt-10 grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-8">
            {/* Контакты (светлый блок) */}
            <div className="rounded-[22px] bg-[#EFEBE3] ring-1 ring-[#4F5338]/10 p-8 lg:p-10">
              <h1 className="text-[20px] sm:text-[28px] lg:text-[32px] font-ManropeSemiBold tracking-[-0.02em] text-[#2F2D28]">
                Контакты
              </h1>

              <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-10">
                {/* Адрес */}
                <div>
                  <div className="text-[16px] font-ManropeMedium text-[#2F2D28]">
                    Адрес
                  </div>
                  <div className="mt-2 text-[14px] leading-[1.5] font-ManropeRegular text-[#2F2D28]/65">
                    Московская область, <br />
                    г. Балашиха, ул. Белякова, 2В
                  </div>

                  <div className="mt-3 sm:mt-5 text-[16px] font-ManropeMedium text-[#2F2D28]">
                    Ориентир
                  </div>
                  <div className="mt-2 text-[14px] leading-[1.5] font-ManropeRegular text-[#2F2D28]/65">
                    Кирпичное здание <br />
                    с вывеской «Новая Я»
                  </div>
                </div>

                {/* Время работы */}
                <div>
                  <div className="mt-3 sm:mt-5 text-[16px] font-ManropeMedium text-[#2F2D28]">
                    Время работы
                  </div>
                  <div className="mt-2 text-[14px] leading-[1.6] font-ManropeRegular text-[#2F2D28]/65">
                    Пн–Пт <span className="ml-2">9:00–21:00</span>
                    <br />
                    Сб–Пт <span className="ml-2">Выходной</span>
                  </div>
                </div>
              </div>

              <div className="mt-3 sm:mt-10 grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-10">
                {/* Телефоны */}
                <div>
                  <div className=" text-[16px] font-ManropeMedium text-[#2F2D28]">
                    Телефоны
                  </div>

                  <div className="mt-2 space-y-1 text-[14px] font-ManropeRegular text-[#2F2D28]/65">
                    <a className="block hover:text-[#967450] transition" href="tel:+74732222409">
                      +7 (473) 222-24-09
                    </a>
                    <a className="block hover:text-[#967450] transition" href="tel:+79003008285">
                      +7 (900) 300-82-85
                    </a>
                  </div>
                </div>

                {/* Почта */}
                <div>
                  <div className="text-[16px] font-ManropeMedium text-[#2F2D28]">
                    Почта
                  </div>

                  <div className="mt-2 text-[14px] font-ManropeRegular text-[#2F2D28]/65">
                    <a className="hover:text-[#967450] transition" href="mailto:novayaya@mail.com">
                      novayaya@mail.com
                    </a>
                  </div>
                </div>
              </div>
            </div>

            {/* Как добраться (тёмный блок) */}
            <div className="rounded-[22px] bg-[#4F5338] p-8 lg:p-10 text-[#F5F0E4]">
              <h2 className="text-[20px] sm:text-[28px] lg:text-[32px] font-ManropeSemiBold tracking-[-0.02em]">
                Как добраться
              </h2>

              <div className="mt-6 space-y-6">
                <div>
                  <div className="text-[16px] font-ManropeMedium">
                    На общественном транспорте
                  </div>
                  <ol className="mt-2 space-y-1 text-[14px] leading-[1.55] font-ManropeRegular text-[#F5F0E4]/85">
                    <li>1. От м. Щёлковская — 15–20 мин</li>
                    <li>2. От м. Новокосино — аналогично</li>
                    <li>3. От остановки — 3–5 минут пешком по прямой дороге</li>
                  </ol>
                </div>

                <div>
                  <div className="text-[16px] font-ManropeMedium">На автомобиле</div>
                  <div className="mt-2 text-[14px] leading-[1.55] font-ManropeRegular text-[#F5F0E4]/85">
                    Съезд с Горьковского или Щёлковского шоссе по указателю на Белякова, 2В.
                    <br />
                    Здание видно с дороги, подъезд удобный.
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Карта */}
          <section className="mt-5 sm:mt-10">
            <YandexMap
              center={[55.796289, 37.938474]}
              zoom={13}
              placemarkText="Балашиха"
              hint="Новая Я — здесь"
            />
          </section>
        </div>
      </main>

      <BottomNav />
    </LayoutOverlay3>
  );
}
