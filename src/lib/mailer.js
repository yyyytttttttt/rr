import nodemailer from "nodemailer";

const smtpConfig = {
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 465),
    secure: true, // true для 465, false для других портов
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
    // Дополнительные настройки для надёжности
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 10000,
    // Ограничение пула соединений для предотвращения утечки памяти
    pool: true,
    maxConnections: 5,
    maxMessages: 100,
    rateDelta: 1000,
    rateLimit: 5,
};

export const mailer = nodemailer.createTransport(smtpConfig);

// Периодическая очистка idle соединений каждые 5 минут
setInterval(() => {
    if (mailer.isIdle()) {
        mailer.close();
    }
}, 5 * 60 * 1000);

export async function sendMail({ to, subject, html }) {
    console.log('[MAILER] Sending email to:', to);
    console.log('[MAILER] Subject:', subject);
    console.log('[MAILER] From:', process.env.MAIL_FROM);

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
        console.error('[MAILER] Failed to send email:', error);
        // При ошибке закрываем соединения для освобождения ресурсов
        try {
            mailer.close();
        } catch (closeErr) {
            // игнорируем ошибку закрытия
        }
        throw error;
    }
}