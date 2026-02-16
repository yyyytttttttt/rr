-- AlterTable
ALTER TABLE "PromoCode" ADD COLUMN     "assignedUserId" TEXT;

-- CreateTable
CREATE TABLE "WellnessPass" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "totalDays" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "rewardDiscountPercent" INTEGER NOT NULL DEFAULT 5,
    "rewardValidDays" INTEGER NOT NULL DEFAULT 30,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WellnessPass_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WellnessPassDay" (
    "id" TEXT NOT NULL,
    "passId" TEXT NOT NULL,
    "dayNumber" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,

    CONSTRAINT "WellnessPassDay_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserWellnessPass" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "passId" TEXT NOT NULL,
    "enrolledAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "currentDayNumber" INTEGER NOT NULL DEFAULT 1,
    "lastCompletedAt" TIMESTAMP(3),
    "completedDaysCount" INTEGER NOT NULL DEFAULT 0,
    "finishedAt" TIMESTAMP(3),
    "rewardPromoCodeId" TEXT,

    CONSTRAINT "UserWellnessPass_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserWellnessPassDay" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "passId" TEXT NOT NULL,
    "dayNumber" INTEGER NOT NULL,
    "completedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserWellnessPassDay_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "WellnessPass_slug_key" ON "WellnessPass"("slug");

-- CreateIndex
CREATE INDEX "WellnessPassDay_passId_idx" ON "WellnessPassDay"("passId");

-- CreateIndex
CREATE UNIQUE INDEX "WellnessPassDay_passId_dayNumber_key" ON "WellnessPassDay"("passId", "dayNumber");

-- CreateIndex
CREATE UNIQUE INDEX "UserWellnessPass_rewardPromoCodeId_key" ON "UserWellnessPass"("rewardPromoCodeId");

-- CreateIndex
CREATE INDEX "UserWellnessPass_userId_idx" ON "UserWellnessPass"("userId");

-- CreateIndex
CREATE INDEX "UserWellnessPass_passId_idx" ON "UserWellnessPass"("passId");

-- CreateIndex
CREATE UNIQUE INDEX "UserWellnessPass_userId_passId_key" ON "UserWellnessPass"("userId", "passId");

-- CreateIndex
CREATE INDEX "UserWellnessPassDay_userId_idx" ON "UserWellnessPassDay"("userId");

-- CreateIndex
CREATE INDEX "UserWellnessPassDay_passId_idx" ON "UserWellnessPassDay"("passId");

-- CreateIndex
CREATE UNIQUE INDEX "UserWellnessPassDay_userId_passId_dayNumber_key" ON "UserWellnessPassDay"("userId", "passId", "dayNumber");

-- CreateIndex
CREATE INDEX "PromoCode_assignedUserId_idx" ON "PromoCode"("assignedUserId");

-- AddForeignKey
ALTER TABLE "PromoCode" ADD CONSTRAINT "PromoCode_assignedUserId_fkey" FOREIGN KEY ("assignedUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WellnessPassDay" ADD CONSTRAINT "WellnessPassDay_passId_fkey" FOREIGN KEY ("passId") REFERENCES "WellnessPass"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserWellnessPass" ADD CONSTRAINT "UserWellnessPass_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserWellnessPass" ADD CONSTRAINT "UserWellnessPass_passId_fkey" FOREIGN KEY ("passId") REFERENCES "WellnessPass"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserWellnessPass" ADD CONSTRAINT "UserWellnessPass_rewardPromoCodeId_fkey" FOREIGN KEY ("rewardPromoCodeId") REFERENCES "PromoCode"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserWellnessPassDay" ADD CONSTRAINT "UserWellnessPassDay_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserWellnessPassDay" ADD CONSTRAINT "UserWellnessPassDay_userId_passId_fkey" FOREIGN KEY ("userId", "passId") REFERENCES "UserWellnessPass"("userId", "passId") ON DELETE CASCADE ON UPDATE CASCADE;
