/*
  Warnings:

  - Made the column `description` on table `Company` required. This step will fail if there are existing NULL values in that column.
  - Made the column `industry` on table `Company` required. This step will fail if there are existing NULL values in that column.

*/
-- DropIndex
DROP INDEX "Company_industry_idx";

-- DropIndex
DROP INDEX "Company_name_idx";

-- DropIndex
DROP INDEX "Company_websiteUrl_key";

-- AlterTable
ALTER TABLE "Company" ALTER COLUMN "description" SET NOT NULL,
ALTER COLUMN "industry" SET NOT NULL;

-- CreateTable
CREATE TABLE "CompanyIntelligence" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "industry" TEXT NOT NULL,
    "businessModel" TEXT NOT NULL,
    "targetCustomers" JSONB NOT NULL,
    "productsOrServices" JSONB NOT NULL,
    "technologies" JSONB NOT NULL,
    "growthSignals" JSONB NOT NULL,
    "potentialOpportunities" JSONB NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CompanyIntelligence_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CompanyIntelligence_companyId_key" ON "CompanyIntelligence"("companyId");

-- AddForeignKey
ALTER TABLE "CompanyIntelligence" ADD CONSTRAINT "CompanyIntelligence_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
