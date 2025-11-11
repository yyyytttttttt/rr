const btnsGift = [
  { label: 'Узнать подробнее', variant: 'primary' },
  { label: 'Написать в чат',   variant: 'ghost'   },
]

export const slides = [
  {
    media: { desktop: '/video/sl2.mp4', mobile: '/images/mobile1.png' },
    title: 'Подарок ко дню рождения',
    lines: [
      'Твой месяц — твои подарки',
      'Мы подготовили для тебя особые сюрпризы, чтобы этот',
      'период был наполнен заботой и радостью.',
    ],
    buttons: btnsGift,
  },
  {
    media: { desktop: '/video/ad.mp4', mobile: '/video/ad.mp4' },
    title: 'Сила природы',
    lines: [
      'Мы используем только естественные компоненты,',
      'чтобы каждая процедура наполняла',
      'тебя свежестью и гармонией.',
    ],
    buttons: [
      { label: 'Узнать подробнее', variant: 'primary' },
      { label: 'Написать в чат',   variant: 'ghost'   },
    ],
  },
  {
    media: { desktop: '/images/sl20.png', mobile: '/images/mobile2.png' },
    title: ['Ты — центр', 'этого пространства'],
    lines: [
      '«Новая Я» — это не просто эстетика и стиль.',
      'Сопровождение, поддержка и услуги, которые помогают',
      'выбрать себя заново…',
    ],
    buttons: [
      { label: 'Выбрать услугу', variant: 'primary' },
      { label: 'Написать в чат', variant: 'ghost'   },
    ],
  },
]
