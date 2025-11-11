"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import ChangePasswordForm from "../../components/profile/changeProfilePassword";
import toast from "react-hot-toast";
import { z } from "zod";
import { signOut } from "next-auth/react";

type Props = {
  userId: string;
  userName: string;
  userEmail: string;
  userImage: string;
};

// Zod validation schema
const profileSchema = z.object({
  name: z
    .string()
    .min(2, "Имя должно содержать минимум 2 символа")
    .max(100, "Имя слишком длинное"),
  phone: z
    .string()
    .optional()
    .refine(
      (val) => {
        if (!val || val.trim() === "") return true;
        const digitsOnly = val.replace(/\D/g, "");
        return digitsOnly.length >= 10 && digitsOnly.length <= 15;
      },
      { message: "Телефон должен содержать от 10 до 15 цифр" }
    ),
  birthDate: z
    .string()
    .optional()
    .refine(
      (val) => {
        if (!val || val.trim() === "") return true;
        const regex = /^(\d{2})\.(\d{2})\.(\d{4})$/;
        const match = val.match(regex);
        if (!match) return false;

        const [, day, month, year] = match;
        const d = parseInt(day);
        const m = parseInt(month);
        const y = parseInt(year);

        if (m < 1 || m > 12) return false;
        if (d < 1 || d > 31) return false;
        if (y < 1900 || y > new Date().getFullYear()) return false;

        const dateObj = new Date(y, m - 1, d);
        return dateObj.getDate() === d && dateObj.getMonth() === m - 1 && dateObj.getFullYear() === y;
      },
      { message: "Неверный формат даты. Используйте ДД.ММ.ГГГГ (например, 12.04.1987)" }
    ),
});

type ProfileFormData = z.infer<typeof profileSchema>;

