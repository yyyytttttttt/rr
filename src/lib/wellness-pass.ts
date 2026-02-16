/**
 * Server-side wellness pass helpers.
 * All day-availability logic lives here — never on the client.
 *
 * v2: explicit start (no auto-enroll), one active at a time,
 *     concurrency-safe startPass via updateMany guard,
 *     idempotent completeDay, migration compat for old enrollments.
 */
import { prisma } from './prizma';

const UNLOCK_INTERVAL_MS = 24 * 60 * 60 * 1000; // 24 hours

/* ────────── Types ────────── */

export type DayStatus = 'DONE' | 'AVAILABLE' | 'LOCKED';
export type CatalogState = 'ACTIVE' | 'AVAILABLE_TO_START' | 'LOCKED' | 'COMPLETED';

export type CatalogItem = {
  slug: string;
  title: string;
  description: string | null;
  totalDays: number;
  rewardText: string | null;
  state: CatalogState;
  canStart: boolean;
  progressPercent?: number;
  completedDaysCount?: number;
  daysLeft?: number;
};

export type ActivePass = {
  slug: string;
  title: string;
  description: string | null;
  totalDays: number;
  progressPercent: number;
  currentDayNumber: number;
  currentDayTitle: string | null;
  currentDayText: string | null;
  isDayCompleted: boolean;
  nextAvailableInSec: number | null;
  locked: boolean;
  completedDaysCount: number;
  daysLeft: number;
  isFinished: boolean;
  rewardPromoCode: string | null;
  days: Array<{ dayNumber: number; title: string; status: DayStatus; content: string | null }>;
};

export type PassDetail = {
  passId: string;
  slug: string;
  title: string;
  description: string | null;
  totalDays: number;
  completedDaysCount: number;
  progressPercent: number;
  daysLeft: number;
  isFinished: boolean;
  nextUnlockAt: string | null;
  currentDayNumber: number;
  rewardPromoCode: string | null;
  currentDay: { dayNumber: number; title: string; content: string } | null;
  days: Array<{ dayNumber: number; title: string; status: DayStatus; content: string | null }>;
};

/* ────────── Internal helpers ────────── */

function computeAvailability(enrollment: {
  completedDaysCount: number;
  lastCompletedAt: Date | null;
  currentDayNumber: number;
  finishedAt: Date | null;
}, totalDays: number): { availableDay: number; nextUnlockAt: Date | null } {
  if (enrollment.finishedAt) {
    return { availableDay: totalDays + 1, nextUnlockAt: null };
  }

  const expected = enrollment.currentDayNumber;

  // Day 1 is always immediately available
  if (expected === 1 && enrollment.completedDaysCount === 0) {
    return { availableDay: 1, nextUnlockAt: null };
  }

  // For day N>1: must be >= 24h after lastCompletedAt
  if (enrollment.lastCompletedAt) {
    const unlockTime = new Date(enrollment.lastCompletedAt.getTime() + UNLOCK_INTERVAL_MS);
    if (new Date() < unlockTime) {
      return { availableDay: expected, nextUnlockAt: unlockTime };
    }
  }

  return { availableDay: expected, nextUnlockAt: null };
}

/** Ensure UserWellnessState row exists for user. */
async function getOrCreateState(userId: string, tx?: Parameters<Parameters<typeof prisma.$transaction>[0]>[0]) {
  const db = tx ?? prisma;
  let state = await db.userWellnessState.findUnique({ where: { userId } });
  if (!state) {
    state = await db.userWellnessState.create({ data: { userId } });
  }
  return state;
}

/**
 * Migration compat: if user has an unfinished enrollment but no activeEnrollmentId,
 * adopt the most recent unfinished enrollment as active.
 */
