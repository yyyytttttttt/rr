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

// где срабатывает middleware - ТОЛЬКО конкретные защищённые пути
export const config = {
  matcher: [
    "/profile",
    "/profile/:path*",
    "/admin",
    "/admin/:path*",
    "/doctor",
    "/doctor/:path*",
    "/protected/:path*"
  ],
};
