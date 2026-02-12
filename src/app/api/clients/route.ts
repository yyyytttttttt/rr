import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../lib/auth";
import { prisma } from "../../../lib/prizma";
import { logger } from "../../../lib/logger";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  // NOTE: Only admins can access - check role from database
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { role: true },
  });

  if (!user || (user.role !== "ADMIN" && user.role !== "DOCTOR")) {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  }

  const url = new URL(req.url);
  const q = (url.searchParams.get("query") ?? "").trim();
  const page = Math.max(1, Number(url.searchParams.get("page") ?? 1));
  const pageSize = Math.min(100, Math.max(1, Number(url.searchParams.get("pageSize") ?? 20)));

  logger.info("GET /api/clients - query:", q, "page:", page, "pageSize:", pageSize);

  try {
    // Build where clause for search
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

    // Get total count
    const total = await prisma.user.count({ where });

    // Get paginated users
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
      discount: 0, // TODO: Add discount field to User model if needed
    }));

    logger.info(`GET /api/clients - found ${items.length} clients (total: ${total})`);

    return NextResponse.json({ items, total, page, pageSize });
  } catch (error) {
    logger.error("Failed to fetch clients:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
