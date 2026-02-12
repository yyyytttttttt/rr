'use client'
import { useState } from "react"
import { useRouter } from "next/navigation"
export default function AvatarForm(){
    const router=useRouter()
    const [file,setFile]=useState(null)
    const [err,setErr]=useState('')
    const [loading,setLoading]=useState(false)

    async function onSubmit(e) {
        e.preventDefault()
        setErr('')

        if (!file) {
            setErr('Выберите файл')
            return
        }
        const form = new FormData()
        form.append('file',file)
        setLoading(true)
        const res = await fetch('/api/upload-avatar',{
            method:"POST",
            body:form
        })
        setLoading(false)
        if (!res.ok) {
            const body = await res.json().catch(()=>({}))
            setErr(body?.error || 'ошибка загрузки')
            return
        }
        router.refresh();
        
    }
    return (
        <form onSubmit={onSubmit}>
            <div>
                <input onChange={(e)=>setFile(e.target.files?.[0] || null)} type="file" name="file" accept="image/*"/>
            </div>
            <button type="submit">
                {
                    loading ? 'Загружаем' :'Обновить автар'
                }
            </button>
            {err && <div style={{ color: "crimson", marginTop: 8 }}>{err}</div>}
        </form>
    )

    

}