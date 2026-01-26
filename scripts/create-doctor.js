const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
  const email = 'doctor@test.com';
  const password = 'doctor123';
  const hashedPassword = await bcrypt.hash(password, 10);

  // Проверяем, существует ли уже такой пользователь
  const existing = await prisma.user.findUnique({
    where: { email },
  });

  if (existing) {
    console.log('Пользователь уже существует, обновляю...');

    // Обновляем пользователя
    const user = await prisma.user.update({
      where: { email },
      data: {
        password: hashedPassword,
        role: 'DOCTOR',
        emailVerified: new Date(),
      },
    });

    // Проверяем, есть ли уже запись Doctor
    const existingDoctor = await prisma.doctor.findUnique({
      where: { userId: user.id },
    });

    if (!existingDoctor) {
      await prisma.doctor.create({
        data: {
          userId: user.id,
          title: 'Косметолог',
          tzid: 'Europe/Moscow',
          slotDurationMin: 30,
          bufferMin: 15,
          minLeadMin: 60,
        },
      });
    }

    console.log('\n✅ Врач готов к использованию!');
    console.log('================================');
    console.log('Email:', email);
    console.log('Пароль:', password);
    console.log('================================\n');
    return;
  }

  // Создаем нового пользователя
  const user = await prisma.user.create({
    data: {
      email,
      password: hashedPassword,
      name: 'Тестовый Врач',
      role: 'DOCTOR',
      emailVerified: new Date(),
    },
  });

  // Создаем запись Doctor
  await prisma.doctor.create({
    data: {
      userId: user.id,
      title: 'Косметолог',
      tzid: 'Europe/Moscow',
      slotDurationMin: 30,
      bufferMin: 15,
      minLeadMin: 60,
    },
  });

  console.log('\n✅ Врач успешно создан!');
  console.log('================================');
  console.log('Email:', email);
  console.log('Пароль:', password);
  console.log('================================\n');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
