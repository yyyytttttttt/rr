// scripts/add-more-categories.js
// Скрипт для добавления дополнительных категорий и услуг
// Использование: node scripts/add-more-categories.js

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Добавление дополнительных категорий и услуг...\n');

  // Категория 1: Массаж
  console.log('📁 Создание категории "Массаж"...');
  const massageCategory = await prisma.serviceCategory.upsert({
    where: { id: 'category-massage' },
    update: {},
    create: {
      id: 'category-massage',
      name: 'Массаж',
      description: 'Различные виды массажа',
      icon: '💆‍♀️',
      sortOrder: 2,
      isActive: true,
    },
  });
  console.log(`✅ ${massageCategory.name}\n`);

  // Услуги для массажа
  await prisma.service.upsert({
    where: { id: 'service-massage-1' },
    update: {},
    create: {
      id: 'service-massage-1',
      categoryId: massageCategory.id,
      name: 'Классический массаж спины',
      description: 'Расслабляющий массаж спины и плеч',
      priceCents: 300000, // 3000 рублей
      currency: 'RUB',
      durationMin: 60,
      isActive: true,
    },
  });

  await prisma.service.upsert({
    where: { id: 'service-massage-2' },
    update: {},
    create: {
      id: 'service-massage-2',
      categoryId: massageCategory.id,
      name: 'Массаж всего тела',
      description: 'Полный массаж всего тела',
      priceCents: 500000, // 5000 рублей
      currency: 'RUB',
      durationMin: 90,
      isActive: true,
    },
  });

  // Категория 2: Ногтевой сервис
  console.log('📁 Создание категории "Маникюр и педикюр"...');
  const nailsCategory = await prisma.serviceCategory.upsert({
    where: { id: 'category-nails' },
    update: {},
    create: {
      id: 'category-nails',
      name: 'Маникюр и педикюр',
      description: 'Услуги по уходу за ногтями',
      icon: '💅',
      sortOrder: 3,
      isActive: true,
    },
  });
  console.log(`✅ ${nailsCategory.name}\n`);

  // Услуги для ногтей
  await prisma.service.upsert({
    where: { id: 'service-nails-1' },
    update: {},
    create: {
      id: 'service-nails-1',
      categoryId: nailsCategory.id,
      name: 'Маникюр с покрытием',
      description: 'Маникюр с покрытием гель-лаком',
      priceCents: 200000, // 2000 рублей
      currency: 'RUB',
      durationMin: 60,
      isActive: true,
    },
  });

  await prisma.service.upsert({
    where: { id: 'service-nails-2' },
    update: {},
    create: {
      id: 'service-nails-2',
      categoryId: nailsCategory.id,
      name: 'Педикюр с покрытием',
      description: 'Педикюр с покрытием гель-лаком',
      priceCents: 250000, // 2500 рублей
      currency: 'RUB',
      durationMin: 90,
      isActive: true,
    },
  });

  // Категория 3: Парикмахерские услуги
  console.log('📁 Создание категории "Парикмахерские услуги"...');
  const hairCategory = await prisma.serviceCategory.upsert({
    where: { id: 'category-hair' },
    update: {},
    create: {
      id: 'category-hair',
      name: 'Парикмахерские услуги',
      description: 'Стрижки, окрашивание, укладки',
      icon: '💇',
      sortOrder: 4,
      isActive: true,
    },
  });
  console.log(`✅ ${hairCategory.name}\n`);

  // Услуги для волос
  await prisma.service.upsert({
    where: { id: 'service-hair-1' },
    update: {},
    create: {
      id: 'service-hair-1',
      categoryId: hairCategory.id,
      name: 'Женская стрижка',
      description: 'Стрижка любой сложности',
      priceCents: 150000, // 1500 рублей
      currency: 'RUB',
      durationMin: 45,
      isActive: true,
    },
  });

  await prisma.service.upsert({
    where: { id: 'service-hair-2' },
    update: {},
    create: {
      id: 'service-hair-2',
      categoryId: hairCategory.id,
      name: 'Окрашивание волос',
      description: 'Окрашивание в один тон',
      priceCents: 400000, // 4000 рублей
      currency: 'RUB',
      durationMin: 120,
      isActive: true,
    },
  });

  await prisma.service.upsert({
    where: { id: 'service-hair-3' },
    update: {},
    create: {
      id: 'service-hair-3',
      categoryId: hairCategory.id,
      name: 'Укладка',
      description: 'Профессиональная укладка волос',
      priceCents: 120000, // 1200 рублей
      currency: 'RUB',
      durationMin: 30,
      isActive: true,
    },
  });

  // Связываем все новые услуги с нашим врачом
  console.log('🔗 Связывание услуг с врачом...');

  // Находим врача
  const doctor = await prisma.doctor.findFirst({
    where: {
      user: {
        email: 'doctor@test.com'
      }
    }
  });

  if (doctor) {
    const serviceIds = [
      'service-massage-1', 'service-massage-2',
      'service-nails-1', 'service-nails-2',
      'service-hair-1', 'service-hair-2', 'service-hair-3'
    ];

    for (const serviceId of serviceIds) {
      await prisma.doctorService.upsert({
        where: {
          doctorId_serviceId: {
            doctorId: doctor.id,
            serviceId: serviceId,
          },
        },
        update: {},
        create: {
          doctorId: doctor.id,
          serviceId: serviceId,
          isActive: true,
        },
      });
    }
    console.log(`✅ Все услуги связаны с врачом\n`);
  }

  console.log('🎉 Готово!\n');
  console.log('📋 Добавлено:');
  console.log('   • Массаж (2 услуги)');
  console.log('   • Маникюр и педикюр (2 услуги)');
  console.log('   • Парикмахерские услуги (3 услуги)');
  console.log('\n💡 Всего теперь 4 категории и 10 услуг!\n');
}

main()
  .catch((e) => {
    console.error('❌ Ошибка:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
