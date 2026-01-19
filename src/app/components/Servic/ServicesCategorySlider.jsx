"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation } from "swiper/modules";

import "swiper/css";
import "swiper/css/navigation";

function CheckBadge() {
  return (
    <div className="absolute right-3 top-3 grid h-7 w-7 place-items-center rounded-full bg-white z-10">
      <svg width="12" height="9" viewBox="0 0 14 10" fill="none">
        <path
          d="M1 5L5 9L13 1"
          stroke="#636846"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}

function Monogram() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="149" height="224" viewBox="0 0 149 224" fill="none">
<path d="M0.1214 112.098C0.1214 99.9643 -0.18696 87.8304 0.179217 75.7157C1.16211 43.4482 16.4645 19.9269 45.7779 6.28113C76.8838 -8.1876 113.444 3.06586 134.605 32.5775C143.971 45.6491 148.712 60.271 148.847 76.2325C149.04 99.9643 149.04 123.696 148.905 147.428C148.674 182.356 125.258 212.958 92.3403 221.685C52.5233 232.231 10.278 205.628 1.97156 164.557C0.718847 158.413 0.35267 152.021 0.19849 145.725C-0.0713253 134.528 0.1214 123.313 0.1214 112.098ZM144.588 112.156C144.588 112.156 144.646 112.156 144.684 112.156C144.684 100.156 144.684 88.1749 144.684 76.1751C144.684 62.2422 140.772 49.4959 133.237 37.7257C116.739 11.9653 86.3465 -0.838402 58.1509 6.24286C27.0836 14.0514 4.3228 43.008 4.09153 75.3713C3.91808 98.5672 3.93735 121.763 4.11081 144.94C4.14935 150.835 4.66971 156.787 5.69115 162.605C11.974 198.298 47.8208 224.422 83.3786 219.408C116.2 214.776 143.567 184.652 144.511 151.677C144.896 138.509 144.569 125.323 144.569 112.156H144.588Z" fill="#F5F0E4"/>
<path d="M74.3397 122.593C68.4808 122.593 64.106 118.249 64.0096 112.354C63.9325 106.632 68.4616 102.058 74.2819 102C80.0443 101.943 84.5734 106.459 84.5734 112.278C84.5734 118.115 80.16 122.574 74.3397 122.593Z" fill="#F5F0E4"/>
<path d="M103.827 112.825C96.3683 126.337 84.8048 133.055 69.4061 133.973C56.3393 134.758 44.2169 132.729 34.4651 123.218C28.3557 117.266 25.5034 109.553 23.9808 101.457C21.3405 87.3712 21.2634 73.2852 27.4499 59.9839C43.658 25.1326 83.4558 25.8408 103.981 40.7114C116.026 49.4386 120.074 72.29 100.647 81.4765C93.6316 84.7875 86.1346 87.2372 78.6954 89.4955C65.224 93.5721 54.2579 101.323 44.4482 111.046C42.7908 112.691 43.2726 113.859 44.2169 115.486C50.7889 126.777 65.8214 132.308 79.2929 128.232C87.9655 125.61 94.6916 121.208 99.0279 116.806C99.6447 116.136 102.324 113.629 103.846 112.825H103.827ZM41.6537 110.835C51.6369 99.1031 63.74 92.4811 76.4406 86.6822C83.9376 83.2564 90.8949 78.9119 95.8865 72.0795C103.518 61.6107 102.285 50.3572 92.5331 41.8789C77.4813 28.7881 54.971 32.6732 45.566 50.5678C35.5829 69.5532 36.4116 89.5338 41.6537 110.854V110.835Z" fill="#F5F0E4"/>
<path d="M101.688 108.481C95.6552 102.089 88.5244 98.0122 79.8132 96.6342C79.2929 96.5577 78.7918 96.4046 78.2907 96.2514C78.1944 96.2323 78.1365 96.0601 78.0787 95.9644C101.013 91.0075 124.718 107.869 128.245 131.658C129.594 140.729 129.902 149.801 127.127 158.681C120.555 179.657 105.272 190.738 84.323 194.7C70.0999 197.399 56.2815 195.446 43.4846 188.327C28.4135 179.925 20.8394 164.959 22.7859 147.887C24.1157 136.289 26.1201 130.012 30.6877 123.237C32.8269 125.265 35.1782 127.103 36.9705 129.399C37.7029 130.337 37.4908 132.308 37.2018 133.686C34.7156 145.571 35.0625 157.265 39.6494 168.633C45.9129 184.155 58.1124 191.504 74.3977 191.619C90.1626 191.734 102.227 184.384 108.221 169.743C115.641 151.677 116.547 134.165 107.045 116.385C106.448 115.275 103.904 110.816 101.668 108.462L101.688 108.481Z" fill="#F5F0E4"/>
</svg>
  );
}

