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
] as const satisfies readonly Slide[];
