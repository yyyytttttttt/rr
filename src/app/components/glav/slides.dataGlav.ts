import { Slide } from "../../types/GlavProps"

export const slides = [
  { id: 'hero', type: 'component', component: 'Fsection' },

  { id: 'news', type: 'sliderNews' },

  {
    id: 'center',
    type: 'slider2',
    desktop: {
      pos: 'left',
      title: ['Твой билет к особому', 'преображению '],
      lines: [
        'Мы создали Beauty-пропуск,',
        'чтобы ты могла заботиться о себе',
        'с удовольствием, без ',
        'ограничений и в своём ритме.',

      ],
      
      buttons: [
        { label: 'Перейти в раздел', variant: 'ghost', href: '/Propuski' },

      ],
    },
    
    mobile: {
      title: ['Твой билет к особому преображению '],
      text: [
        'Мы создали пропуск к здоровью, для заботы о себе',
        'с удовольствием ',
      ],

      buttons: [

        { label: 'Перейти в раздел', variant: 'ghost', href: '/Propuski' },
      ],
    },
    
  },

  {
    id: 'services',
    type: 'slider4' as const,
    desktop: {
      pos: 'left' as const,
      title: 'Наши услуги',
      lines: [
        'Широкий спектр профессиональных услуг',
        'для вашей красоты и здоровья',
      ],
      buttons: [
        { label: 'Смотреть все услуги', variant: 'ghost', href: '/Servic' },
      ],
    },
    mobile: {
      title: 'Наши услуги',
      text: [
        'Широкий спектр профессиональных услуг',
        'для вашей красоты и здоровья',
      ],
      buttons: [
        { label: 'Смотреть все', variant: 'ghost', href: '/Servic' },
      ],
    },
  },
  {
    id: 'app',
    type: 'slider5' as const,
    desktop: {
      pos: 'left' as const,
      title: 'Наши услуги',
      lines: [
        'Широкий спектр профессиональных услуг',
        'для вашей красоты и здоровья',
      ],
      buttons: [
        { label: 'Смотреть все услуги', variant: 'ghost', href: '/Servic' },
      ],
    },
    mobile: {
      title: 'Наши услуги',
      text: [
        'Широкий спектр профессиональных услуг',
        'для вашей красоты и здоровья',
      ],
      buttons: [
        { label: 'Смотреть все', variant: 'ghost', href: '/Servic' },
      ],
    },
  },
  {
    id: 'team',
    type: 'slider6' as const,
    desktop: {
      pos: 'left' as const,
      title: 'Галерея наших работ',
      lines: [
        'Видео результаты процедур,',
        'выполненных нашими специалистами. ',
        'Мы гордимся доверием наших клиентов',
        'и с радостью делимся их преображениями.'
      ],
      buttons: [
        { label: 'Перейти в раздел', variant: 'ghost', href: '/galery' },
      ],
    },
    mobile: {
      title: 'Наша команда',
      text: [
        'Профессиональные специалисты',
        'с многолетним опытом работы',
      ],
      buttons: [
        { label: 'Смотреть всех', variant: 'ghost', href: '/galery' },
      ],
    },
  },
  {
    id: 'news',
    type: 'static',
    images: {
      default: '/images/ULRTAHD2.png',
      xs: '/images/sk3.png',
      oneK: '/images/sk3.png',
      fourXL: '/images/sk3.png',
    },
    

    desktop: {
      pos: 'left',
      title: 'Личный кабинет',
      lines: [
        'Запись на приём, история процедур, персональные',
        'рекомендации, напоминания и дневник —     ',
        'всё в одном месте. На сайте и в приложении.',
        'Всегда под рукой.',

      ],
      buttons: [{ label: 'Перейти в раздел', variant: 'ghost', href: '/profile' }],

    },
    mobile: {
      title: 'Личный кабинет',
      text: [
        'Запись на приём, история процедур, ',
        'персональные рекомендации, ',
        'напоминания и дневник — всё в одном  ',
        'месте. На сайте и в приложении. Всегда ',
        'под рукой. '
      ],
      buttons: [{ label: 'Перейти в раздел', variant: 'ghost', href: '/profile' }],
    },
  },
  
  {
    id: 'news',
    type: 'static',
    images: {
      default: '/images/16pro.png',
      xs: '/images/sk.png',
      oneK: '/images/sk.png',
      fourXL: '/images/sk.png',
    },
    objectFit: 'object-contain md:object-cover',

    desktop: {
      pos: 'left',
      title: ['Новая Я —', 'в формате приложения'],
      lines: [
        'Мы создали приложение для удобной записи на',
        'прием и онлайн-оплаты. Доступно в App store',
        'и Google play',
      ],
      buttons: [{ label: 'Скачать на IOS', variant: 'primary', icon: 'apple', href: 'https://apps.apple.com' },{label:'Скачать на Android',variant:'ghost', icon: 'android', href: 'https://play.google.com'}],
      buttonsVertical: true,
    },
    mobile: {
      title: ['Новая Я —', 'в формате приложения'],
      text: [
        'Мы создали приложение для удобной записи на',
        'прием и онлайн-оплаты. Доступно в App store',
        'и Google play',
      ],
      buttons: [{ label: 'Скачать на IOS', variant: 'primary', icon: 'apple', href: 'https://apps.apple.com' },{ label: 'Скачать на Android', variant: 'ghost', icon: 'android', href: 'https://play.google.com' }],
      buttonsVertical: true,
    },

  },
] as const satisfies readonly Slide[];
