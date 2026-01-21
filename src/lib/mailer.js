import nodemailer from "nodemailer";

const smtpConfig = {
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 465),
    secure: true, // true для 465, false для других портов
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 10000,
    // Отключаем pool - он может вызывать зависания
    pool: false,
    // Включаем debug для диагностики
    debug: true,
    logger: true,
};

export const mailer = nodemailer.createTransport(smtpConfig);

// Проверка SMTP соединения
export async function verifySmtp() {
    try {
        console.log('[MAILER] Verifying SMTP connection...');
        console.log('[MAILER] Host:', process.env.SMTP_HOST);
        console.log('[MAILER] Port:', process.env.SMTP_PORT);
        console.log('[MAILER] User:', process.env.SMTP_USER);
        await mailer.verify();
        console.log('[MAILER] SMTP connection verified successfully');
        return true;
    } catch (error) {
        console.error('[MAILER] SMTP verification failed:', error.message);
        return false;
    }
}

export async function sendMail({ to, subject, html }) {
    console.log('[MAILER] Sending email to:', to);
    console.log('[MAILER] Subject:', subject);
    console.log('[MAILER] From:', process.env.MAIL_FROM);
    console.log('[MAILER] SMTP Config:', {
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT,
        user: process.env.SMTP_USER,
    });

    try {
        const result = await mailer.sendMail({
            from: process.env.MAIL_FROM,
            to,
            subject,
            html,
        });

        console.log('[MAILER] Email sent successfully, messageId:', result.messageId);
        return result;
    } catch (error) {
        console.error('[MAILER] Failed to send email:', error.message);
        console.error('[MAILER] Full error:', error);
        throw error;
    }
}