import nodemailer from "nodemailer";

// Ленивая инициализация - транспорт создаётся только при первой отправке
let _mailer = null;

function getMailer() {
    // Не инициализировать во время билда
    if (process.env.NODE_ENV === 'production' && typeof window === 'undefined' && !process.env.SMTP_HOST) {
        return null;
    }

    if (!_mailer) {
        _mailer = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: Number(process.env.SMTP_PORT || 465),
            secure: true,
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS,
            },
            connectionTimeout: 10000,
            greetingTimeout: 10000,
            socketTimeout: 10000,
            pool: false,
        });
    }
    return _mailer;
}

export async function sendMail({ to, subject, html }) {
    const mailer = getMailer();

    if (!mailer) {
        console.error('[MAILER] SMTP not configured');
        throw new Error('SMTP not configured');
    }

    console.log('[MAILER] Sending email to:', to);

    const result = await mailer.sendMail({
        from: process.env.MAIL_FROM,
        to,
        subject,
        html,
    });

    console.log('[MAILER] Email sent, messageId:', result.messageId);
    return result;
}
