import { prisma } from "../lib/prisma.js";

export type OpportunityScoreResult = {
  score: number;
  signalCount: number;
};

function clamp(value: number): number {
  return Math.max(0, Math.min(1, value));
}

export async function calculateOpportunityScore(
  companyId: string,
): Promise<OpportunityScoreResult> {
  const signals = await prisma.opportunitySignal.findMany({
    where: {
      companyId,
    },
    select: {
      strength: true,
      confidence: true,
    },
  });

  if (signals.length === 0) {
    return {
      score: 0,
      signalCount: 0,
    };
  }

  const total = signals.reduce((sum, signal) => {
    const strength = clamp(signal.strength);
    const confidence = clamp(signal.confidence);

    const signalScore = strength * confidence;

    return sum + signalScore;
  }, 0);

  const averageScore = total / signals.length;

  const score = Math.round(
    clamp(averageScore) * 100,
  );

  return {
    score,
    signalCount: signals.length,
  };
}