async function migrateActivePointer(userId: string, tx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0]) {
  const state = await getOrCreateState(userId, tx);
  if (state.activeEnrollmentId) return state;

  // Find most recent unfinished enrollment
  const unfinished = await tx.userWellnessPass.findFirst({
    where: { userId, finishedAt: null },
    orderBy: { enrolledAt: 'desc' },
    select: { id: true },
  });

  if (unfinished) {
    // Atomic: only set if still null (concurrency safe)
    const updated = await tx.userWellnessState.updateMany({
      where: { userId, activeEnrollmentId: null },
      data: { activeEnrollmentId: unfinished.id },
    });
    if (updated.count > 0) {
      return tx.userWellnessState.findUnique({ where: { userId } });
    }
  }

  return state;
}

/* ────────── Public API ────────── */

/**
 * Get catalog of all active passes with per-user state.
 */
export async function getCatalog(userId: string): Promise<CatalogItem[]> {
  const [passes, enrollments, state] = await Promise.all([
    prisma.wellnessPass.findMany({
      where: { isActive: true },
      select: { id: true, slug: true, title: true, description: true, totalDays: true, rewardText: true, rewardDiscountPercent: true },
      orderBy: { createdAt: 'asc' },
    }),
    prisma.userWellnessPass.findMany({
      where: { userId },
      select: { id: true, passId: true, completedDaysCount: true, finishedAt: true },
    }),
    prisma.userWellnessState.findUnique({ where: { userId } }),
  ]);

  // Run migration if needed (lazy, outside transaction — getCatalog is read-heavy)
  let activeEnrollmentId = state?.activeEnrollmentId ?? null;
  if (!activeEnrollmentId) {
    const unfinished = enrollments.find(e => !e.finishedAt);
    if (unfinished) {
      // Try to adopt it
      try {
        await prisma.$transaction(async (tx) => {
          await migrateActivePointer(userId, tx);
        });
        const refreshed = await prisma.userWellnessState.findUnique({ where: { userId } });
        activeEnrollmentId = refreshed?.activeEnrollmentId ?? null;
      } catch {
        // race — another request did it, read again
        const refreshed = await prisma.userWellnessState.findUnique({ where: { userId } });
        activeEnrollmentId = refreshed?.activeEnrollmentId ?? null;
      }
    }
  }

  const enrollmentByPass = new Map(enrollments.map(e => [e.passId, e]));

  return passes.map(p => {
    const enrollment = enrollmentByPass.get(p.id);
    const isCompleted = !!enrollment?.finishedAt;
    const isActive = !!enrollment && enrollment.id === activeEnrollmentId;
    const hasActive = activeEnrollmentId !== null;

    let state: CatalogState;
    if (isActive) state = 'ACTIVE';
    else if (isCompleted) state = 'COMPLETED';
    else if (hasActive) state = 'LOCKED';
    else state = 'AVAILABLE_TO_START';

    const rewardText = p.rewardText ?? `Скидка ${p.rewardDiscountPercent}%`;

    return {
      slug: p.slug,
      title: p.title,
      description: p.description,
      totalDays: p.totalDays,
      rewardText,
      state,
      canStart: state === 'AVAILABLE_TO_START',
      ...(enrollment ? {
        progressPercent: p.totalDays > 0 ? Math.round((enrollment.completedDaysCount / p.totalDays) * 100) : 0,
        completedDaysCount: enrollment.completedDaysCount,
        daysLeft: Math.max(0, p.totalDays - enrollment.completedDaysCount),
      } : {}),
    };
  });
}

/**
 * Get the currently active pass detail, or null.
 */
