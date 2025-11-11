import nodemailer from "nodemailer";


export const mailer = nodemailer.createTransport({
    host:process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 567),
    secure:true,
    auth:{
        user:process.env.SMTP_USER,
        pass:process.env.SMTP_PASS

    }

})

export async function sendMail({to,subject,html}) {
    await mailer.sendMail({
        from:process.env.MAIL_FROM,
        to,
        subject,html
    })

    
}