export default function SettingsPanel({ userName, userEmail, userImage }: Props) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState(userName || "");
  const [phone, setPhone] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Format phone number: +7 (XXX) XXX-XX-XX
  const formatPhoneNumber = (value: string): string => {
    // Remove all non-digit characters
    const digitsOnly = value.replace(/\D/g, "");

    // Limit to 11 digits (for Russian numbers)
    const limited = digitsOnly.slice(0, 11);

    // Format based on length
    if (limited.length === 0) return "";

    let formatted = "+7";
    if (limited.length > 1) {
      // Add area code in parentheses
      formatted += ` (${limited.slice(1, 4)}`;

      if (limited.length >= 4) {
        formatted += ")";
      }

      if (limited.length >= 5) {
        // Add first part of number
        formatted += ` ${limited.slice(4, 7)}`;
      }

      if (limited.length >= 8) {
        // Add second part
        formatted += `-${limited.slice(7, 9)}`;
      }

      if (limited.length >= 10) {
        // Add last part
        formatted += `-${limited.slice(9, 11)}`;
      }
    }

    return formatted;
  };

  // Format birth date: DD.MM.YYYY
  const formatBirthDate = (value: string): string => {
    // Remove all non-digit characters
    const digitsOnly = value.replace(/\D/g, "");

    // Limit to 8 digits
    const limited = digitsOnly.slice(0, 8);

    // Format based on length
    let formatted = "";
    if (limited.length >= 1) {
      formatted = limited.slice(0, 2);
    }
    if (limited.length >= 3) {
      formatted += `.${limited.slice(2, 4)}`;
    }
    if (limited.length >= 5) {
      formatted += `.${limited.slice(4, 8)}`;
    }

    return formatted;
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const res = await fetch("/api/user/profile");
      if (res.ok) {
        const data = await res.json();
        setName(data.user.name || "");

        // Format phone number for display
        if (data.user.phone) {
          setPhone(formatPhoneNumber(data.user.phone));
        }

        // Convert YYYY-MM-DD to DD.MM.YYYY for display
        if (data.user.birthDate) {
          const date = new Date(data.user.birthDate);
          const day = String(date.getDate()).padStart(2, "0");
          const month = String(date.getMonth() + 1).padStart(2, "0");
          const year = date.getFullYear();
          setBirthDate(`${day}.${month}.${year}`);
        }
      }
    } catch (error) {
      console.error("Failed to load profile:", error);
    } finally {
      setLoading(false);
    }
  };

  const handlePhoneChange = (value: string) => {
    const formatted = formatPhoneNumber(value);
    setPhone(formatted);
    if (errors.phone) setErrors({ ...errors, phone: "" });
  };

  const handleBirthDateChange = (value: string) => {
    const formatted = formatBirthDate(value);
    setBirthDate(formatted);
    if (errors.birthDate) setErrors({ ...errors, birthDate: "" });
  };

  const handleSave = async () => {
    // Clear previous errors
    setErrors({});

    // Validate with Zod
    const result = profileSchema.safeParse({
      name: name.trim(),
      phone: phone.trim() || undefined,
      birthDate: birthDate.trim() || undefined,
    });

    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.issues.forEach((err) => {
        if (err.path[0]) {
          fieldErrors[err.path[0] as string] = err.message;
        }
      });
      setErrors(fieldErrors);
      toast.error("Пожалуйста, исправьте ошибки в форме");
      return;
    }

    setSaving(true);
    try {
      console.log("Saving profile:", result.data);

      const res = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: result.data.name,
          phone: result.data.phone || null,
          birthDate: result.data.birthDate || null,
        }),
      });

      const data = await res.json();
      console.log("Save response:", data);

      if (res.ok) {
        toast.success("Профиль успешно обновлен");
        setErrors({});
      } else {
        console.error("Save error:", data);
        toast.error(data.error || "Не удалось обновить профиль");
      }
    } catch (error) {
      console.error("Failed to save profile:", error);
      toast.error("Произошла ошибка");
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Проверка типа файла
    if (!file.type.startsWith("image/")) {
      toast.error("Выберите изображение");
      return;
    }

    // Проверка размера (макс 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Файл слишком большой. Максимум 5MB");
      return;
    }

    setUploadingAvatar(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload-avatar", {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        toast.success("Аватар обновлен");
        router.refresh();
      } else {
        const data = await res.json().catch(() => ({}));
        toast.error(data?.error || "Не удалось загрузить аватар");
      }
    } catch (error) {
      console.error("Avatar upload error:", error);
      toast.error("Ошибка загрузки аватара");
    } finally {
      setUploadingAvatar(false);
      // Сбрасываем input чтобы можно было загрузить тот же файл снова
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleLogout = async () => {
    try {
      await signOut({ callbackUrl: "/" });
    } catch (error) {
      console.error("Logout error:", error);
      toast.error("Ошибка при выходе");
    }
  };

  return (
    <div className="min-h-screen bg-[#FFFCF3] px-[2%] py-6">
      <div className="max-w-3xl">
        <h1 className="text-2xl font-ManropeBold text-[#4F5338] mb-6">
          Настройки профиля
        </h1>

        {/* Карточка профиля */}
        <div className="rounded-2xl border border-[#E8E2D5] bg-white p-6 mb-6">
          <div className="mb-6 flex items-center gap-4">
            <div className="relative">
              <Image
                src={userImage || "/avatar-placeholder.png"}
                alt="avatar"
                width={64}
                height={64}
                className="h-16 w-16 rounded-full object-cover border-2 border-white"
              />
              <button
                type="button"
                onClick={handleAvatarClick}
                disabled={uploadingAvatar}
                className="absolute -right-1 -bottom-1 grid h-7 w-7 place-items-center rounded-full bg-[#5C6744] text-white text-sm hover:bg-[#4F5338] disabled:opacity-50 transition cursor-pointer"
                title="Изменить аватар"
              >
                {uploadingAvatar ? "..." : "+"}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                className="hidden"
              />
            </div>
            <div>
              <div className="font-ManropeBold text-lg text-[#4F5338]">{userName}</div>
              <div className="text-sm text-[#636846]">{userEmail}</div>
            </div>
          </div>

          {/* Поля */}
          <div className="space-y-4">
            <label className="block">
              <span className="mb-2 block text-sm font-ManropeMedium text-[#4F5338]">Имя и фамилия</span>
              <input
                type="text"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (errors.name) setErrors({ ...errors, name: "" });
                }}
                placeholder="Ирина Иванова"
                disabled={loading}
                className={`w-full rounded-lg border px-4 py-3 text-sm font-ManropeRegular text-[#636846] outline-none focus:border-[#5C6744] disabled:opacity-50 transition ${
                  errors.name
                    ? "border-red-300 bg-red-50"
                    : "border-[#E8E2D5] bg-white"
                }`}
              />
              {errors.name && (
                <span className="mt-1 block text-xs text-red-600">{errors.name}</span>
              )}
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-ManropeMedium text-[#4F5338]">Дата рождения</span>
              <input
                type="text"
                value={birthDate}
                onChange={(e) => handleBirthDateChange(e.target.value)}
                placeholder="12.04.1987"
                disabled={loading}
                maxLength={10}
                className={`w-full rounded-lg border px-4 py-3 text-sm font-ManropeRegular text-[#636846] outline-none focus:border-[#5C6744] disabled:opacity-50 transition ${
                  errors.birthDate
                    ? "border-red-300 bg-red-50"
                    : "border-[#E8E2D5] bg-white"
                }`}
              />
              {errors.birthDate && (
                <span className="mt-1 block text-xs text-red-600">{errors.birthDate}</span>
              )}
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-ManropeMedium text-[#4F5338]">Электронная почта</span>
              <input
                type="email"
                value={userEmail}
                disabled
                placeholder="Realog@mail.com"
                className="w-full rounded-lg border border-[#E8E2D5] bg-[#F6F2EA] px-4 py-3 text-sm font-ManropeRegular text-[#636846] outline-none cursor-not-allowed opacity-60"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-ManropeMedium text-[#4F5338]">Номер телефона</span>
              <input
                type="tel"
                value={phone}
                onChange={(e) => handlePhoneChange(e.target.value)}
                placeholder="+7 (900) 800-76-56"
                disabled={loading}
                maxLength={18}
                className={`w-full rounded-lg border px-4 py-3 text-sm font-ManropeRegular text-[#636846] outline-none focus:border-[#5C6744] disabled:opacity-50 transition ${
                  errors.phone
                    ? "border-red-300 bg-red-50"
                    : "border-[#E8E2D5] bg-white"
                }`}
              />
              {errors.phone && (
                <span className="mt-1 block text-xs text-red-600">{errors.phone}</span>
              )}
            </label>

            <button
              type="button"
              onClick={handleSave}
              disabled={saving || loading}
              className="mt-2 inline-flex items-center justify-center rounded-lg bg-[#5C6744] px-5 py-3 text-sm font-ManropeMedium text-white hover:bg-[#4F5338] disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              {saving ? "Сохранение..." : "Сохранить изменения"}
            </button>
          </div>
        </div>

        {/* Смена пароля */}
        <div className="rounded-2xl border border-[#E8E2D5] bg-white p-6 mb-6">
          <h2 className="mb-4 text-lg font-ManropeBold text-[#4F5338]">Смена пароля</h2>
          <ChangePasswordForm />
        </div>

        {/* Низ страницы */}
        <div className="space-y-3">
          <button
            onClick={handleLogout}
            className="text-sm font-ManropeMedium text-[#CF5E5E] hover:underline transition"
          >
            Выйти
          </button>

          <details className="group">
            <summary className="flex cursor-pointer select-none items-center gap-1 text-sm font-ManropeMedium text-[#4F5338]">
              Другие действия
              <svg
                className="ml-1 h-5 w-5 transition group-open:rotate-180"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#4F5338"
                strokeWidth="2"
              >
                <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </summary>
            <div className="mt-2 pl-4">
              <button className="text-sm font-ManropeMedium text-[#CF5E5E] hover:underline transition">
                Удалить аккаунт
              </button>
            </div>
          </details>
        </div>
      </div>
    </div>
  );
}
