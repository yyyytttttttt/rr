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
      title: ['Ты — центр', 'этого пространства'],
      lines: [
        '«Новая Я» — это не просто эстетика и стиль',
        'Это сопровождение, поддержка и услуги,',
        'которые помогают выбрать себя заново.',
        'Запишись — не для того, чтобы изменить себя,',
        'а чтобы наконец-то услышать.',
      ],
      buttons: [
        { label: 'Выбрать услугу', variant: 'ghost' },
        { label: 'Написать в чат', variant: 'primary' },
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
] as const satisfies readonly Slide[];