export async function getActivePass(userId: string): Promise<ActivePass | null> {
  // Ensure state row + migration compat
  const state = await prisma.$transaction(async (tx) => {
    return migrateActivePointer(userId, tx);
  });

  if (!state?.activeEnrollmentId) return null;

  const enrollment = await prisma.userWellnessPass.findUnique({
    where: { id: state.activeEnrollmentId },
    include: {
      pass: { select: { id: true, slug: true, title: true, description: true, totalDays: true } },
      rewardPromoCode: { select: { code: true } },
    },
  });

  if (!enrollment) {
    // Stale pointer — clean up
    await prisma.userWellnessState.update({
      where: { userId },
      data: { activeEnrollmentId: null },
    });
    return null;
  }

  const pass = enrollment.pass;
  const { availableDay, nextUnlockAt } = computeAvailability(enrollment, pass.totalDays);
  const isFinished = !!enrollment.finishedAt;

  // Fetch all days
  const allDays = await prisma.wellnessPassDay.findMany({
    where: { passId: pass.id },
    select: { dayNumber: true, title: true, content: true },
    orderBy: { dayNumber: 'asc' },
  });

  const completedDays = await prisma.userWellnessPassDay.findMany({
    where: { userId, passId: pass.id },
    select: { dayNumber: true },
  });
  const completedSet = new Set(completedDays.map(d => d.dayNumber));

  const days = allDays.map(d => {
    let status: DayStatus = 'LOCKED';
    if (completedSet.has(d.dayNumber)) status = 'DONE';
    else if (d.dayNumber === availableDay && !nextUnlockAt && !isFinished) status = 'AVAILABLE';
    const content = status !== 'LOCKED' ? d.content : null;
    return { dayNumber: d.dayNumber, title: d.title, status, content };
  });

  const currentDayData = allDays.find(d => d.dayNumber === availableDay);
  const isDayAvailable = !nextUnlockAt && !isFinished && availableDay <= pass.totalDays;
  const isDayAlreadyCompleted = completedSet.has(availableDay);

  const nextAvailableInSec = nextUnlockAt
    ? Math.max(0, Math.ceil((nextUnlockAt.getTime() - Date.now()) / 1000))
    : null;

  return {
    slug: pass.slug,
    title: pass.title,
    description: pass.description,
    totalDays: pass.totalDays,
    progressPercent: pass.totalDays > 0
      ? Math.round((enrollment.completedDaysCount / pass.totalDays) * 100)
      : 0,
    currentDayNumber: isFinished ? pass.totalDays : availableDay,
    currentDayTitle: currentDayData?.title ?? null,
    currentDayText: (isDayAvailable || isDayAlreadyCompleted) ? (currentDayData?.content ?? null) : null,
    isDayCompleted: isDayAlreadyCompleted,
    nextAvailableInSec,
    locked: !!nextUnlockAt,
    completedDaysCount: enrollment.completedDaysCount,
    daysLeft: Math.max(0, pass.totalDays - enrollment.completedDaysCount),
    isFinished,
    rewardPromoCode: enrollment.rewardPromoCode?.code ?? null,
    days,
  };
}

/**
 * Start a pass. Concurrency-safe via updateMany with activeEnrollmentId=null guard.
 * Throws PassError on conflict.
 */
export async function startPass(userId: string, slug: string): Promise<{ activeSlug: string }> {
  const pass = await prisma.wellnessPass.findUnique({
    where: { slug },
    select: { id: true, slug: true, isActive: true },
  });
  if (!pass || !pass.isActive) {
    throw new PassError('Программа не найдена', 'PASS_NOT_FOUND');
  }

  return prisma.$transaction(async (tx) => {
    // Ensure state row
    await getOrCreateState(userId, tx);

    // Check if user already completed this pass
    const existing = await tx.userWellnessPass.findUnique({
      where: { userId_passId: { userId, passId: pass.id } },
      select: { id: true, finishedAt: true },
    });

    if (existing?.finishedAt) {
      throw new PassError('Эта программа уже завершена', 'PASS_ALREADY_COMPLETED');
    }

    // Create enrollment if not exists (idempotent for re-start scenarios)
    let enrollmentId: string;
    if (existing) {
      enrollmentId = existing.id;
    } else {
      const enrollment = await tx.userWellnessPass.create({
        data: { userId, passId: pass.id },
        select: { id: true },
      });
      enrollmentId = enrollment.id;
    }

    // Atomic guard: only set activeEnrollmentId if currently null
    const updated = await tx.userWellnessState.updateMany({
      where: { userId, activeEnrollmentId: null },
      data: { activeEnrollmentId: enrollmentId },
    });

    if (updated.count === 0) {
      // Someone else (or same user) already has an active pass
      throw new PassError('У вас уже есть активная программа', 'PASS_ALREADY_ACTIVE');
    }

    return { activeSlug: pass.slug };
  });
}

