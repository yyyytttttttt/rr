'use client'
import { usePathname } from 'next/navigation'
import React from 'react'
import {useSession,signIn,signOut} from 'next-auth/react'
import Link from 'next/link'

const Navigation = () => {
    const pathname= usePathname()
    const session =useSession()
    // session object intentionally not logged
  return (
    <div className='flex w-full items-center justify-center gap-4 bg-amber-300'>{
        session.data&& (<Link href="/profile">profile</Link>)}

        {session.data?(<Link onClick={()=>signOut({callbackUrl:'/test'})} href="#">sign out</Link>):
        <Link href="/signIn">sign in</Link>



    }</div>
  )
}

export default  Navigation