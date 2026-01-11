// scripts/add-january-slots.js
// Добавление слотов на 12 января 2026
// Использование: node scripts/add-january-slots.js

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('📅 Добавление слотов на 12 января 2026...\n');

  // Находим врача
  const doctor = await prisma.doctor.findFirst({
    where: {
      user: {
        email: 'doctor@test.com'
      }
    }
  });

  if (!doctor) {
    console.error('❌ Врач не найден!');
    process.exit(1);
  }

  console.log(`✅ Врач найден: ${doctor.id}\n`);

  // Создаем слоты на 12 января 2026
  const targetDate = new Date(2026, 0, 12); // 12 января 2026 (месяц 0 = январь)
  const slots = [];

  // Создаем слоты с 9:00 до 18:00 каждые 30 минут
  for (let hour = 9; hour < 18; hour++) {
    for (let minute of [0, 30]) {
      const startUtc = new Date(targetDate);
      startUtc.setHours(hour, minute, 0, 0);

      const endUtc = new Date(startUtc);
      endUtc.setMinutes(endUtc.getMinutes() + 30); // 30 минут слот

      slots.push({
        doctorId: doctor.id,
        startUtc,
        endUtc,
      });
    }
  }

  console.log(`📝 Создание ${slots.length} слотов на 12 января 2026...\n`);

  // Удаляем старые слоты на эту дату (если есть)
  const dayStart = new Date(2026, 0, 12, 0, 0, 0);
  const dayEnd = new Date(2026, 0, 12, 23, 59, 59);

  await prisma.opening.deleteMany({
    where: {
      doctorId: doctor.id,
      startUtc: {
        gte: dayStart,
        lte: dayEnd,
      }
    }
  });

  // Создаем новые слоты
  await prisma.opening.createMany({
    data: slots,
    skipDuplicates: true,
  });

  console.log('✅ Слоты успешно созданы!\n');
  console.log('📋 Сводка:');
  console.log(`   Дата: 12 января 2026`);
  console.log(`   Время: 09:00 - 18:00`);
  console.log(`   Количество слотов: ${slots.length}`);
  console.log(`   Интервал: 30 минут\n`);
}

main()
  .catch((e) => {
    console.error('❌ Ошибка:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
