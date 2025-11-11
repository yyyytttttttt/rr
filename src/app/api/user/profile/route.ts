import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../../lib/auth";
import { prisma } from "../../../../lib/prizma";
import { z } from "zod";

const updateProfileSchema = z.object({
  name: z
    .string()
    .min(2, "Имя должно содержать минимум 2 символа")
    .max(100, "Имя слишком длинное"),
  phone: z
    .string()
    .optional()
    .nullable()
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
    .nullable()
    .refine(
      (val) => {
        if (!val || val.trim() === "") return true;
        // Allow both DD.MM.YYYY and YYYY-MM-DD formats
        const ddmmyyyyRegex = /^(\d{2})\.(\d{2})\.(\d{4})$/;
        const isoRegex = /^\d{4}-\d{2}-\d{2}$/;
        return ddmmyyyyRegex.test(val) || isoRegex.test(val);
      },
      { message: "Неверный формат даты" }
    ),
});

export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const parsed = updateProfileSchema.safeParse(body);

    if (!parsed.success) {
      const firstError = parsed.error.issues[0];
      return NextResponse.json({
        error: firstError?.message || "VALIDATION_ERROR",
        details: parsed.error.issues
      }, { status: 400 });
    }

    const { name, phone, birthDate } = parsed.data;

    // Parse birthDate if provided (convert DD.MM.YYYY to ISO)
    let birthDateISO: Date | null = null;
    if (birthDate) {
      // Try DD.MM.YYYY format first
      const ddmmyyyyMatch = birthDate.match(/^(\d{2})\.(\d{2})\.(\d{4})$/);
      if (ddmmyyyyMatch) {
        const [, day, month, year] = ddmmyyyyMatch;
        birthDateISO = new Date(`${year}-${month}-${day}`);
      } else {
        // Try ISO format
        birthDateISO = new Date(birthDate);
      }

      if (isNaN(birthDateISO.getTime())) {
        return NextResponse.json({ error: "INVALID_DATE_FORMAT" }, { status: 400 });
      }
    }

    // Update user profile
    console.log(`[PATCH /api/user/profile] Updating user ${session.user.id}:`, {
      name,
      phone: phone || null,
      birthDateISO: birthDateISO || null,
    });

    const updated = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        ...(name !== undefined && { name }),
        ...(phone !== undefined && { phone }),
        ...(birthDateISO !== null && { birthDate: birthDateISO }),
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        birthDate: true,
        image: true,
      },
    });

    console.log(`[PATCH /api/user/profile] Successfully updated user ${session.user.id}`);

    return NextResponse.json({
      ok: true,
      user: {
        ...updated,
        birthDate: updated.birthDate ? updated.birthDate.toISOString().split('T')[0] : null,
      }
    });
  } catch (error) {
    console.error("Failed to update profile:", error);
    return NextResponse.json({ error: "INTERNAL_SERVER_ERROR" }, { status: 500 });
  }
}

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        birthDate: true,
        image: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "USER_NOT_FOUND" }, { status: 404 });
    }

    return NextResponse.json({
      user: {
        ...user,
        birthDate: user.birthDate ? user.birthDate.toISOString().split('T')[0] : null,
      }
    });
  } catch (error) {
    console.error("Failed to fetch profile:", error);
    return NextResponse.json({ error: "INTERNAL_SERVER_ERROR" }, { status: 500 });
  }
}
