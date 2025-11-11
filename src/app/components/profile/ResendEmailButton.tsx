'use client'
import { error } from "console"
import { useState } from "react"

 

export  function ResendButton({email}:{email:string}){
    const [msg,setMsg]=useState('')
    const [loading,setLoading]=useState(false)

    async function resend() {
        
        setLoading(true)
        setMsg('')
        const r = await fetch('/api/resend',{
            method:'POST',
            headers: { 'Content-Type': 'application/json' },
            body:JSON.stringify({email})
            


        })
        
        setLoading(false)
        setMsg(r.ok ? 'Письмо отправлено. Проверьте почту.' : 'Не удалось отправить.');
        const data = await r.json().catch(() => ({}));
        switch (data?.error) {
            case "EMAIL_ALREADY_VERIFIED":
            throw new Error("Эта почта уже подтверждена. Попробуйте войти.");
            case "NO_EMAIL":
            throw new Error("Введите корректный e-mail.");
            case "MAIL_SEND_FAILED":
            throw new Error("Не удалось отправить письмо. Попробуйте позже.");
            default:
            throw new Error("Что-то пошло не так. Попробуйте ещё раз.");
        }


        
        
        }
        
    
    return(
        <div>
            <button onClick={resend} disabled={loading}>
                 {loading ? 'Отправляем…' : 'Отправить письмо ещё раз'}
            </button>
            {msg && <div style={{ marginTop: 6 }}>{msg}</div>}
        </div>
    )


    
}