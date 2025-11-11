'use client';

import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';

const schema = z.object({
  newPassword: z.string().min(8, 'Минимум 8 символов'),
});

type FormData = z.infer<typeof schema>;

type Props = { email: string; token: string }; // token — именно RAW из ссылки!

export default function ResetPasswordForm({ email, token }: Props) {
  const [msg, setMsg] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    setMsg(null);

    const res = await fetch('/api/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, token, newPassword: data.newPassword }),
    });

    const json = await res.json().catch(() => null);

    if (!res.ok) {
      setMsg(json?.error ?? 'Ошибка');
      return; // ← ВАЖНО: не продолжаем
    }

    setMsg('Пароль обновлён, войдите заново');
    reset();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
      <div>
        <label>Новый пароль</label>
        <input
          type="password"
          {...register('newPassword')}
          className="border p-2 w-full"
          autoComplete="new-password"
        />
        {errors.newPassword && (
          <p className="text-red-600 text-sm">{errors.newPassword.message}</p>
        )}
      </div>

      <button disabled={isSubmitting} className="px-4 py-2 bg-black text-white rounded">
        {isSubmitting ? 'Сохраняю…' : 'Сбросить пароль'}
      </button>

      {msg && <p className="text-sm">{msg}</p>}
    </form>
  );
}
