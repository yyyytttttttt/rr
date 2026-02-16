"use client";

import { useEffect, useState, useCallback } from "react";
import toast from "react-hot-toast";

type Platform = "ios" | "android" | "desktop";

function detectPlatform(): Platform {
  if (typeof navigator === "undefined") return "desktop";
  const ua = navigator.userAgent.toLowerCase();
  if (/iphone|ipad|ipod/.test(ua)) return "ios";
  if (/android/.test(ua)) return "android";
  return "desktop";
}

function fallbackCopy(text: string): boolean {
  const ta = document.createElement("textarea");
  ta.value = text;
  ta.style.position = "fixed";
  ta.style.left = "-9999px";
  document.body.appendChild(ta);
  ta.select();
  let ok = false;
  try {
    ok = document.execCommand("copy");
  } catch {
    // ignore
  }
  document.body.removeChild(ta);
  return ok;
}

export default function BusinessCardClient() {
  const [platform, setPlatform] = useState<Platform>("desktop");
  const [walletLoading, setWalletLoading] = useState(false);

  useEffect(() => {
    setPlatform(detectPlatform());
  }, []);

  const handleWallet = useCallback(async (type: "apple" | "google") => {
    setWalletLoading(true);
    try {
      const endpoint =
        type === "apple"
          ? "/api/business-card/apple-pass"
          : "/api/business-card/google-pass";

      const res = await fetch(endpoint);

      if (res.status === 503) {
        // Certificates not configured — fall back to vCard
        toast("Wallet недоступен. Скачиваем контакт...", { icon: "ℹ️" });
        window.location.href = "/api/business-card/vcard";
        return;
      }

      if (type === "google" && res.redirected) {
        // Google Pass returns a redirect to pay.google.com
        window.location.href = res.url;
        return;
      }

      if (!res.ok) {
        toast.error("Не удалось создать карточку");
        return;
      }

      // Apple pass — download the blob
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "contact.pkpass";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      toast.error("Ошибка соединения");
    } finally {
      setWalletLoading(false);
    }
  }, []);

  const handleShare = useCallback(async () => {
    const url = window.location.href;
    const title = "Электронная визитка — Новая Я";

    // 1) Try native share (requires secure context)
    if (typeof navigator.share === "function") {
      try {
        await navigator.share({ title, url });
        return;
      } catch {
        // User cancelled or not supported — fall through
      }
    }

    // 2) Try clipboard API (requires secure context)
    if (typeof navigator.clipboard?.writeText === "function") {
      try {
        await navigator.clipboard.writeText(url);
        toast.success("Ссылка скопирована");
        return;
      } catch {
        // Not allowed — fall through
      }
    }

    // 3) Fallback: execCommand('copy')
    if (fallbackCopy(url)) {
      toast.success("Ссылка скопирована");
      return;
    }

    // 4) Last resort: show the URL in a toast so user can copy manually
    toast(
      (t) => (
        <div className="flex flex-col gap-2">
          <span className="text-sm font-medium">Скопируйте ссылку:</span>
          <input
            readOnly
            value={url}
            className="text-xs border rounded px-2 py-1 w-full select-all"
            onFocus={(e) => e.target.select()}
          />
          <button
            onClick={() => toast.dismiss(t.id)}
            className="text-xs text-gray-500 underline self-end"
          >
            Закрыть
          </button>
        </div>
      ),
      { duration: 10000 },
    );
  }, []);

  return (
    <div className="min-h-screen bg-[#FFFCF3] flex flex-col items-center justify-center px-4 py-8 sm:py-12">
      {/* Card preview */}
      <div className="w-full max-w-sm bg-white rounded-[20px] border border-[#E8E2D5] shadow-sm overflow-hidden mb-6 sm:mb-8">
        {/* Card header */}
        <div className="bg-[#5C6744] px-6 py-8 sm:py-10 text-center">
          <h1 className="text-xl sm:text-2xl font-ManropeBold text-white mb-1">
            Новая Я
          </h1>
          <p className="text-sm sm:text-base font-ManropeRegular text-white/80">
            Клиника эстетической медицины
          </p>
        </div>

        {/* Card body */}
        <div className="px-6 py-5 sm:py-6 space-y-3">
          <CardRow
            icon={
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
              </svg>
            }
            label="Телефон"
            id="phone"
          />
          <CardRow
            icon={
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 0115 0z" />
              </svg>
            }
            label="Адрес"
            id="address"
          />
          <CardRow
            icon={
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418" />
              </svg>
            }
            label="Сайт"
            id="website"
          />
        </div>
      </div>

      {/* Action buttons */}
      <div className="w-full max-w-sm space-y-3">
        {/* Platform-specific wallet button */}
        {platform === "ios" && (
          <button
            onClick={() => handleWallet("apple")}
            disabled={walletLoading}
            className="flex items-center justify-center w-full rounded-[12px] bg-[#5C6744] text-white text-sm sm:text-base font-ManropeRegular py-3 sm:py-3.5 hover:bg-[#4F5938] transition-colors disabled:opacity-60"
          >
            {walletLoading ? "Загрузка..." : "Добавить в Apple Wallet"}
          </button>
        )}
        {platform === "android" && (
          <button
            onClick={() => handleWallet("google")}
            disabled={walletLoading}
            className="flex items-center justify-center w-full rounded-[12px] bg-[#5C6744] text-white text-sm sm:text-base font-ManropeRegular py-3 sm:py-3.5 hover:bg-[#4F5938] transition-colors disabled:opacity-60"
          >
            {walletLoading ? "Загрузка..." : "Добавить в Google Wallet"}
          </button>
        )}

        {/* vCard download — always visible */}
        <a
          href="/api/business-card/vcard"
          className={`flex items-center justify-center w-full rounded-[12px] text-sm sm:text-base font-ManropeRegular py-3 sm:py-3.5 transition-colors ${
            platform === "desktop"
              ? "bg-[#5C6744] text-white hover:bg-[#4F5938]"
              : "bg-[#F5F0E4] text-[#967450] hover:bg-[#E8E2D5]"
          }`}
        >
          Скачать контакт
        </a>

        {/* Share button */}
        <button
          onClick={handleShare}
          className="flex items-center justify-center w-full rounded-[12px] bg-[#F5F0E4] text-[#967450] text-sm sm:text-base font-ManropeRegular py-3 sm:py-3.5 hover:bg-[#E8E2D5] transition-colors"
        >
          Поделиться
        </button>
      </div>

      {/* Back link */}
      <a
        href="/"
        className="mt-8 text-sm font-ManropeRegular text-[#967450] hover:text-[#7A5D3E] transition-colors"
      >
        На главную
      </a>
    </div>
  );
}

function CardRow({ icon, label, id }: { icon: React.ReactNode; label: string; id: string }) {
  return (
    <div className="flex items-center gap-3 text-[#4F5338]" data-field={id}>
      <span className="text-[#967450] shrink-0">{icon}</span>
      <span className="text-sm sm:text-base font-ManropeRegular">{label}</span>
    </div>
  );
}
