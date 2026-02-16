import type { Metadata } from 'next';
import BusinessCardClient from './BusinessCardClient';

export const metadata: Metadata = {
  title: 'Электронная визитка — Новая Я',
  description: 'Сохраните контакты клиники Новая Я в телефон или поделитесь с друзьями',
};

export default function BusinessCardPage() {
  return <BusinessCardClient />;
}
