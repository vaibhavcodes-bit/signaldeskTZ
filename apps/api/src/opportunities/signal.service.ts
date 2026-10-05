import { Prisma } from "../generated/prisma/client.js";
import { prisma } from "../lib/prisma.js";

type SignalInput = {
  type: string;
  title: string;
  description: string;
  strength: number;
  confidence: number;
  evidence: Prisma.InputJsonValue;
};

function clamp(value: number): number {
  return Math.max(0, Math.min(1, value));
}

export async function createOpportunitySignals(
  companyId: string,
  signals: SignalInput[],
) {
  if (signals.length === 0) {
    return [];
  }

  const normalizedSignals: Prisma.OpportunitySignalCreateManyInput[] =
    signals.map((signal) => ({
      companyId,
      type: signal.type,
      title: signal.title,
      description: signal.description,
      strength: clamp(signal.strength),
      confidence: clamp(signal.confidence),
      evidence: signal.evidence,
    }));

  await prisma.opportunitySignal.createMany({
    data: normalizedSignals,
  });

  return prisma.opportunitySignal.findMany({
    where: {
      companyId,
    },
    orderBy: {
      createdAt: "desc",
    },
  });
}

export async function getOpportunitySignals(
  companyId: string,
) {
  return prisma.opportunitySignal.findMany({
    where: {
      companyId,
    },
    orderBy: [
      {
        strength: "desc",
      },
      {
        confidence: "desc",
      },
    ],
  });
}

export async function deleteOpportunitySignals(
  companyId: string,
) {
  return prisma.opportunitySignal.deleteMany({
    where: {
      companyId,
    },
  });
}