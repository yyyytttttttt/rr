-- AlterTable
ALTER TABLE "WellnessPass" ADD COLUMN     "rewardText" TEXT;

-- CreateTable
CREATE TABLE "UserWellnessState" (
    "userId" TEXT NOT NULL,
    "activeEnrollmentId" TEXT,

    CONSTRAINT "UserWellnessState_pkey" PRIMARY KEY ("userId")
);

-- CreateIndex
CREATE UNIQUE INDEX "UserWellnessState_activeEnrollmentId_key" ON "UserWellnessState"("activeEnrollmentId");

-- AddForeignKey
ALTER TABLE "UserWellnessState" ADD CONSTRAINT "UserWellnessState_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserWellnessState" ADD CONSTRAINT "UserWellnessState_activeEnrollmentId_fkey" FOREIGN KEY ("activeEnrollmentId") REFERENCES "UserWellnessPass"("id") ON DELETE SET NULL ON UPDATE CASCADE;
