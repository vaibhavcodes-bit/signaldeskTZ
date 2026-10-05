/*
  Warnings:

  - Added the required column `confidence` to the `OpportunitySignal` table without a default value. This is not possible if the table is not empty.
  - Made the column `evidence` on table `OpportunitySignal` required. This step will fail if there are existing NULL values in that column.

*/
-- DropIndex
DROP INDEX "OpportunitySignal_strength_idx";

-- AlterTable
ALTER TABLE "OpportunitySignal" ADD COLUMN     "confidence" DOUBLE PRECISION NOT NULL,
ALTER COLUMN "strength" SET DATA TYPE DOUBLE PRECISION,
ALTER COLUMN "evidence" SET NOT NULL;

-- CreateIndex
CREATE INDEX "OpportunitySignal_createdAt_idx" ON "OpportunitySignal"("createdAt");
