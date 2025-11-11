-- AlterTable
ALTER TABLE "Doctor" ADD COLUMN     "gridStepMin" INTEGER NOT NULL DEFAULT 10,
ADD COLUMN     "minLeadMin" INTEGER NOT NULL DEFAULT 60,
ADD COLUMN     "tzid" TEXT NOT NULL DEFAULT 'UTC';

-- AlterTable
ALTER TABLE "Exception" ADD COLUMN     "kind" TEXT;

-- AlterTable
ALTER TABLE "Schedule" ADD COLUMN     "rrule" TEXT,
ADD COLUMN     "tzid" TEXT;

-- AlterTable
ALTER TABLE "Service" ADD COLUMN     "bufferMinOverride" INTEGER;
