'use client'
import React from 'react'
import Image from 'next/image'
import StaticNav from './menus/StaticNav'
const isVideo = (src) => /\.(mp4|webm|ogg)$/i.test(src)
import { useVh100 } from '../hooks/useVh100'

/**
 * props:
 *  - src: string               // базовый src (видео или изображение)
 *  - images?: {                // (опционально) разные изображения по брейкпоинтам
 *      xs?: string,            // >= 480px
 *      oneK?: string,          // >= 1000px
 *      fourXL?: string,        // >= 1930px
 *      default?: string        // < 480px и как fallback
 *    }
 *  - alt?: string              // alt для изображения
 *  - children?: ReactNode      // оверлеи
 */
export default function StaticSection3({ src = '', images, alt = '', objectFit = 'object-cover', children }) {
  const useResponsiveImage = !!images
  const vh100 = useVh100()

  // Выбираем лучшую картинку для мобилки (default) с учётом Retina
  const mobileSrc = images?.default || src
  const tabletSrc = images?.xs || mobileSrc
  const desktopSrc = images?.oneK || tabletSrc
  const largeSrc = images?.fourXL || desktopSrc

  return (
    <div
     className="relative overflow-hidden h-app flex-none w-screen">
      {/* Бэкграунд: Видео или Картинка */}
      {isVideo(src) && !useResponsiveImage ? (
        <video
          className="absolute inset-0 h-full w-full object-cover"
          muted
          playsInline
          autoPlay
          loop
          preload="metadata"
        >
          <source
            src={src}
            type={
              src.toLowerCase().endsWith('.webm')
                ? 'video/webm'
                : src.toLowerCase().endsWith('.ogg')
                ? 'video/ogg'
                : 'video/mp4'
            }
          />
        </video>
      ) : useResponsiveImage ? (
        // Адаптивные изображения с Next.js Image для Retina качества
        <>
          {/* Mobile < 480px */}
          <div className="absolute inset-0 block xs:hidden">
            <Image
              src={mobileSrc}
              alt={alt}
              fill
              priority={false}
              quality={100}
              sizes="100vw"
              className={objectFit}
            />
          </div>
          {/* Tablet 480px - 999px */}
          <div className="absolute inset-0 hidden xs:block 1k:hidden">
            <Image
              src={tabletSrc}
              alt={alt}
              fill
              priority={false}
              quality={100}
              sizes="100vw"
              className={objectFit}
            />
          </div>
          {/* Desktop 1000px - 1929px */}
          <div className="absolute inset-0 hidden 1k:block 4xl:hidden">
            <Image
              src={desktopSrc}
              alt={alt}
              fill
              priority={false}
              quality={100}
              sizes="100vw"
              className={objectFit}
            />
          </div>
          {/* Large 1930px+ */}
          <div className="absolute inset-0 hidden 4xl:block">
            <Image
              src={largeSrc}
              alt={alt}
              fill
              priority={false}
              quality={100}
              sizes="100vw"
              className={objectFit}
            />
          </div>
        </>
      ) : (
        // Обычное одиночное изображение
        <Image
          src={src}
          alt={alt}
          fill
          priority={false}
          quality={100}
          sizes="100vw"
          className="object-cover"
        />
      )}

      {/* Overlay-слой */}
      {children && (
        <div className=" absolute  inset-0">{children}</div>
      )}


    </div>
  )
}