/**
 * Complete a day in the ACTIVE pass. Idempotent — double-submit returns 200.
 * Clears activeEnrollmentId when pass is finished.
 */
export async function completeDayActive(
  userId: string,
  dayNumber?: number,
): Promise<{ active: ActivePass | null; rewardCode: string | null }> {
  // Get active enrollment
  const state = await prisma.userWellnessState.findUnique({ where: { userId } });
  if (!state?.activeEnrollmentId) {
    throw new PassError('Нет активной программы', 'PASS_NOT_ACTIVE');
  }

  const enrollment = await prisma.userWellnessPass.findUnique({
    where: { id: state.activeEnrollmentId },
    include: {
      pass: { select: { id: true, slug: true, totalDays: true, rewardDiscountPercent: true, rewardValidDays: true } },
    },
  });

  if (!enrollment) {
    throw new PassError('Запись не найдена', 'NOT_ENROLLED');
  }
  if (enrollment.finishedAt) {
    throw new PassError('Программа уже завершена', 'ALREADY_FINISHED');
  }

  const pass = enrollment.pass;
  const { availableDay, nextUnlockAt } = computeAvailability(enrollment, pass.totalDays);

  const targetDay = dayNumber ?? availableDay;

  if (targetDay !== availableDay) {
    throw new PassError('Этот день сейчас недоступен', 'WRONG_DAY');
  }
  if (nextUnlockAt && new Date() < nextUnlockAt) {
    throw new PassError('День ещё заблокирован', 'DAY_LOCKED');
  }

  // Validate day exists
  const dayExists = await prisma.wellnessPassDay.findUnique({
    where: { passId_dayNumber: { passId: pass.id, dayNumber: targetDay } },
    select: { id: true },
  });
  if (!dayExists) {
    throw new PassError('День не найден', 'DAY_NOT_FOUND');
  }

  // Check idempotency: already completed?
  const alreadyDone = await prisma.userWellnessPassDay.findUnique({
    where: { userId_passId_dayNumber: { userId, passId: pass.id, dayNumber: targetDay } },
    select: { id: true },
  });

  if (alreadyDone) {
    // Idempotent: return current state
    const active = await getActivePass(userId);
    return { active, rewardCode: null };
  }

  const now = new Date();
  const newCompleted = enrollment.completedDaysCount + 1;
  const isNowFinished = newCompleted >= pass.totalDays;

  let rewardCode: string | null = null;

  await prisma.$transaction(async (tx) => {
    // 1. Create day completion (unique constraint protects against race)
    await tx.userWellnessPassDay.create({
      data: { userId, passId: pass.id, dayNumber: targetDay, completedAt: now },
    });

    // 2. Update enrollment
    const updateData: Record<string, unknown> = {
      completedDaysCount: { increment: 1 },
      lastCompletedAt: now,
      currentDayNumber: Math.min(targetDay + 1, pass.totalDays + 1),
    };

    if (isNowFinished) {
      updateData.finishedAt = now;

      // 3. Generate reward promo code
      const code = `PASS-${pass.slug.toUpperCase().slice(0, 8)}-${userId.slice(-6).toUpperCase()}-${now.getFullYear()}`;
      const validUntil = new Date(now.getTime() + pass.rewardValidDays * 24 * 60 * 60 * 1000);

      const promo = await tx.promoCode.create({
        data: {
          code,
          discountPercent: pass.rewardDiscountPercent,
          currency: 'RUB',
          isActive: true,
          maxUses: 1,
          usedCount: 0,
          validUntil,
          assignedUserId: userId,
          description: `Награда за программу «${pass.slug}»`,
        },
      });

      updateData.rewardPromoCodeId = promo.id;
      rewardCode = code;

      // 4. Clear active pointer (pass finished)
      await tx.userWellnessState.update({
        where: { userId },
        data: { activeEnrollmentId: null },
      });
    }

    await tx.userWellnessPass.update({
      where: { id: enrollment.id },
      data: updateData,
    });
  });

  const active = await getActivePass(userId);
  return { active, rewardCode };
}

