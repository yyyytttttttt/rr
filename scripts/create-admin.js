// scripts/create-admin.js
// Скрипт для создания первого администратора
// Использование: node scripts/create-admin.js

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const readline = require('readline');

const prisma = new PrismaClient();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function createAdmin() {
  try {
    console.log('\n=== Создание администратора ===\n');

    const email = await question('Email: ');
    const password = await question('Пароль (минимум 6 символов): ');
    const name = await question('Имя (необязательно): ');

    if (!email || !password) {
      console.error('❌ Email и пароль обязательны!');
      process.exit(1);
    }

    if (password.length < 6) {
      console.error('❌ Пароль должен быть минимум 6 символов!');
      process.exit(1);
    }

    const normEmail = email.toLowerCase();

    // Проверка существующего пользователя
    const existing = await prisma.user.findUnique({
      where: { email: normEmail }
    });

    if (existing) {
      console.error(`❌ Пользователь с email ${normEmail} уже существует!`);
      process.exit(1);
    }

    // Хэширование пароля
    console.log('\n⏳ Создание администратора...');
    const hash = await bcrypt.hash(password, 11);

    // Создание админа
    const admin = await prisma.user.create({
      data: {
        email: normEmail,
        password: hash,
        name: name || null,
        role: "ADMIN",
        emailVerified: new Date(), // Сразу подтвержденный email
      },
    });

    console.log('\n✅ Администратор успешно создан!');
    console.log(`\nEmail: ${admin.email}`);
    console.log(`Роль: ${admin.role}`);
    console.log(`ID: ${admin.id}`);
    console.log('\n💡 Теперь вы можете войти в систему с этими данными\n');

  } catch (error) {
    console.error('\n❌ Ошибка при создании администратора:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
    rl.close();
  }
}

createAdmin();
