// scripts/complete-pass.js
// Завершает все дни пропуска для тестового пользователя
// Использование: node scripts/complete-pass.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const email = 'user@test.com';
  const slug = 'zhivoy-balans';

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw new Error(`User ${email} not found`);

  const pass = await prisma.wellnessPass.findUnique({ where: { slug } });
  if (!pass) throw new Error(`Pass ${slug} not found`);

  // Ensure enrolled
  let enrollment = await prisma.userWellnessPass.findUnique({
    where: { userId_passId: { userId: user.id, passId: pass.id } },
  });
  if (!enrollment) {
    enrollment = await prisma.userWellnessPass.create({
      data: { userId: user.id, passId: pass.id },
    });
  }

  // Reset if already has progress
  await prisma.userWellnessPassDay.deleteMany({
    where: { userId: user.id, passId: pass.id },
  });
  // Delete old reward promo if exists
  if (enrollment.rewardPromoCodeId) {
    await prisma.userWellnessPass.update({
      where: { userId_passId: { userId: user.id, passId: pass.id } },
      data: { rewardPromoCodeId: null },
    });
    await prisma.promoCode.delete({ where: { id: enrollment.rewardPromoCodeId } }).catch(() => {});
  }

  console.log(`Completing all ${pass.totalDays} days for ${email}...\n`);

  const now = new Date();
  // Complete days 1..totalDays with timestamps 1 hour apart (in the past)
  for (let day = 1; day <= pass.totalDays; day++) {
    const completedAt = new Date(now.getTime() - (pass.totalDays - day) * 3600_000);
    await prisma.userWellnessPassDay.create({
      data: { userId: user.id, passId: pass.id, dayNumber: day, completedAt },
    });
    process.stdout.write(`  Day ${day}/${pass.totalDays} done\r`);
  }

  // Generate reward promo code
  const code = `PASS-${slug.toUpperCase().slice(0, 8)}-${user.id.slice(-6).toUpperCase()}-${now.getFullYear()}`;
  const validUntil = new Date(now.getTime() + pass.rewardValidDays * 24 * 3600_000);

  const promo = await prisma.promoCode.create({
    data: {
      code,
      discountPercent: pass.rewardDiscountPercent,
      currency: 'RUB',
      isActive: true,
      maxUses: 1,
      usedCount: 0,
      validUntil,
      assignedUserId: user.id,
      description: `Награда за пропуск "${pass.title}"`,
    },
  });

  // Update enrollment
  await prisma.userWellnessPass.update({
    where: { userId_passId: { userId: user.id, passId: pass.id } },
    data: {
      completedDaysCount: pass.totalDays,
      currentDayNumber: pass.totalDays + 1,
      lastCompletedAt: now,
      finishedAt: now,
      rewardPromoCodeId: promo.id,
    },
  });

  console.log(`\n\nГотово! Пропуск "${pass.title}" полностью завершён.`);
  console.log(`\nВаш промокод на скидку ${pass.rewardDiscountPercent}%:\n`);
  console.log(`  >>> ${code} <<<\n`);
  console.log(`Действует до: ${validUntil.toLocaleDateString('ru-RU')}`);
  console.log(`Применить при записи: /profile?view=booking\n`);
}

main()
  .catch((e) => { console.error('Error:', e.message); process.exit(1); })
  .finally(() => prisma.$disconnect());