/* ────────── Legacy API compat ────────── */

/**
 * @deprecated Use getCatalog() instead. Kept for old /api/passes/my route.
 */
export async function getUserPasses(userId: string) {
  const catalog = await getCatalog(userId);
  // Map catalog items back to old PassProgress shape
  return catalog.map(c => ({
    passId: '',
    slug: c.slug,
    title: c.title,
    description: c.description,
    totalDays: c.totalDays,
    completedDaysCount: c.completedDaysCount ?? 0,
    progressPercent: c.progressPercent ?? 0,
    daysLeft: c.daysLeft ?? c.totalDays,
    isFinished: c.state === 'COMPLETED',
    nextUnlockAt: null,
    currentDayNumber: 1,
    rewardPromoCode: null,
  }));
}

/**
 * Build detailed view of a specific pass for the user.
 * @deprecated Kept for old /api/passes/my/[slug] route.
 */
export async function getUserPassDetail(userId: string, slug: string): Promise<PassDetail | null> {
  const pass = await prisma.wellnessPass.findUnique({
    where: { slug },
    select: { id: true, slug: true, title: true, description: true, totalDays: true, isActive: true },
  });
  if (!pass || !pass.isActive) return null;

  const enrollment = await prisma.userWellnessPass.findUnique({
    where: { userId_passId: { userId, passId: pass.id } },
    include: { rewardPromoCode: { select: { code: true } } },
  });
  if (!enrollment) return null;

  const { availableDay, nextUnlockAt } = computeAvailability(enrollment, pass.totalDays);
  const isFinished = !!enrollment.finishedAt;

  const allDays = await prisma.wellnessPassDay.findMany({
    where: { passId: pass.id },
    select: { dayNumber: true, title: true, content: true },
    orderBy: { dayNumber: 'asc' },
  });

  const completedDays = await prisma.userWellnessPassDay.findMany({
    where: { userId, passId: pass.id },
    select: { dayNumber: true },
  });
  const completedSet = new Set(completedDays.map(d => d.dayNumber));

  const daysLeft = Math.max(0, pass.totalDays - enrollment.completedDaysCount);
  const progressPercent = pass.totalDays > 0
    ? Math.round((enrollment.completedDaysCount / pass.totalDays) * 100)
    : 0;

  const days = allDays.map(d => {
    let status: DayStatus = 'LOCKED';
    if (completedSet.has(d.dayNumber)) status = 'DONE';
    else if (d.dayNumber === availableDay && !nextUnlockAt && !isFinished) status = 'AVAILABLE';
    const content = status !== 'LOCKED' ? d.content : null;
    return { dayNumber: d.dayNumber, title: d.title, status, content };
  });

  let currentDay: PassDetail['currentDay'] = null;
  if (!isFinished) {
    const dayData = allDays.find(d => d.dayNumber === availableDay);
    if (dayData) {
      currentDay = { dayNumber: dayData.dayNumber, title: dayData.title, content: dayData.content };
    }
  }

  return {
    passId: pass.id,
    slug: pass.slug,
    title: pass.title,
    description: pass.description,
    totalDays: pass.totalDays,
    completedDaysCount: enrollment.completedDaysCount,
    progressPercent,
    daysLeft,
    isFinished,
    nextUnlockAt: nextUnlockAt?.toISOString() ?? null,
    currentDayNumber: isFinished ? pass.totalDays : availableDay,
    rewardPromoCode: enrollment.rewardPromoCode?.code ?? null,
    currentDay,
    days,
  };
}

