// middleware.ts
import { withAuth, type NextRequestWithAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";
import type { JWT } from "next-auth/jwt";
import { randomBytes } from "crypto";

const CSP_STRICT = process.env.CSP_STRICT === '1';

/** Build nonce-based CSP. Called only when CSP_STRICT=1. */
function buildNonceCsp(nonce: string): string {
  return [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}'`,
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.googleapis.com https://fonts.gstatic.com",
    "img-src 'self' data: https://res.cloudinary.com https://lh3.googleusercontent.com https://images.unsplash.com https://i.pravatar.cc",
    "connect-src 'self' https://api.yandex.com https://maps.yandex.ru",
    "frame-src 'self' https://yandex.ru https://maps.yandex.ru",
  ].join('; ');
}

/** NextResponse.next() with nonce injected into request headers + CSP on response. */
function nextWithNonce(req: NextRequestWithAuth): NextResponse {
  if (!CSP_STRICT) return NextResponse.next();
  const nonce = randomBytes(16).toString('base64');
  const reqHeaders = new Headers(req.headers);
  reqHeaders.set('x-nonce', nonce);
  const res = NextResponse.next({ request: { headers: reqHeaders } });
  res.headers.set('Content-Security-Policy', buildNonceCsp(nonce));
  return res;
}

// Роли
type Role = "ADMIN" | "DOCTOR" | "USER";

// JWT с нашими полями
type AppJWT = JWT & {
  uid?: string;
  role?: Role;
};

// Публичные origins (не содержат имён контейнеров/внутренней сети).
// Имена Docker-контейнеров, локальные IP и адреса разработки — через EXTRA_ALLOWED_ORIGINS в .env
const _extraOrigins = process.env.EXTRA_ALLOWED_ORIGINS
  ? process.env.EXTRA_ALLOWED_ORIGINS.split(',').map((s) => s.trim()).filter(Boolean)
  : [];

const ALLOWED_ORIGINS = [
  'https://nikropolis.ru',
  'https://novay-y.com',
  ..._extraOrigins,
];

// Матрица доступа (обрати внимание: БЕЗ "as const" у массивов allow)
const roleMap: ReadonlyArray<{ prefix: `/${string}`; allow: readonly Role[] }> = [
  { prefix: "/admin",   allow: ["ADMIN", "DOCTOR"] },
  { prefix: "/doctor",  allow: ["DOCTOR", "ADMIN"] },
  { prefix: "/profile", allow: ["USER", "DOCTOR", "ADMIN"] },
];

function findRule(pathname: string) {
  return roleMap.find((r) => pathname.startsWith(r.prefix));
}

// Функция для добавления CORS заголовков
function addCorsHeaders(response: NextResponse, origin: string | null): NextResponse {
  if (origin && ALLOWED_ORIGINS.includes(origin)) {
    response.headers.set('Access-Control-Allow-Origin', origin);
    response.headers.set('Access-Control-Allow-Credentials', 'true');
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
    response.headers.set(
      'Access-Control-Allow-Headers',
      'Content-Type, Authorization, X-Requested-With, Accept, Origin'
    );
  }
  return response;
}

export default withAuth(
  function middleware(req: NextRequestWithAuth) {
    const { pathname } = req.nextUrl;
    const origin = req.headers.get('origin');

    // Обработка preflight запросов (OPTIONS) - отвечаем сразу с CORS headers
    if (req.method === 'OPTIONS') {
      const response = new NextResponse(null, { status: 200 });
      return addCorsHeaders(response, origin);
    }

    // JWT из withAuth (см. callbacks в authOptions)
    const token = req.nextauth?.token as AppJWT | undefined;
    const role: Role | undefined = token?.role;

    const rule = findRule(pathname);

    // Для API роутов всегда добавляем CORS заголовки
    if (pathname.startsWith('/api/')) {
      if (!rule) {
        // API путь не защищён — пропускаем с CORS заголовками
        const response = NextResponse.next();
        return addCorsHeaders(response, origin);
      }

      // API путь защищён — проверяем роль
      if (!role || !rule.allow.includes(role)) {
        const response = NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        );
        return addCorsHeaders(response, origin);
      }

      const response = NextResponse.next();
      return addCorsHeaders(response, origin);
    }

    // Для не-API роутов
    if (!rule) {
      // путь не защищён — пропускаем (с nonce если CSP_STRICT)
      return nextWithNonce(req);
    }

    // нет роли или роль не разрешена — редирект на логин
    if (!role || !rule.allow.includes(role)) {
      const url = new URL("/Login", req.url);
      url.searchParams.set("from", pathname);
      return NextResponse.redirect(url);
    }

    // Перенаправление на основной раздел для роли
    // Если ADMIN или DOCTOR заходит на /profile, перенаправляем на их раздел
    if (pathname.startsWith("/profile") && role === "ADMIN") {
      return NextResponse.redirect(new URL("/admin", req.url));
    }
    if (pathname.startsWith("/profile") && role === "DOCTOR") {
      return NextResponse.redirect(new URL("/doctor", req.url));
    }

    return nextWithNonce(req);
  },
  {
    callbacks: {
      authorized: ({ req, token }) => {
        const path = req.nextUrl.pathname;

        // Всегда разрешаем OPTIONS для CORS preflight
        if (req.method === 'OPTIONS') return true;

        // Публичные API endpoints (доступны без авторизации)
        // Exact paths: no startsWith prefix — prevents accidental exposure of new routes
        const publicExact = new Set([
          '/api/auth/',
          '/api/services/categories',
          '/api/services/catalog',
          '/api/services/list',
          '/api/doctors/list',
          '/api/availability',
          '/api/doctor/slots',
          '/api/bookings/guest',
          '/api/register',
          '/api/resend',
          '/api/request-password-reset',
          '/api/reset-password',
          '/api/health',
        ]);
        // Prefix-match only for well-scoped namespaces
        const publicPrefixes = [
          '/api/mobile/',   // JWT checked per-route inside
          '/api/auth/',     // NextAuth internal
        ];

        if (
          publicExact.has(path) ||
          publicPrefixes.some(p => path.startsWith(p))
        ) {
          return true;
        }

        // Остальные требуют авторизацию
        return Boolean(token);
      },
    },
  }
);

export const config = {
  matcher: [
    "/profile",
    "/profile/:path*",
    "/admin",
    "/admin/:path*",
    "/doctor",
    "/doctor/:path*",
    "/protected/:path*",
    '/api/:path*',
  ],
};
