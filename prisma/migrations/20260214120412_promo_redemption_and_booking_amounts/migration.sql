-- AlterTable
ALTER TABLE "Booking" ADD COLUMN     "baseAmountCents" INTEGER,
ADD COLUMN     "discountAmountCents" INTEGER,
ADD COLUMN     "finalAmountCents" INTEGER,
ADD COLUMN     "paymentMethod" TEXT,
ADD COLUMN     "promoCodeId" TEXT,
ADD COLUMN     "promoCodeSnapshot" TEXT,
ADD COLUMN     "serviceSnapshot" JSONB;

-- CreateTable
CREATE TABLE "BirthdayClaim" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "promoCodeId" TEXT NOT NULL,
    "claimedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BirthdayClaim_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PromoRedemption" (
    "id" TEXT NOT NULL,
    "promoCodeId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "discountPercentSnapshot" INTEGER,
    "discountCentsSnapshot" INTEGER,
    "baseAmountCents" INTEGER NOT NULL,
    "discountAmountCents" INTEGER NOT NULL,
    "finalAmountCents" INTEGER NOT NULL,
    "redeemedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PromoRedemption_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "BirthdayClaim_promoCodeId_key" ON "BirthdayClaim"("promoCodeId");

-- CreateIndex
CREATE INDEX "BirthdayClaim_userId_idx" ON "BirthdayClaim"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "BirthdayClaim_userId_year_key" ON "BirthdayClaim"("userId", "year");

-- CreateIndex
CREATE UNIQUE INDEX "PromoRedemption_bookingId_key" ON "PromoRedemption"("bookingId");

-- CreateIndex
CREATE INDEX "PromoRedemption_userId_idx" ON "PromoRedemption"("userId");

-- CreateIndex
CREATE INDEX "PromoRedemption_promoCodeId_idx" ON "PromoRedemption"("promoCodeId");

-- CreateIndex
CREATE UNIQUE INDEX "PromoRedemption_promoCodeId_userId_key" ON "PromoRedemption"("promoCodeId", "userId");

-- AddForeignKey
ALTER TABLE "BirthdayClaim" ADD CONSTRAINT "BirthdayClaim_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BirthdayClaim" ADD CONSTRAINT "BirthdayClaim_promoCodeId_fkey" FOREIGN KEY ("promoCodeId") REFERENCES "PromoCode"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PromoRedemption" ADD CONSTRAINT "PromoRedemption_promoCodeId_fkey" FOREIGN KEY ("promoCodeId") REFERENCES "PromoCode"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PromoRedemption" ADD CONSTRAINT "PromoRedemption_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PromoRedemption" ADD CONSTRAINT "PromoRedemption_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;