/**
 * @deprecated Use completeDayActive() instead. Kept for old /api/passes/my/[slug]/complete route.
 */
export async function completeDay(
  userId: string,
  slug: string,
  dayNumber: number,
): Promise<{ detail: PassDetail; rewardCode: string | null }> {
  const pass = await prisma.wellnessPass.findUnique({
    where: { slug },
    select: { id: true, slug: true, totalDays: true, isActive: true, rewardDiscountPercent: true, rewardValidDays: true },
  });
  if (!pass || !pass.isActive) {
    throw new PassError('Пропуск не найден', 'PASS_NOT_FOUND');
  }

  const enrollment = await prisma.userWellnessPass.findUnique({
    where: { userId_passId: { userId, passId: pass.id } },
  });
  if (!enrollment) {
    throw new PassError('Вы не записаны на этот пропуск', 'NOT_ENROLLED');
  }
  if (enrollment.finishedAt) {
    throw new PassError('Пропуск уже завершён', 'ALREADY_FINISHED');
  }

  const { availableDay, nextUnlockAt } = computeAvailability(enrollment, pass.totalDays);

  if (dayNumber !== availableDay) {
    throw new PassError('Этот день сейчас недоступен', 'WRONG_DAY');
  }
  if (nextUnlockAt && new Date() < nextUnlockAt) {
    throw new PassError('День ещё заблокирован', 'DAY_LOCKED');
  }

  const dayExists = await prisma.wellnessPassDay.findUnique({
    where: { passId_dayNumber: { passId: pass.id, dayNumber } },
    select: { id: true },
  });
  if (!dayExists) {
    throw new PassError('День не найден', 'DAY_NOT_FOUND');
  }

  const now = new Date();
  const newCompleted = enrollment.completedDaysCount + 1;
  const isNowFinished = newCompleted >= pass.totalDays;

  let rewardCode: string | null = null;

  await prisma.$transaction(async (tx) => {
    await tx.userWellnessPassDay.create({
      data: { userId, passId: pass.id, dayNumber, completedAt: now },
    });

    const updateData: Record<string, unknown> = {
      completedDaysCount: { increment: 1 },
      lastCompletedAt: now,
      currentDayNumber: Math.min(dayNumber + 1, pass.totalDays + 1),
    };

    if (isNowFinished) {
      updateData.finishedAt = now;

      const code = `PASS-${pass.slug.toUpperCase().slice(0, 8)}-${userId.slice(-6).toUpperCase()}-${now.getFullYear()}`;
      const validUntil = new Date(now.getTime() + pass.rewardValidDays * 24 * 60 * 60 * 1000);

      const promo = await tx.promoCode.create({
        data: {
          code,
          discountPercent: pass.rewardDiscountPercent,
          currency: 'RUB',
          isActive: true,
          maxUses: 1,
          usedCount: 0,
          validUntil,
          assignedUserId: userId,
          description: `Награда за пропуск «${pass.slug}»`,
        },
      });

      updateData.rewardPromoCodeId = promo.id;
      rewardCode = code;

      // Also clear active pointer if it points to this enrollment
      try {
        await tx.userWellnessState.updateMany({
          where: { userId, activeEnrollmentId: enrollment.id },
          data: { activeEnrollmentId: null },
        });
      } catch {
        // no state row — fine
      }
    }

    await tx.userWellnessPass.update({
      where: { userId_passId: { userId, passId: pass.id } },
      data: updateData,
    });
  });

  const detail = await getUserPassDetail(userId, slug);
  if (!detail) throw new PassError('Ошибка загрузки данных', 'LOAD_ERROR');

  return { detail, rewardCode };
}

/* ────────── Error class ────────── */

export class PassError extends Error {
  code: string;
  constructor(message: string, code: string) {
    super(message);
    this.code = code;
  }
}
