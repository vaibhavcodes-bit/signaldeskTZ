import { prisma } from "../lib/prisma.js";

export type ScoringSignal = {
  id: string;
  type: string;
  title: string;
  description: string;
  strength: number;
  confidence: number;
};

export type OpportunityExplanationSignal = {
  id: string;
  type: string;
  title: string;
  description: string;
  strength: number;
  confidence: number;
  contribution: number;
};

export type OpportunityExplanation = {
  summary: string;
  signals: OpportunityExplanationSignal[];
};

export type OpportunityScoreResult = {
  companyId: string;
  score: number;
  signalCount: number;
  explanation: OpportunityExplanation;
};

function clamp(
  value: number,
  min = 0,
  max = 1,
): number {
  return Math.min(Math.max(value, min), max);
}

function calculateSignalContribution(
  strength: number,
  confidence: number,
): number {
  const normalizedStrength = clamp(strength);
  const normalizedConfidence = clamp(confidence);

  return (
    normalizedStrength *
    normalizedConfidence
  );
}

export async function calculateOpportunityScore(
  companyId: string,
): Promise<OpportunityScoreResult> {
  const signals = await prisma.opportunitySignal.findMany({
    where: {
      companyId,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  if (signals.length === 0) {
    return {
      companyId,
      score: 0,
      signalCount: 0,
      explanation: {
        summary:
          "No opportunity signals were found for this company.",
        signals: [],
      },
    };
  }

  const normalizedSignals: ScoringSignal[] =
    signals.map(
      (signal: ScoringSignal): ScoringSignal => ({
        id: signal.id,
        type: signal.type,
        title: signal.title,
        description: signal.description,
        strength: clamp(signal.strength),
        confidence: clamp(signal.confidence),
      }),
    );

  const contributions =
    normalizedSignals.map(
      (signal: ScoringSignal) => ({
        ...signal,
        contribution:
          calculateSignalContribution(
            signal.strength,
            signal.confidence,
          ),
      }),
    );

  const totalContribution =
    contributions.reduce(
      (total, signal) =>
        total + signal.contribution,
      0,
    );

  const averageContribution =
    totalContribution /
    contributions.length;

  const score = Math.round(
    clamp(averageContribution) * 100,
  );

  const explanationSignals =
    contributions.map(
      (signal) => ({
        id: signal.id,
        type: signal.type,
        title: signal.title,
        description: signal.description,
        strength: signal.strength,
        confidence: signal.confidence,
        contribution: Number(
          signal.contribution.toFixed(2),
        ),
      }),
    );

  let summary: string;

  if (score >= 80) {
    summary =
      "Strong opportunity based on high-strength and high-confidence signals.";
  } else if (score >= 60) {
    summary =
      "Good opportunity supported by multiple positive signals.";
  } else if (score >= 40) {
    summary =
      "Moderate opportunity with mixed or partially confident signals.";
  } else {
    summary =
      "Weak opportunity based on limited or low-confidence signals.";
  }

  return {
    companyId,
    score,
    signalCount: normalizedSignals.length,
    explanation: {
      summary,
      signals: explanationSignals,
    },
  };
}