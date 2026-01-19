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
};

export const mailer = nodemailer.createTransport(smtpConfig);

export async function sendMail({ to, subject, html }) {
    console.log('[MAILER] Sending email to:', to);
    console.log('[MAILER] Subject:', subject);
    console.log('[MAILER] From:', process.env.MAIL_FROM);

    const result = await mailer.sendMail({
        from: process.env.MAIL_FROM,
        to,
        subject,
        html,
    });

    console.log('[MAILER] Email sent successfully, messageId:', result.messageId);
    return result;
}