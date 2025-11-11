"use client";

import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import toast from "react-hot-toast";

const passwordSchema = z
  .object({
    oldPassword: z
      .string()
      .min(1, "Введите текущий пароль")
      .min(8, "Пароль должен содержать минимум 8 символов"),
    newPassword: z
      .string()
      .min(1, "Введите новый пароль")
      .min(8, "Пароль должен содержать минимум 8 символов")
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        "Пароль должен содержать хотя бы одну заглавную букву, одну строчную букву и одну цифру"
      ),
  })
  .refine((data) => data.oldPassword !== data.newPassword, {
    message: "Новый пароль должен отличаться от текущего",
    path: ["newPassword"],
  });

type PasswordFormData = z.infer<typeof passwordSchema>;

export default function ChangePasswordForm() {
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<PasswordFormData>({ resolver: zodResolver(passwordSchema) });

  const onSubmit = async (data: PasswordFormData) => {
    try {
      const res = await fetch("/api/changePassword", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          newPassword: data.newPassword,
          oldPassword: data.oldPassword,
        }),
      });

      const result = await res.json().catch(() => null);

      if (!res.ok) {
        toast.error(result?.error ?? "Не удалось изменить пароль");
        return;
      }

      toast.success("Пароль успешно изменен");
      reset();
    } catch (error) {
      console.error("Change password error:", error);
      toast.error("Произошла ошибка");
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-[clamp(1rem,0.8846rem+0.5128vw,1.5rem)]">
      {/* Старый пароль */}
      <label className="block">
        <span className="mb-[clamp(0.5rem,0.4423rem+0.2564vw,0.75rem)] block text-[clamp(0.875rem,0.8077rem+0.2985vw,1.125rem)] font-ManropeMedium text-[#4F5338]">
          Старый пароль
        </span>
        <div className="relative">
          <input
            {...register("oldPassword")}
            type={showOldPassword ? "text" : "password"}
            placeholder="Старый пароль"
            className={`w-full rounded-[clamp(0.5rem,0.4423rem+0.2564vw,0.75rem)] border px-[clamp(0.75rem,0.6346rem+0.5128vw,1.25rem)] py-[clamp(0.625rem,0.5096rem+0.5128vw,1.125rem)] text-[clamp(0.875rem,0.8077rem+0.2985vw,1.125rem)] font-ManropeRegular text-[#636846] outline-none focus:border-[#5C6744] disabled:opacity-50 transition pr-[clamp(2.5rem,2.2692rem+1.0256vw,3.5rem)] ${
              errors.oldPassword ? "border-red-300 bg-red-50" : "border-[#EEE7DC] bg-white"
            }`}
          />
          <button
            type="button"
            onClick={() => setShowOldPassword(!showOldPassword)}
            className="absolute right-[clamp(0.75rem,0.6346rem+0.5128vw,1.25rem)] top-1/2 -translate-y-1/2 text-[#636846] hover:text-[#4F5338] transition"
          >
            {showOldPassword ? (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-[clamp(1.25rem,1.1346rem+0.5128vw,1.75rem)] w-[clamp(1.25rem,1.1346rem+0.5128vw,1.75rem)]"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-[clamp(1.25rem,1.1346rem+0.5128vw,1.75rem)] w-[clamp(1.25rem,1.1346rem+0.5128vw,1.75rem)]"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
              </svg>
            )}
          </button>
        </div>
        {errors.oldPassword && (
          <span className="mt-[clamp(0.25rem,0.1923rem+0.2564vw,0.5rem)] block text-[clamp(0.75rem,0.6923rem+0.2564vw,1rem)] text-red-600">
            {errors.oldPassword.message}
          </span>
        )}
      </label>

      {/* Новый пароль */}
      <label className="block">
        <span className="mb-[clamp(0.5rem,0.4423rem+0.2564vw,0.75rem)] block text-[clamp(0.875rem,0.8077rem+0.2985vw,1.125rem)] font-ManropeMedium text-[#4F5338]">
          Новый пароль
        </span>
        <div className="relative">
          <input
            {...register("newPassword")}
            type={showNewPassword ? "text" : "password"}
            placeholder="Новый пароль"
            className={`w-full rounded-[clamp(0.5rem,0.4423rem+0.2564vw,0.75rem)] border px-[clamp(0.75rem,0.6346rem+0.5128vw,1.25rem)] py-[clamp(0.625rem,0.5096rem+0.5128vw,1.125rem)] text-[clamp(0.875rem,0.8077rem+0.2985vw,1.125rem)] font-ManropeRegular text-[#636846] outline-none focus:border-[#5C6744] disabled:opacity-50 transition pr-[clamp(2.5rem,2.2692rem+1.0256vw,3.5rem)] ${
              errors.newPassword ? "border-red-300 bg-red-50" : "border-[#EEE7DC] bg-white"
            }`}
          />
          <button
            type="button"
            onClick={() => setShowNewPassword(!showNewPassword)}
            className="absolute right-[clamp(0.75rem,0.6346rem+0.5128vw,1.25rem)] top-1/2 -translate-y-1/2 text-[#636846] hover:text-[#4F5338] transition"
          >
            {showNewPassword ? (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-[clamp(1.25rem,1.1346rem+0.5128vw,1.75rem)] w-[clamp(1.25rem,1.1346rem+0.5128vw,1.75rem)]"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-[clamp(1.25rem,1.1346rem+0.5128vw,1.75rem)] w-[clamp(1.25rem,1.1346rem+0.5128vw,1.75rem)]"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
              </svg>
            )}
          </button>
        </div>
        {errors.newPassword && (
          <span className="mt-[clamp(0.25rem,0.1923rem+0.2564vw,0.5rem)] block text-[clamp(0.75rem,0.6923rem+0.2564vw,1rem)] text-red-600">
            {errors.newPassword.message}
          </span>
        )}
      </label>

      {/* Кнопка отправки */}
      <button
        type="submit"
        disabled={isSubmitting}
        className="mt-[clamp(0.5rem,0.3846rem+0.5128vw,1rem)] inline-flex items-center justify-center rounded-[clamp(0.5rem,0.4423rem+0.2564vw,0.75rem)] bg-[#5C6744] px-[clamp(1.25rem,1.0192rem+1.0256vw,2.25rem)] py-[clamp(0.75rem,0.6346rem+0.5128vw,1.25rem)] text-[clamp(0.875rem,0.8077rem+0.2985vw,1.125rem)] font-ManropeMedium text-white hover:bg-[#4F5338] disabled:opacity-50 disabled:cursor-not-allowed transition"
      >
        {isSubmitting ? "Изменение пароля..." : "Сменить пароль"}
      </button>
    </form>
  );
}
