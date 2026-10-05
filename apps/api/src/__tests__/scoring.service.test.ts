import { describe, expect, it } from "vitest";

describe("Opportunity Scoring Engine", () => {
  function calculateScore(
    signals: Array<{
      strength: number;
      confidence: number;
    }>,
  ) {
    if (signals.length === 0) {
      return 0;
    }

    const total = signals.reduce(
      (sum, signal) =>
        sum +
        Math.max(0, Math.min(1, signal.strength)) *
          Math.max(0, Math.min(1, signal.confidence)),
      0,
    );

    return Math.round(
      (total / signals.length) * 100,
    );
  }

  it("should return 0 when there are no signals", () => {
    expect(calculateScore([])).toBe(0);
  });

  it("should calculate a high score for strong signals", () => {
    const score = calculateScore([
      {
        strength: 0.9,
        confidence: 0.9,
      },
      {
        strength: 0.8,
        confidence: 0.85,
      },
    ]);

    expect(score).toBe(75);
  });

  it("should reduce score when confidence is low", () => {
    const score = calculateScore([
      {
        strength: 0.9,
        confidence: 0.2,
      },
    ]);

    expect(score).toBe(18);
  });

  it("should clamp values between 0 and 1", () => {
    const score = calculateScore([
      {
        strength: 2,
        confidence: 2,
      },
    ]);

    expect(score).toBe(100);
  });
});