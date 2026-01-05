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

// Матрица доступа (обрати внимание: БЕЗ "as const" у массивов allow)
const roleMap: ReadonlyArray<{ prefix: `/${string}`; allow: readonly Role[] }> = [
  { prefix: "/admin",   allow: ["ADMIN", "DOCTOR"] },
  { prefix: "/doctor",  allow: ["DOCTOR", "ADMIN"] },
  { prefix: "/profile", allow: ["USER", "DOCTOR", "ADMIN"] },
];

function findRule(pathname: string) {
  return roleMap.find((r) => pathname.startsWith(r.prefix));
}

export default withAuth(
  function middleware(req: NextRequestWithAuth) {
    const { pathname } = req.nextUrl;

    // JWT из withAuth (см. callbacks в authOptions)
    const token = req.nextauth?.token as AppJWT | undefined;
    const role: Role | undefined = token?.role;

    const rule = findRule(pathname);
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
      // пускаем только если токен есть (залогинен)
      authorized: ({ token }) => Boolean(token),
    },
  }
);

 
 import type { NextRequest } from 'next/server';

 // Домены, которым разрешен доступ к API
 const ALLOWED_ORIGINS = [
   'https://mobileapp-mobileappfront-xo0l93-b56dfe-46-149-71-119.traefik.me',
   'http://localhost:3000',
 ];

 export function middleware(request: NextRequest) {
   const origin = request.headers.get('origin');
   const response = NextResponse.next();

   // Проверяем разрешен ли origin
   if (origin && ALLOWED_ORIGINS.includes(origin)) {
     response.headers.set('Access-Control-Allow-Origin', origin);
     response.headers.set('Access-Control-Allow-Credentials', 'true');
     response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
     response.headers.set(
       'Access-Control-Allow-Headers',
       'Content-Type, Authorization, X-Requested-With, Accept, Origin'
     );
   }

   // Обработка preflight запросов
   if (request.method === 'OPTIONS') {
     return new NextResponse(null, {
       status: 200,
       headers: response.headers,
     });
   }

   return response;
 }


 


//
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
