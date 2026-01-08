// middleware.ts
import { withAuth, type NextRequestWithAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";
import type { JWT } from "next-auth/jwt";

// Роли
type Role = "ADMIN" | "DOCTOR" | "USER";

// JWT с нашими полями
type AppJWT = JWT & {
  uid?: string;
  role?: Role;
};

// Домены, которым разрешен доступ к API
const ALLOWED_ORIGINS = [
  'https://nikropolis.ru',
  'https://novay-y.com',
  'http://localhost:3000',
  'http://192.168.0.156:3000', // для локальной разработки
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

    // Пропускаем публичные мобильные API без проверки авторизации
    if (pathname.startsWith('/api/mobile/')) {
      const response = NextResponse.next();
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
      // путь не защищён — пропускаем
      return NextResponse.next();
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

    return NextResponse.next();
  },
  {
    callbacks: {
      // пускаем OPTIONS запросы без авторизации (для CORS preflight)
      // остальные запросы - только если токен есть (залогинен)
      authorized: ({ req, token }) => {
        if (req.method === 'OPTIONS') return true;
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
