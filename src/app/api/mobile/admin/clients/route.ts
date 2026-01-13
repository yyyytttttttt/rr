import { NextRequest, NextResponse } from "next/server";
import { requireAuth, createCorsResponse } from "../../../../../lib/jwt";
import { prisma } from "../../../../../lib/prizma";

export async function OPTIONS(request: NextRequest) {
  return createCorsResponse(request);
}

export async function GET(req: NextRequest) {
  const auth = requireAuth(req, ['ADMIN']);

  if ('error' in auth) {
    return auth.error;
  }

  const url = new URL(req.url);
  const q = (url.searchParams.get("query") ?? "").trim();
  const page = Math.max(1, Number(url.searchParams.get("page") ?? 1));
  const pageSize = Math.min(100, Math.max(1, Number(url.searchParams.get("pageSize") ?? 20)));

  console.log("[MOBILE_ADMIN_CLIENTS] GET - query:", q, "page:", page, "pageSize:", pageSize);

  try {
    const where = q
      ? {
          role: "USER" as const,
          OR: [
            { name: { contains: q, mode: "insensitive" as const } },
            { email: { contains: q, mode: "insensitive" as const } },
            { phone: { contains: q, mode: "insensitive" as const } },
          ],
        }
      : { role: "USER" as const };

    const total = await prisma.user.count({ where });

    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        image: true,
        createdAt: true,
        _count: {
          select: {
            bookings: {
              where: {
                status: { in: ["CONFIRMED", "COMPLETED"] },
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    const items = users.map((user) => ({
      id: user.id,
      name: user.name || "Без имени",
      email: user.email || "",
      phone: user.phone || "",
      image: user.image,
      visits: user._count.bookings,
      discount: 0,
    }));

    console.log(`[MOBILE_ADMIN_CLIENTS] Found ${items.length} clients (total: ${total})`);

    return NextResponse.json({ items, total, page, pageSize });
  } catch (error) {
    console.error("[MOBILE_ADMIN_CLIENTS] Error:", error);
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 });
  }
}
