/**
 * Server-side booking price calculator.
 * Pure read — no side effects, no mutations.
 */
import { prisma } from './prizma';

export type QuoteResult = {
  baseAmountCents: number;
  discountAmountCents: number;
  finalAmountCents: number;
  currency: string;
  totalDurationMin: number;
  services: Array<{ id: string; name: string; priceCents: number; durationMin: number }>;
  promoValid: boolean;
  promoMessage: string;
  promoId: string | null;
  discountPercent: number | null;
  discountCentsFixed: number | null;
};

export async function calculateBookingQuote(args: {
  serviceIds: string[];
  promoCode?: string;
  userId?: string;
}): Promise<QuoteResult> {
  const { serviceIds, promoCode, userId } = args;

  // 1. Fetch all requested services
  const services = await prisma.service.findMany({
    where: { id: { in: serviceIds }, isActive: true },
    select: { id: true, name: true, priceCents: true, currency: true, durationMin: true },
  });

  if (services.length !== serviceIds.length) {
    const found = new Set(services.map((s) => s.id));
    const missing = serviceIds.filter((id) => !found.has(id));
    throw new QuoteError(`Услуги не найдены: ${missing.join(', ')}`, 'SERVICES_NOT_FOUND');
  }

  // 2. All services must share the same currency
  const currencies = new Set(services.map((s) => s.currency));
  if (currencies.size > 1) {
    throw new QuoteError('Услуги имеют разные валюты', 'CURRENCY_MISMATCH');
  }

  const currency = services[0].currency;
  const baseAmountCents = services.reduce((sum, s) => sum + s.priceCents, 0);
  const totalDurationMin = services.reduce((sum, s) => sum + s.durationMin, 0);
  const servicesSnapshot = services.map((s) => ({
    id: s.id,
    name: s.name,
    priceCents: s.priceCents,
    durationMin: s.durationMin,
  }));

  // 3. No promo → return base pricing
  if (!promoCode || promoCode.trim() === '') {
    return {
      baseAmountCents,
      discountAmountCents: 0,
      finalAmountCents: baseAmountCents,
      currency,
      totalDurationMin,
      services: servicesSnapshot,
      promoValid: false,
      promoMessage: '',
      promoId: null,
      discountPercent: null,
      discountCentsFixed: null,
    };
  }

  // 4. Lookup promo (case-insensitive)
  const promo = await prisma.promoCode.findFirst({
    where: { code: { equals: promoCode.trim(), mode: 'insensitive' } },
    select: {
      id: true,
      code: true,
      discountPercent: true,
      discountCents: true,
      validFrom: true,
      validUntil: true,
      maxUses: true,
      usedCount: true,
      isActive: true,
      description: true,
      assignedUserId: true,
    },
  });

  const invalidResult = (message: string): QuoteResult => ({
    baseAmountCents,
    discountAmountCents: 0,
    finalAmountCents: baseAmountCents,
    currency,
    totalDurationMin,
    services: servicesSnapshot,
    promoValid: false,
    promoMessage: message,
    promoId: null,
    discountPercent: null,
    discountCentsFixed: null,
  });

  if (!promo) return invalidResult('Промокод не найден');
  if (!promo.isActive) return invalidResult('Промокод неактивен');

  // Check personal promo assignment
  if (promo.assignedUserId && promo.assignedUserId !== userId) {
    return invalidResult('Этот промокод предназначен для другого пользователя');
  }

  const now = new Date();
  if (promo.validFrom && now < promo.validFrom) return invalidResult('Промокод ещё не действителен');
  if (promo.validUntil && now > promo.validUntil) return invalidResult('Срок действия промокода истёк');
  if (promo.maxUses !== null && promo.usedCount >= promo.maxUses) return invalidResult('Промокод исчерпан');

  // 5. Check per-user usage
  if (userId) {
    const existing = await prisma.promoRedemption.findUnique({
      where: { one_promo_per_user: { promoCodeId: promo.id, userId } },
      select: { id: true },
    });
    if (existing) return invalidResult('Вы уже использовали этот промокод');
  }

  // 6. Calculate discount
  let discountAmountCents = 0;
  if (promo.discountPercent !== null) {
    discountAmountCents = Math.floor((baseAmountCents * promo.discountPercent) / 100);
  } else if (promo.discountCents !== null) {
    discountAmountCents = promo.discountCents;
  }
  discountAmountCents = Math.min(discountAmountCents, baseAmountCents);
  const finalAmountCents = Math.max(0, baseAmountCents - discountAmountCents);

  const desc = promo.description ? `: ${promo.description}` : '';

  return {
    baseAmountCents,
    discountAmountCents,
    finalAmountCents,
    currency,
    totalDurationMin,
    services: servicesSnapshot,
    promoValid: true,
    promoMessage: `Скидка применена${desc}`,
    promoId: promo.id,
    discountPercent: promo.discountPercent,
    discountCentsFixed: promo.discountCents,
  };
}

export class QuoteError extends Error {
  code: string;
  constructor(message: string, code: string) {
    super(message);
    this.code = code;
  }
}
