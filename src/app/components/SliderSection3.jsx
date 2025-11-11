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
export default function StaticSection3({ src = '', images, alt = '', children }) {
  const useResponsiveImage = !!images
  const vh100 = useVh100()

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
        // Адаптивные изображения с кастомными брейкпоинтами
        <picture className="absolute inset-0 block">
          {/* Порядок: от самых больших к меньшим */}
          {images.fourXL && (
            <source media="(min-width: 1930px)" srcSet={images.fourXL} />
          )}
          {images.oneK && (
            <source media="(min-width: 1000px)" srcSet={images.oneK} />
          )}
          {images.xs && <source media="(min-width: 480px)" srcSet={images.xs} />}

          {/* Fallback: default или src */}
          {/* Использую next/image для оптимизаций, но внутри picture — обычный img: 
              next/image не должен быть дочерним <picture>/<source>. */}
          <img
            src={images.default || src}
            alt={alt}
            loading="lazy"
            className="absolute inset-0 h-full w-full object-cover"
          />
        </picture>
      ) : (
        // Обычное одиночное изображение (если не видео и нет images)
        <img
          src={src}
          alt={alt}
          loading="lazy"
          className="absolute inset-0 h-full w-full object-cover"
        />
      )}

      {/* Overlay-слой */}
      {children && (
        <div className=" absolute  inset-0">{children}</div>
      )}

      
    </div>
  )
}
