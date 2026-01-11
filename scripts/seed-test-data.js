// scripts/seed-test-data.js
// Скрипт для заполнения БД тестовыми данными
// Использование: node scripts/seed-test-data.js

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Начинаем заполнение БД тестовыми данными...\n');

  // 1. Создаем категорию услуг
  console.log('📁 Создание категории услуг...');
  const category = await prisma.serviceCategory.upsert({
    where: { id: 'test-category-1' },
    update: {},
    create: {
      id: 'test-category-1',
      name: 'Косметология',
      description: 'Косметологические процедуры',
      icon: '💆',
      sortOrder: 1,
      isActive: true,
    },
  });
  console.log(`✅ Категория создана: ${category.name}\n`);

  // 2. Создаем услуги
  console.log('💼 Создание услуг...');
  const service1 = await prisma.service.upsert({
    where: { id: 'test-service-1' },
    update: {},
    create: {
      id: 'test-service-1',
      categoryId: category.id,
      name: 'Чистка лица',
      description: 'Профессиональная чистка лица',
      priceCents: 250000, // 2500 рублей
      currency: 'RUB',
      durationMin: 60,
      isActive: true,
    },
  });

  const service2 = await prisma.service.upsert({
    where: { id: 'test-service-2' },
    update: {},
    create: {
      id: 'test-service-2',
      categoryId: category.id,
      name: 'Массаж лица',
      description: 'Расслабляющий массаж лица',
      priceCents: 180000, // 1800 рублей
      currency: 'RUB',
      durationMin: 45,
      isActive: true,
    },
  });

  const service3 = await prisma.service.upsert({
    where: { id: 'test-service-3' },
    update: {},
    create: {
      id: 'test-service-3',
      categoryId: category.id,
      name: 'Пилинг',
      description: 'Химический пилинг лица',
      priceCents: 350000, // 3500 рублей
      currency: 'RUB',
      durationMin: 90,
      isActive: true,
    },
  });

  console.log(`✅ Услуга 1: ${service1.name} - ${service1.priceCents / 100} ${service1.currency}`);
  console.log(`✅ Услуга 2: ${service2.name} - ${service2.priceCents / 100} ${service2.currency}`);
  console.log(`✅ Услуга 3: ${service3.name} - ${service3.priceCents / 100} ${service3.currency}\n`);

  // 3. Создаем пользователя-врача
  console.log('👨‍⚕️ Создание врача...');
  const passwordHash = await bcrypt.hash('doctor123', 11);

  const doctorUser = await prisma.user.upsert({
    where: { email: 'doctor@test.com' },
    update: {},
    create: {
      email: 'doctor@test.com',
      password: passwordHash,
      name: 'Анна Иванова',
      role: 'DOCTOR',
      emailVerified: new Date(),
      image: 'https://i.pravatar.cc/150?img=47', // Случайный аватар
    },
  });
  console.log(`✅ Пользователь создан: ${doctorUser.name} (${doctorUser.email})\n`);

  // 4. Создаем запись Doctor
  console.log('🏥 Создание профиля врача...');
  const doctor = await prisma.doctor.upsert({
    where: { userId: doctorUser.id },
    update: {},
    create: {
      userId: doctorUser.id,
      title: 'Косметолог-эстетист',
      rating: 4.8,
      reviewCount: 156,
      slotDurationMin: 30,
      bufferMin: 10,
      tzid: 'Europe/Moscow',
      minLeadMin: 60, // Минимум за час до записи
      gridStepMin: 15,
    },
  });
  console.log(`✅ Профиль врача создан: ${doctor.title}\n`);

  // 5. Связываем врача с услугами
  console.log('🔗 Связывание врача с услугами...');
  await prisma.doctorService.upsert({
    where: {
      doctorId_serviceId: {
        doctorId: doctor.id,
        serviceId: service1.id,
      },
    },
    update: {},
    create: {
      doctorId: doctor.id,
      serviceId: service1.id,
      isActive: true,
    },
  });

  await prisma.doctorService.upsert({
    where: {
      doctorId_serviceId: {
        doctorId: doctor.id,
        serviceId: service2.id,
      },
    },
    update: {},
    create: {
      doctorId: doctor.id,
      serviceId: service2.id,
      isActive: true,
    },
  });

  await prisma.doctorService.upsert({
    where: {
      doctorId_serviceId: {
        doctorId: doctor.id,
        serviceId: service3.id,
      },
    },
    update: {},
    create: {
      doctorId: doctor.id,
      serviceId: service3.id,
      isActive: true,
    },
  });
  console.log(`✅ Врач связан с услугами\n`);

  // 6. Создаем расписание (Пн-Пт 9:00-18:00)
  console.log('📅 Создание расписания...');
  const schedule = await prisma.schedule.upsert({
    where: { id: 'test-schedule-1' },
    update: {},
    create: {
      id: 'test-schedule-1',
      doctorId: doctor.id,
      byWeekday: [0, 1, 2, 3, 4], // Пн-Пт (0-6, где 0=Пн)
      startTime: '09:00',
      endTime: '18:00',
      tzid: 'Europe/Moscow',
      rrule: 'FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR',
    },
  });
  console.log(`✅ Расписание создано: Пн-Пт ${schedule.startTime}-${schedule.endTime}\n`);

  // 7. Генерируем доступные слоты на следующие 14 дней
  console.log('🕐 Генерация доступных слотов...');

  // Удаляем старые слоты
  await prisma.opening.deleteMany({
    where: { doctorId: doctor.id },
  });

  const today = new Date();
  const slots = [];

  for (let day = 0; day < 14; day++) {
    const date = new Date(today);
    date.setDate(date.getDate() + day);

    const dayOfWeek = date.getDay();
    // Преобразуем: Воскресенье (0) -> 6, Понедельник (1) -> 0, и т.д.
    const dayIndex = dayOfWeek === 0 ? 6 : dayOfWeek - 1;

    // Проверяем рабочий день (Пн-Пт)
    if (schedule.byWeekday.includes(dayIndex)) {
      // Создаем слоты с 9:00 до 18:00 каждые 30 минут
      for (let hour = 9; hour < 18; hour++) {
        for (let minute of [0, 30]) {
          const startUtc = new Date(date);
          startUtc.setHours(hour, minute, 0, 0);

          const endUtc = new Date(startUtc);
          endUtc.setMinutes(endUtc.getMinutes() + doctor.slotDurationMin);

          // Пропускаем прошедшие слоты
          if (startUtc > new Date()) {
            slots.push({
              doctorId: doctor.id,
              startUtc,
              endUtc,
            });
          }
        }
      }
    }
  }

  await prisma.opening.createMany({
    data: slots,
    skipDuplicates: true,
  });
  console.log(`✅ Создано ${slots.length} доступных слотов\n`);

  console.log('🎉 Заполнение завершено!\n');
  console.log('📋 Сводка:');
  console.log(`   Категория: ${category.name}`);
  console.log(`   Услуги: ${service1.name}, ${service2.name}, ${service3.name}`);
  console.log(`   Врач: ${doctorUser.name} (${doctorUser.email})`);
  console.log(`   Пароль: doctor123`);
  console.log(`   Расписание: Пн-Пт 09:00-18:00`);
  console.log(`   Доступных слотов: ${slots.length}`);
  console.log('\n💡 Теперь можно тестировать запись через модальное окно!\n');
}

main()
  .catch((e) => {
    console.error('❌ Ошибка:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
