/*
  Warnings:

  - You are about to drop the column `emailVirifien` on the `User` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "User" DROP COLUMN "emailVirifien",
ADD COLUMN     "emailVerified" TIMESTAMP(3);
