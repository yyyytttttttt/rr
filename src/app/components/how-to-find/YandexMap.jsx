"use client";

import { useEffect, useRef, useState } from "react";

const SCRIPT_ID = "ymaps-script";

function parseCoords(input) {
  if (Array.isArray(input) && input.length === 2) return input;

  if (typeof input === "string") {
    const parts = input.split(",").map((s) => Number(s.trim()));
    if (parts.length === 2 && parts.every((n) => Number.isFinite(n))) return parts;
  }

  return null;
}

function isTouchDevice() {
  if (typeof window === "undefined") return false;
  return (
    "ontouchstart" in window ||
    navigator.maxTouchPoints > 0 ||
    navigator.msMaxTouchPoints > 0
  );
}

export default function YandexMap({
  coords = "55.801020, 37.967583",
  zoom = 16,
  className = "",
  placemarkText = "ул. Белякова, 2В",
  hint = "Новая Я — здесь",
}) {
  const mapHostRef = useRef(null);
  const instanceRef = useRef({ map: null, placemark: null, coords: null });
  const [error, setError] = useState("");

  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_YMAPS_KEY;
    if (!key) {
      setError("Нет NEXT_PUBLIC_YMAPS_KEY в .env.local");
      return;
    }

    const c = parseCoords(coords);
    if (!c) {
      setError("Неверные координаты. Нужно: '55.801020, 37.967583' или [55.80102, 37.967583]");
      return;
    }

    const init = () => {
      if (!window.ymaps || !mapHostRef.current) return;

      window.ymaps.ready(() => {
        if (instanceRef.current.map) return;

        try {
          const map = new window.ymaps.Map(
            mapHostRef.current,
            {
              center: c,
              zoom,
              controls: [],
            },
            {
              suppressMapOpenBlock: true,
            }
          );

          // ✅ колесо мыши: включаем на десктопе, отключаем на touch (чтобы не ломать скролл)
          if (isTouchDevice()) {
            map.behaviors.disable("scrollZoom");
          } else {
            map.behaviors.enable("scrollZoom");
          }

          // ✅ Кастомная HTML-метка (цвета из твоей палитры)
          const markerHTML = `
            <div style="
              position: relative;
              width: 44px;
              height: 44px;
              border-radius: 999px;
              background: rgba(245,240,228,0.92);
              border: 2px solid rgba(79,83,56,0.65);
              box-shadow: 0 14px 30px rgba(0,0,0,0.18);
              display:flex;
              align-items:center;
              justify-content:center;
            ">
              <div style="
                width: 14px;
                height: 14px;
                border-radius: 999px;
                background: #967450;
                box-shadow: 0 10px 22px rgba(150,116,80,0.35);
              "></div>

              <div style="
                position:absolute;
                left:50%;
                bottom:-12px;
                transform: translateX(-50%);
                width: 18px;
                height: 18px;
                background: rgba(245,240,228,0.92);
                border-right: 2px solid rgba(79,83,56,0.65);
                border-bottom: 2px solid rgba(79,83,56,0.65);
                transform: translateX(-50%) rotate(45deg);
                border-bottom-right-radius: 6px;
                box-shadow: 0 14px 30px rgba(0,0,0,0.10);
              "></div>
            </div>
          `;

          const placemark = new window.ymaps.Placemark(
            c,
            {
              hintContent: hint,
              balloonContent: `
                <div style="font-family: Manrope, sans-serif;">
                  <div style="font-weight: 600; font-size: 14px; color:#2F2D28;">${placemarkText}</div>
                  <div style="margin-top:6px; font-size: 12px; color:rgba(47,45,40,0.65);">${hint}</div>
                </div>
              `,
            },
            {
              // HTML layout
              iconLayout: "default#imageWithContent",
              iconImageHref:
                "data:image/gif;base64,R0lGODlhAQABAAAAACw=", // прозрачный пиксель
              iconImageSize: [44, 44],
              iconImageOffset: [-22, -44], // чтобы “носик” попадал в точку
              iconContentLayout: window.ymaps.templateLayoutFactory.createClass(markerHTML),
              // хитбокс по метке
              iconShape: {
                type: "Rectangle",
                coordinates: [
                  [-22, -44],
                  [22, 10],
                ],
              },
              // ✅ убираем дефолтную подпись-капшен (мы сделаем свою рядом)
              hideIconOnBalloonOpen: false,
              openBalloonOnClick: true,
            }
          );

          map.geoObjects.add(placemark);

          instanceRef.current = { map, placemark, coords: c };
        } catch (e) {
          setError("Ошибка инициализации карты");
        }
      });
    };

    if (document.getElementById(SCRIPT_ID)) {
      init();
      return;
    }

    const script = document.createElement("script");
    script.id = SCRIPT_ID;
    script.async = true;
    script.src = `https://api-maps.yandex.ru/2.1/?apikey=${key}&lang=ru_RU`;
    script.onload = init;
    script.onerror = () => setError("Не удалось загрузить Яндекс.Карты");
    document.body.appendChild(script);

    return () => {
      if (instanceRef.current.map) {
        instanceRef.current.map.destroy();
        instanceRef.current.map = null;
        instanceRef.current.placemark = null;
        instanceRef.current.coords = null;
      }
    };
  }, [coords, zoom, placemarkText, hint]);

  const openRoute = () => {
    const c = instanceRef.current.coords || parseCoords(coords);
    if (!c) return;
    const [lat, lon] = c;
    window.open(`https://yandex.ru/maps/?rtext=~${lat},${lon}&rtt=auto`, "_blank");
  };

  const zoomIn = () => {
    const map = instanceRef.current.map;
    if (!map) return;
    map.setZoom(map.getZoom() + 1, { duration: 160 });
  };

  const zoomOut = () => {
    const map = instanceRef.current.map;
    if (!map) return;
    map.setZoom(map.getZoom() - 1, { duration: 160 });
  };

  if (error) {
    return (
      <div className={["rounded-[22px] bg-[#EFEBE3] ring-1 ring-[#4F5338]/10 p-6", className].join(" ")}>
        <div className="text-[16px] font-ManropeMedium text-[#2F2D28]">Карта временно недоступна</div>
        <div className="mt-2 text-[14px] font-ManropeRegular text-[#2F2D28]/60">{error}</div>
      </div>
    );
  }

  return (
    <div
      className={[
        "relative overflow-hidden rounded-[22px]",
        "ring-1 ring-[#4F5338]/10",
        "shadow-[0_24px_60px_rgba(0,0,0,0.06)]",
        "bg-white/40",
        "h-[50vh] min-h-[280px] sm:h-[420px] lg:h-[520px]",
        className,
      ].join(" ")}
    >
      <div ref={mapHostRef} className="absolute inset-0" />
      <div className="pointer-events-none absolute inset-0 bg-[#F5F0E4]/10" />

      {/* Построить маршрут */}
      <div className="absolute left-5 bottom-5 z-10">
        <button
          type="button"
          onClick={openRoute}
          className={[
            "h-11 px-5 rounded-xl md:rounded-2xl",
            "bg-[#4F5338] text-[#F5F0E4]",
            "text-[14px] font-ManropeMedium",
            "shadow-[0_12px_30px_rgba(0,0,0,0.18)]",
            "hover:opacity-95 transition",
            "active:scale-[0.99]",
          ].join(" ")}
        >
          Построить маршрут
        </button>
      </div>

      {/* Zoom контролы */}
      <div className="absolute right-5 top-1/2 -translate-y-1/2 z-10 flex flex-col overflow-hidden rounded-2xl ring-1 ring-[#4F5338]/12 bg-white/85 backdrop-blur">
        <button
          type="button"
          onClick={zoomIn}
          className="h-11 w-11 grid place-items-center hover:bg-[#EFEBE3] transition"
          aria-label="Приблизить"
        >
          <span className="text-[20px] leading-none text-[#2F2D28]">+</span>
        </button>
        <div className="h-[1px] bg-[#4F5338]/10" />
        <button
          type="button"
          onClick={zoomOut}
          className="h-11 w-11 grid place-items-center hover:bg-[#EFEBE3] transition"
          aria-label="Отдалить"
        >
          <span className="text-[22px] leading-none text-[#2F2D28]">−</span>
        </button>
      </div>

      {/* Небольшой лейбл адреса (как аккуратная подпись) */}
      <div className="absolute left-5 top-5 z-10 rounded-xl bg-white/80 backdrop-blur px-4 py-2 ring-1 ring-[#4F5338]/10">
        <div className="text-[13px] font-ManropeSemiBold text-[#2F2D28]">{placemarkText}</div>
        <div className="text-[12px] font-ManropeRegular text-[#2F2D28]/55">55.801020, 37.967583</div>
      </div>
    </div>
  );
}
