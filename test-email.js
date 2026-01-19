// Тестовый скрипт для проверки SMTP
// Запустить: node test-email.js

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env.local') });

// Если .env.local не сработал, попробуем .env
if (!process.env.SMTP_HOST) {
  require('dotenv').config({ path: path.join(__dirname, '.env') });
}
const nodemailer = require('nodemailer');

async function testEmail() {
  console.log('SMTP Config:');
  console.log('  Host:', process.env.SMTP_HOST);
  console.log('  Port:', process.env.SMTP_PORT);
  console.log('  User:', process.env.SMTP_USER);
  console.log('  From:', process.env.MAIL_FROM);

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 465),
    secure: true,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  try {
    // Проверка соединения
    console.log('\nПроверка соединения с SMTP...');
    await transporter.verify();
    console.log('✓ Соединение установлено успешно!');

    // Отправка тестового письма
    const testTo = process.env.SMTP_USER; // Отправляем себе
    console.log(`\nОтправка тестового письма на ${testTo}...`);

    const result = await transporter.sendMail({
      from: process.env.MAIL_FROM,
      to: testTo,
      subject: 'Тест SMTP - Новая Я',
      html: '<h1>Тест</h1><p>Если вы видите это письмо, SMTP работает!</p>',
    });

    console.log('✓ Письмо отправлено!');
    console.log('  Message ID:', result.messageId);
  } catch (error) {
    console.error('✗ Ошибка:', error.message);
    console.error('  Код:', error.code);
    console.error('  Команда:', error.command);
  }
}

testEmail();