export default function ServicesCategorySlider({
  categories = [],
  activeId,
  onSelect,
}) {
  const prevRef = useRef(null);
  const nextRef = useRef(null);
  const [progress, setProgress] = useState(0);

  return (
    <div className="mt-6 relative">
      {/* Swiper */}
      <Swiper
        modules={[Navigation]}
        spaceBetween={16}
        slidesPerView={2}
        speed={500}
        breakpoints={{
          320: { slidesPerView: 1.5, spaceBetween: 16 },
          480: { slidesPerView: 2.5, spaceBetween: 16 },
          640: { slidesPerView: 3, spaceBetween: 16 },
          1024: { slidesPerView: 4, spaceBetween: 20 },
          1280: { slidesPerView: 5, spaceBetween: 20 },
        }}
        onBeforeInit={(sw) => {
          sw.params.navigation = {
            prevEl: prevRef.current,
            nextEl: nextRef.current,
          };
        }}
        onInit={(sw) => {
          sw.navigation.init();
          sw.navigation.update();
        }}
        onProgress={(sw, p) => setProgress(p)}
        className="services-category-slider"
      >
        {categories.map((cat) => {
          const isActive = cat.id === activeId;

          return (
            <SwiperSlide key={cat.id}>
              <button
                type="button"
                onClick={() => onSelect?.(cat.id)}
                className="relative w-full aspect-[3/5] md:aspect-[4/5] overflow-hidden rounded-2xl text-left transition-transform duration-200 hover:scale-[1.02]"
              >
                {/* Галочка на активной карточке */}
                {isActive && <CheckBadge />}

                {cat.variant === "all" ? (
                  <div className="h-full w-full bg-[#636846] relative">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Monogram />
                    </div>
                    <div className="absolute bottom-4 left-4 text-[16px] lg:text-[18px] font-[Manrope-SemiBold] text-white">
                      Смотреть все
                    </div>
                  </div>
                ) : (
                  <div className="relative h-full w-full">
                    <Image
                      src={cat.image}
                      alt={cat.title.replace("\n", " ")}
                      fill
                      sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
                      className="object-cover"
                    />
                    <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/60 to-transparent" />
                    <div className="absolute bottom-4 left-4 right-4 text-[16px] lg:text-[18px] font-[Manrope-SemiBold] leading-[1.2] text-white whitespace-pre-line">
                      {cat.title}
                    </div>
                  </div>
                )}
              </button>
            </SwiperSlide>
          );
        })}
      </Swiper>

      {/* Прогресс-бар */}
      <div className="mt-6">
        <div className="relative h-[6px] w-full rounded-full bg-[#D9D4C9]">
          <div
            className="absolute top-0 h-[6px] rounded-full bg-[#636846] transition-all duration-300"
            style={{
              width: "40%",
              left: `${progress * 60}%`,
            }}
          />
        </div>
      </div>

      {/* Скрытые кнопки навигации (для ref) */}
      <button ref={prevRef} className="hidden" aria-label="Prev" />
      <button ref={nextRef} className="hidden" aria-label="Next" />
    </div>
  );
}
