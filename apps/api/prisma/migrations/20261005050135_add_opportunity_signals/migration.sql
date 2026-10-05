-- CreateTable
CREATE TABLE "OpportunitySignal" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "strength" INTEGER NOT NULL,
    "evidence" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OpportunitySignal_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "OpportunitySignal_companyId_idx" ON "OpportunitySignal"("companyId");

-- CreateIndex
CREATE INDEX "OpportunitySignal_type_idx" ON "OpportunitySignal"("type");

-- CreateIndex
CREATE INDEX "OpportunitySignal_strength_idx" ON "OpportunitySignal"("strength");

-- AddForeignKey
ALTER TABLE "OpportunitySignal" ADD CONSTRAINT "OpportunitySignal_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
