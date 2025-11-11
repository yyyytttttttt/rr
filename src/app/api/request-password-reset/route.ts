export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prizma";
import crypto from "crypto";
import { sendMail } from "../../../lib/mailer";


import z from "zod";
import { PrismaClient } from "@prisma/client";

const schema = z.object({
    email:z.email()

})
const TTL_MIN = Number(process.env.TTL_MIN || 60)

export async function POST(req:Request){
    const body = await req.json().catch(()=>null)
    const parsed = schema.safeParse(body)

    if (!parsed.success) {
        return NextResponse.json({ error: "VALIDATION" }, { status: 400 })
    }
    const email = parsed.data.email.toLowerCase()

    const user = await prisma.user.findUnique({
        where:{email},
        select:{email:true,password:true}
    })

    if (!user) {
        return NextResponse.json({ok:true})
    }



    if (!user.password) {
        return NextResponse.json({ok:true})
    }
    const raw = crypto.randomBytes(32).toString("hex")
    const tokenHash = crypto.createHash("sha256").update(raw).digest("hex")
    const expires = new Date(Date.now() + TTL_MIN * 60 * 1000);
    
    await prisma.$transaction( async(tx)=>{
        await tx.passwordResetToken.deleteMany({where:{identifier:email}})
        await tx.passwordResetToken.create({
            data:{identifier:email,token:tokenHash,expires}
        })
    })
    const link =
    `${process.env.NEXTAUTH_URL}/reset-password` +`?email=${encodeURIComponent(email)}&token=${raw}`;

    try {
        await sendMail({
            to:email,
            subject:'сброс пароля',
             html: `
            <p>Для сброса пароля перейдите по ссылке:</p>
            <p><a href="${link}">${link}</a></p>
            <p>Ссылка активна ${TTL_MIN} мин.</p>
        `
        })
            
        
    } catch (e) {
        console.error('[RESET_MAIL_FAIL',e)
    }
    return NextResponse.json({ok:true})

    
        
    



}