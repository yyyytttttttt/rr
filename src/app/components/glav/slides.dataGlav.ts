import { Slide } from "../../types/GlavProps"

export const slides = [
  { id: 'hero', type: 'component', component: 'Fsection' },

  {
    id: 'news',
    type: 'static',
    images: {
      default: '/images/sl2.png',
      xs: '/images/mobile2.png',
      oneK: '/images/hero-1k.png',
      fourXL: '/images/sl2.png',
    },
   
    desktop: {
      pos: 'left',
      title: 'Новости клиники',
      lines: [
        'Мы не просто ведём соцсети —',
        'мы создаём пространство, где вы',
        'можете читать, вдохновляться,',
        'выбирать и чувствовать себя',
        'частью чего-то настоящего.',
      ],
      buttons: [{ label: 'Перейти в раздел', variant: 'ghost' }],
      
    },
    mobile: {
      title: 'Новости клиники',
      text: [
        'Мы не просто ведём соцсети — мы создаём ',
        'пространство, где вы можете читать, вдохновляться, ',
        'выбирать и чувствовать себя частью чего-то ',
        'настоящего.',
      ],
      buttons: [{ label: 'Перейти в раздел', variant: 'ghost' }],
    },
  },

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
        { label: 'Перейти в раздел', variant: 'ghost' },

      ],
    },
    mobile: {
      title: ['Твой билет к особому преображению '],
      text: [
        'Мы создали пропуск к здоровью, для заботы о себе',
        'с удовольствием ',
      ],

      buttons: [

        { label: 'Перейти в раздел', variant: 'ghost' },
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
        { label: 'Смотреть все услуги', variant: 'ghost' },
      ],
    },
    mobile: {
      title: 'Наши услуги',
      text: [
        'Широкий спектр профессиональных услуг',
        'для вашей красоты и здоровья',
      ],
      buttons: [
        { label: 'Смотреть все', variant: 'ghost' },
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
        { label: 'Смотреть все услуги', variant: 'ghost' },
      ],
    },
    mobile: {
      title: 'Наши услуги',
      text: [
        'Широкий спектр профессиональных услуг',
        'для вашей красоты и здоровья',
      ],
      buttons: [
        { label: 'Смотреть все', variant: 'ghost' },
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
        { label: 'Перейти в раздел', variant: 'ghost' },
      ],
    },
    mobile: {
      title: 'Наша команда',
      text: [
        'Профессиональные специалисты',
        'с многолетним опытом работы',
      ],
      buttons: [
        { label: 'Смотреть всех', variant: 'ghost' },
      ],
    },
  },
  {
    id: 'news',
    type: 'static',
    images: {
      default: '/images/sl1000.png',
      xs: '/images/sl1000.png',
      oneK: '/images/sl1000.png',
      fourXL: '/images/sl1000.png',
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
      buttons: [{ label: 'Перейти в раздел', variant: 'ghost' }],
      
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
      buttons: [{ label: 'Перейти в раздел', variant: 'ghost' }],
    },
  },
  {
    id: 'news',
    type: 'static',
    images: {
      default: '/images/sl901.png',
      xs: '/images/sl90.png',
      oneK: '/images/sl90.png',
      fourXL: '/images/sl90.png',
    },

    desktop: {
      pos: 'left',
      title: ['Контакты и адрес —', 'в одном месте'],
      lines: [
        'Мы сделали электронную визитку,',
        'которую удобно сохранить',
        'и легко отправить.',
      ],
      buttons: [{ label: 'Скачать', variant: 'ghost' },{label:'Перейти в раздел',variant:'primary'}],

    },
    mobile: {
      title: ['Контакты — одним касанием'],
      text: [
        'Мы сделали электронную визитку, ',
        'которую удобно сохранить и легко  ',
        'отправить.  ',

      ],
      buttons: [{ label: 'Перейти в раздел', variant: 'ghost' },],
    },

  },
  {
    id: 'news',
    type: 'static',
    images: {
      default: '/images/sl902.png',
      xs: '/images/sl902.png',
      oneK: '/images/sl902.png',
      fourXL: '/images/sl902.png',
    },

    desktop: {
      pos: 'left',
      title: ['Новая Я —', 'в формате приложения'],
      lines: [
        'Мы создали приложение для удобной записи на',
        'прием и онлайн-оплаты. Доступно в App store',
        'и Google play',
      ],
      buttons: [{ label: 'Скачать на IOS', variant: 'primary', icon: 'apple' },{label:'Скачать на Android',variant:'ghost', icon: 'android'}],
      buttonsVertical: true,
    },
    mobile: {
      title: ['Новая Я —', 'в формате приложения'],
      text: [
        'Мы создали приложение для удобной записи на',
        'прием и онлайн-оплаты. Доступно в App store',
        'и Google play',
      ],
      buttons: [{ label: 'Скачать на IOS', variant: 'primary', icon: 'apple' },{ label: 'Скачать на Android', variant: 'ghost', icon: 'android' }],
      buttonsVertical: true,
    },
    
  },
] as const satisfies readonly Slide[];
