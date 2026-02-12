// app/api/promos/verify/route.ts
import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prizma";
import { z } from "zod";
import { serverError } from "../../../../lib/api-error";

const bodySchema = z.object({
  code: z.string().min(1).max(50),
  servicePriceCents: z.number().int().min(0),
});

/**
 * POST /api/promos/verify
 * Проверить промокод и вернуть информацию о скидке
 * Body:
 *   - code: string - Код промокода
 *   - servicePriceCents: number - Цена услуги для расчёта скидки
 *
 * Response:
 *   {
 *     valid: boolean,
 *     discountCents?: number,
 *     finalPriceCents?: number,
 *     message?: string,
 *     promo?: { id, code, description }
 *   }
 */
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);
    const parsed = bodySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "VALIDATION", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { code, servicePriceCents } = parsed.data;

    // Поиск промокода (case-insensitive)
    const promo = await prisma.promoCode.findFirst({
      where: {
        code: {
          equals: code,
          mode: "insensitive",
        },
      },
      select: {
        id: true,
        code: true,
        discountPercent: true,
        discountCents: true,
        currency: true,
        validFrom: true,
        validUntil: true,
        maxUses: true,
        usedCount: true,
        isActive: true,
        description: true,
      },
    });

    if (!promo) {
      return NextResponse.json({
        valid: false,
        message: "Промокод не найден",
      });
    }

    // Проверка активности
    if (!promo.isActive) {
      return NextResponse.json({
        valid: false,
        message: "Промокод неактивен",
      });
    }

    // Проверка даты действия
    const now = new Date();
    if (promo.validFrom && now < promo.validFrom) {
      return NextResponse.json({
        valid: false,
        message: "Промокод ещё не действителен",
      });
    }

    if (promo.validUntil && now > promo.validUntil) {
      return NextResponse.json({
        valid: false,
        message: "Срок действия промокода истёк",
      });
    }

    // Проверка лимита использований
    if (promo.maxUses !== null && promo.usedCount >= promo.maxUses) {
      return NextResponse.json({
        valid: false,
        message: "Промокод исчерпан",
      });
    }

    // Расчёт скидки
    let discountCents = 0;

    if (promo.discountPercent !== null) {
      // Процентная скидка
      discountCents = Math.floor((servicePriceCents * promo.discountPercent) / 100);
    } else if (promo.discountCents !== null) {
      // Фиксированная скидка
      discountCents = promo.discountCents;
    }

    // Скидка не может быть больше цены услуги
    discountCents = Math.min(discountCents, servicePriceCents);
    const finalPriceCents = Math.max(0, servicePriceCents - discountCents);

    return NextResponse.json({
      valid: true,
      discountCents,
      finalPriceCents,
      promo: {
        id: promo.id,
        code: promo.code,
        description: promo.description,
      },
      message: `Скидка применена${promo.description ? `: ${promo.description}` : ""}`,
    });
  } catch (e: unknown) {
    return serverError('VERIFY_PROMO_ERR', e);
  }
}
