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
  tzid: string;
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
    <div className="min-h-screen bg-[#FFFCF3] relative overflow-hidden">
      {/* Водяной знак β */}
      <div className="pointer-events-none absolute right-[clamp(-5rem,-8.4615rem+15.3846vw,10rem)] top-[clamp(2rem,0rem+8.8889vw,10rem)] z-0 hidden lg:block">
        <svg
          viewBox="0 0 600 800"
          className="h-[clamp(20rem,25.3846rem+20.5128vw,50rem)] w-auto opacity-[0.15]"
          aria-hidden="true"
        >
          <g fill="none" stroke="#EEE7DC" strokeWidth="12">
            <path d="M300,60 C100,60 40,200 40,400 s60,340 260,340 260-140 260-340 S500,60 300,60z" />
            <path d="M390,210c65,25 105,65 105,120 0,80-85,130-165,130 100,12 170,70 170,150 0,95-95,170-220,170" />
          </g>
          <circle cx="365" cy="395" r="22" fill="#EEE7DC" />
        </svg>
      </div>

      <div className="relative z-10 max-w-full sm:max-w-[600px] md:max-w-[700px] lg:max-w-[clamp(35rem,32.6923rem+10.2564vw,45rem)] px-3 sm:px-4 md:px-6 xl:px-[clamp(1rem,0.5385rem+2.0513vw,3rem)] py-4 sm:py-6 md:py-8 xl:py-[clamp(2rem,1.5385rem+2.0513vw,4rem)]">
        <h1 className="text-xl sm:text-2xl xl:text-[clamp(1.5rem,1.3846rem+0.5128vw,2rem)] font-Manrope-SemiBold text-[#4F5338] mb-4 sm:mb-6 xl:mb-[clamp(1.5rem,1.2692rem+1.0256vw,2.5rem)]">
          Настройки профиля
        </h1>

        {/* Карточка профиля */}
        <div className="rounded-[12px] sm:rounded-[16px] xl:rounded-[clamp(1rem,0.8846rem+0.5128vw,1.5rem)] border border-[#EEE7DC] bg-white p-4 sm:p-6 xl:p-[clamp(1.5rem,1.1538rem+1.5385vw,3rem)] mb-4 sm:mb-6 xl:mb-[clamp(1.5rem,1.2692rem+1.0256vw,2.5rem)]">
          <div className="mb-4 sm:mb-6 xl:mb-[clamp(1.25rem,1.0192rem+1.0256vw,2.25rem)] flex items-center gap-3 sm:gap-4 xl:gap-[clamp(0.75rem,0.6346rem+0.5128vw,1.25rem)]">
            <div className="relative flex-shrink-0">
              <Image
                src={userImage || "/avatar-placeholder.png"}
                alt="avatar"
                width={64}
                height={64}
                className="w-14 h-14 sm:w-16 sm:h-16 xl:h-[clamp(3.5rem,3.2692rem+1.0256vw,4.5rem)] xl:w-[clamp(3.5rem,3.2692rem+1.0256vw,4.5rem)] rounded-full object-cover border-2 border-white"
              />
              <button
                type="button"
                onClick={handleAvatarClick}
                disabled={uploadingAvatar}
                className="absolute -right-1 -bottom-1 grid h-6 w-6 sm:h-7 sm:w-7 xl:h-[clamp(1.5rem,1.3846rem+0.5128vw,2rem)] xl:w-[clamp(1.5rem,1.3846rem+0.5128vw,2rem)] place-items-center rounded-full bg-[#5C6744] text-white text-sm sm:text-base xl:text-[clamp(0.875rem,0.8077rem+0.2985vw,1.125rem)] hover:bg-[#4F5338] disabled:opacity-50 transition cursor-pointer"
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
            <div className="flex-1 min-w-0">
              <div className="font-Manrope-SemiBold text-base sm:text-lg xl:text-[clamp(1rem,0.8846rem+0.5128vw,1.5rem)] text-[#4F5338] truncate">{userName}</div>
              <div className="text-sm sm:text-base xl:text-[clamp(0.875rem,0.8077rem+0.2985vw,1.125rem)] text-[#636846] truncate">{userEmail}</div>
            </div>
          </div>

          {/* Поля как в макете */}
          <div className="mt-3 sm:mt-4 xl:mt-[clamp(1rem,0.7692rem+1.0256vw,2rem)] space-y-3 sm:space-y-4 xl:space-y-[clamp(1rem,0.8846rem+0.5128vw,1.5rem)]">
            <label className="block">
              <span className="mb-1.5 sm:mb-2 xl:mb-[clamp(0.5rem,0.4423rem+0.2564vw,0.75rem)] block text-sm sm:text-base xl:text-[clamp(0.875rem,0.8077rem+0.2985vw,1.125rem)] font-ManropeMedium text-[#4F5338]">Имя и фамилия</span>
              <input
                type="text"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (errors.name) setErrors({ ...errors, name: "" });
                }}
                placeholder="Ирина Иванова"
                disabled={loading}
                className={`w-full rounded-[8px] sm:rounded-[10px] xl:rounded-[clamp(0.5rem,0.4423rem+0.2564vw,0.75rem)] border px-3 sm:px-4 xl:px-[clamp(0.75rem,0.6346rem+0.5128vw,1.25rem)] py-2 sm:py-2.5 xl:py-[clamp(0.625rem,0.5096rem+0.5128vw,1.125rem)] text-sm sm:text-base xl:text-[clamp(0.875rem,0.8077rem+0.2985vw,1.125rem)] font-ManropeRegular text-[#636846] outline-none focus:border-[#5C6744] disabled:opacity-50 transition ${
                  errors.name
                    ? "border-red-300 bg-red-50"
                    : "border-[#EEE7DC] bg-white"
                }`}
              />
              {errors.name && (
                <span className="mt-1 sm:mt-1.5 xl:mt-[clamp(0.25rem,0.1923rem+0.2564vw,0.5rem)] block text-xs sm:text-sm xl:text-[clamp(0.75rem,0.6923rem+0.2564vw,1rem)] text-red-600">{errors.name}</span>
              )}
            </label>

            <label className="block">
              <span className="mb-1.5 sm:mb-2 xl:mb-[clamp(0.5rem,0.4423rem+0.2564vw,0.75rem)] block text-sm sm:text-base xl:text-[clamp(0.875rem,0.8077rem+0.2985vw,1.125rem)] font-ManropeMedium text-[#4F5338]">Дата рождения</span>
              <input
                type="text"
                value={birthDate}
                onChange={(e) => handleBirthDateChange(e.target.value)}
                placeholder="12.04.1987"
                disabled={loading}
                maxLength={10}
                className={`w-full rounded-[8px] sm:rounded-[10px] xl:rounded-[clamp(0.5rem,0.4423rem+0.2564vw,0.75rem)] border px-3 sm:px-4 xl:px-[clamp(0.75rem,0.6346rem+0.5128vw,1.25rem)] py-2 sm:py-2.5 xl:py-[clamp(0.625rem,0.5096rem+0.5128vw,1.125rem)] text-sm sm:text-base xl:text-[clamp(0.875rem,0.8077rem+0.2985vw,1.125rem)] font-ManropeRegular text-[#636846] outline-none focus:border-[#5C6744] disabled:opacity-50 transition ${
                  errors.birthDate
                    ? "border-red-300 bg-red-50"
                    : "border-[#EEE7DC] bg-white"
                }`}
              />
              {errors.birthDate && (
                <span className="mt-1 sm:mt-1.5 xl:mt-[clamp(0.25rem,0.1923rem+0.2564vw,0.5rem)] block text-xs sm:text-sm xl:text-[clamp(0.75rem,0.6923rem+0.2564vw,1rem)] text-red-600">{errors.birthDate}</span>
              )}
            </label>

            <label className="block">
              <span className="mb-1.5 sm:mb-2 xl:mb-[clamp(0.5rem,0.4423rem+0.2564vw,0.75rem)] block text-sm sm:text-base xl:text-[clamp(0.875rem,0.8077rem+0.2985vw,1.125rem)] font-ManropeMedium text-[#4F5338]">Электронная почта</span>
              <input
                type="email"
                value={userEmail}
                disabled
                placeholder="Realog@mail.com"
                className="w-full rounded-[8px] sm:rounded-[10px] xl:rounded-[clamp(0.5rem,0.4423rem+0.2564vw,0.75rem)] border border-[#EEE7DC] bg-[#F6F2EA] px-3 sm:px-4 xl:px-[clamp(0.75rem,0.6346rem+0.5128vw,1.25rem)] py-2 sm:py-2.5 xl:py-[clamp(0.625rem,0.5096rem+0.5128vw,1.125rem)] text-sm sm:text-base xl:text-[clamp(0.875rem,0.8077rem+0.2985vw,1.125rem)] font-ManropeRegular text-[#636846] outline-none cursor-not-allowed opacity-60"
              />
            </label>

            <label className="block">
              <span className="mb-1.5 sm:mb-2 xl:mb-[clamp(0.5rem,0.4423rem+0.2564vw,0.75rem)] block text-sm sm:text-base xl:text-[clamp(0.875rem,0.8077rem+0.2985vw,1.125rem)] font-ManropeMedium text-[#4F5338]">Номер телефона</span>
              <input
                type="tel"
                value={phone}
                onChange={(e) => handlePhoneChange(e.target.value)}
                placeholder="+7 (900) 800-76-56"
                disabled={loading}
                maxLength={18}
                className={`w-full rounded-[8px] sm:rounded-[10px] xl:rounded-[clamp(0.5rem,0.4423rem+0.2564vw,0.75rem)] border px-3 sm:px-4 xl:px-[clamp(0.75rem,0.6346rem+0.5128vw,1.25rem)] py-2 sm:py-2.5 xl:py-[clamp(0.625rem,0.5096rem+0.5128vw,1.125rem)] text-sm sm:text-base xl:text-[clamp(0.875rem,0.8077rem+0.2985vw,1.125rem)] font-ManropeRegular text-[#636846] outline-none focus:border-[#5C6744] disabled:opacity-50 transition ${
                  errors.phone
                    ? "border-red-300 bg-red-50"
                    : "border-[#EEE7DC] bg-white"
                }`}
              />
              {errors.phone && (
                <span className="mt-1 sm:mt-1.5 xl:mt-[clamp(0.25rem,0.1923rem+0.2564vw,0.5rem)] block text-xs sm:text-sm xl:text-[clamp(0.75rem,0.6923rem+0.2564vw,1rem)] text-red-600">{errors.phone}</span>
              )}
            </label>

            <button
              type="button"
              onClick={handleSave}
              disabled={saving || loading}
              className="mt-2 sm:mt-3 xl:mt-[clamp(0.5rem,0.3846rem+0.5128vw,1rem)] inline-flex items-center justify-center rounded-[8px] sm:rounded-[10px] xl:rounded-[clamp(0.5rem,0.4423rem+0.2564vw,0.75rem)] bg-[#5C6744] px-4 sm:px-6 xl:px-[clamp(1.25rem,1.0192rem+1.0256vw,2.25rem)] py-2.5 sm:py-3 xl:py-[clamp(0.75rem,0.6346rem+0.5128vw,1.25rem)] text-sm sm:text-base xl:text-[clamp(0.875rem,0.8077rem+0.2985vw,1.125rem)] font-ManropeMedium text-white hover:bg-[#4F5338] disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              {saving ? "Сохранение..." : "Сохранить изменения"}
            </button>
          </div>
        </div>

        {/* Смена пароля */}
        <div className="rounded-[12px] sm:rounded-[16px] xl:rounded-[clamp(1rem,0.8846rem+0.5128vw,1.5rem)] border border-[#EEE7DC] bg-white p-4 sm:p-6 xl:p-[clamp(1.5rem,1.1538rem+1.5385vw,3rem)] mb-4 sm:mb-6 xl:mb-[clamp(1.5rem,1.2692rem+1.0256vw,2.5rem)]">
          <h2 className="mb-3 sm:mb-4 xl:mb-[clamp(1rem,0.8846rem+0.5128vw,1.5rem)] text-base sm:text-lg xl:text-[clamp(1.125rem,1.0385rem+0.3846vw,1.5rem)] font-Manrope-SemiBold text-[#4F5338]">Смена пароля</h2>
          <ChangePasswordForm />
        </div>

        {/* Низ страницы */}
        <div className="space-y-2 sm:space-y-3 xl:space-y-[clamp(0.75rem,0.6346rem+0.5128vw,1.25rem)]">
          <button
            onClick={handleLogout}
            className="text-sm sm:text-base xl:text-[clamp(0.875rem,0.8077rem+0.2985vw,1.125rem)] font-ManropeMedium text-[#CF5E5E] hover:underline transition"
          >
            Выйти
          </button>

          <details className="group">
            <summary className="flex cursor-pointer select-none items-center gap-1 sm:gap-1.5 xl:gap-[clamp(0.25rem,0.1923rem+0.2564vw,0.5rem)] text-sm sm:text-base xl:text-[clamp(0.875rem,0.8077rem+0.2985vw,1.125rem)] font-ManropeMedium text-[#4F5338]">
              Другие действия
              <svg
                className="ml-1 sm:ml-1.5 xl:ml-[clamp(0.25rem,0.1923rem+0.2564vw,0.5rem)] h-4 w-4 sm:h-5 sm:w-5 xl:h-[clamp(1rem,0.8846rem+0.5128vw,1.5rem)] xl:w-[clamp(1rem,0.8846rem+0.5128vw,1.5rem)] transition group-open:rotate-180"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#4F5338"
                strokeWidth="2"
              >
                <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </summary>
            <div className="mt-2 sm:mt-2.5 xl:mt-[clamp(0.5rem,0.4423rem+0.2564vw,0.75rem)] pl-3 sm:pl-4 xl:pl-[clamp(1rem,0.8846rem+0.5128vw,1.5rem)]">
              <button className="text-sm sm:text-base xl:text-[clamp(0.875rem,0.8077rem+0.2985vw,1.125rem)] font-ManropeMedium text-[#CF5E5E] hover:underline transition">
                Удалить аккаунт
              </button>
            </div>
          </details>
        </div>
      </div>
      <div className="h-24 sm:h-32 md:h-40 xl:h-[clamp(8rem,6.1538rem+8.2051vw,16rem)]" />
    </div>
  );
}
