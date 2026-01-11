'use client'

import { SessionProvider } from "next-auth/react"
import { Toaster } from "react-hot-toast"

export const Providers = ({children}:{children:React.ReactNode})=>{
    return (
        <SessionProvider
            refetchInterval={0}
            refetchOnWindowFocus={false}
        >
            {children}
            <Toaster
                position="top-center"
                toastOptions={{
                    duration: 4000,
                    style: {
                        background: '#4F5338',
                        color: '#fff',
                        padding: '16px',
                        borderRadius: '10px',
                        fontSize: '15px',
                        fontFamily: 'Manrope-Medium, sans-serif',
                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                    },
                    success: {
                        duration: 4000,
                        style: {
                            background: '#5C6744',
                        },
                        iconTheme: {
                            primary: '#EAE19C',
                            secondary: '#fff',
                        },
                    },
                    error: {
                        duration: 5000,
                        style: {
                            background: '#C44536',
                        },
                        iconTheme: {
                            primary: '#fff',
                            secondary: '#C44536',
                        },
                    },
                }}
            />
        </SessionProvider>
    )
}