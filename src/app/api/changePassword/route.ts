export const runtime = "nodejs";
import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prizma";
import { z } from "zod";
import bcrypt from "bcrypt";

import { getServerSession } from "next-auth";
import { authOptions } from "../../../lib/auth";

const schema = z.object({
    oldPassword:z.string().min(8),
    newPassword:z.string().min(8)

})



export  async function POST(req:Request) {
    const session = await getServerSession(authOptions)

    const body = await req.json().catch(()=>null)
    const parsed = schema.safeParse(body)

    if (!parsed.success) {
        return NextResponse.json({error:'ERROR_VALIDATION'},{status:400})
    }
    const {oldPassword,newPassword}=parsed.data

    

    if (!session?.user?.email) {
        return NextResponse.json({error:"UNAUTHORIZED"},{status:401})
    }
    const email = session.user.email.toLowerCase()

    const user = await prisma.user.findUnique({
        where:{email},
        select:{id:true,password:true}
        
     

    })

    if (!user?.password){
        return NextResponse.json({error:'NO_LOCAL_PASSWORD'},{status:400})
    }
    const ok = await bcrypt.compare(oldPassword,user.password)

    if (!ok) {
        return NextResponse.json({error:'WRONG_OLD_PASSWORD'},{status:400})
    }
    if (await bcrypt.compare(newPassword,user.password)){
        return NextResponse.json({error:'SAME_PASSWORD' },{status:400})
    }

    const hash = await bcrypt.hash(newPassword,12)

    await prisma.user.update({
        where:{email},
        data:{password:hash,passwordUpdatedAt:new Date()}
    })
    return NextResponse.json({ok:true})

  

    

      
}