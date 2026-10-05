import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * IMPORTANT:
 * vi.mock() is hoisted by Vitest.
 * Therefore mockFindMany must be created with vi.hoisted().
 */
const { mockFindMany } = vi.hoisted(() => ({
  mockFindMany: vi.fn(),
}));

/**
 * Mock Prisma BEFORE importing the scoring service.
 *
 * scoring.service.ts imports:
 * ../lib/prisma.js
 */
vi.mock("../lib/prisma.js", () => ({
  prisma: {
    opportunitySignal: {
      findMany: mockFindMany,
    },
  },
}));

/**
 * Local test type.
 *
 * We intentionally do NOT import Prisma-generated types here.
 * The scoring service only needs these fields for calculation.
 */
type ScoringSignal = {
  id: string;
  type: string;
  title: string;
  description: string;
  strength: number;
  confidence: number;
  evidence?: unknown;
  companyId?: string;
  createdAt?: Date;
  updatedAt?: Date;
};

import { calculateOpportunityScore } from "../opportunities/scoring.service.js";

describe("Opportunity Scoring Engine", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFindMany.mockReset();
  });

  // ---------------------------------------------------------
  // TEST 1
  // ---------------------------------------------------------

  it("should return 0 when there are no signals", async () => {
    mockFindMany.mockResolvedValue([]);

    const result = await calculateOpportunityScore("company-1");

    expect(result.score).toBe(0);
    expect(result.signalCount).toBe(0);
  });

  // ---------------------------------------------------------
  // TEST 2
  // ---------------------------------------------------------

  it("should calculate score from signal strength and confidence", async () => {
    const signals: ScoringSignal[] = [
      {
        id: "signal-1",
        type: "growth",
        title: "Company is expanding",
        description: "The company is showing strong growth.",
        strength: 0.9,
        confidence: 0.9,
      },
      {
        id: "signal-2",
        type: "funding",
        title: "Recent funding",
        description: "The company recently raised funding.",
        strength: 0.8,
        confidence: 0.85,
      },
    ];

    mockFindMany.mockResolvedValue(signals);

    const result = await calculateOpportunityScore("company-1");

    /**
     * Signal 1:
     * 0.9 × 0.9 = 0.81
     *
     * Signal 2:
     * 0.8 × 0.85 = 0.68
     *
     * Average:
     * (0.81 + 0.68) / 2 = 0.745
     *
     * Score:
     * 0.745 × 100 = 74.5
     *
     * Depending on the scoring implementation,
     * this is rounded to 75.
     */
    expect(result.score).toBe(75);
    expect(result.signalCount).toBe(2);
  });

  // ---------------------------------------------------------
  // TEST 3
  // ---------------------------------------------------------

  it("should reduce score when confidence is low", async () => {
    const signals: ScoringSignal[] = [
      {
        id: "signal-1",
        type: "growth",
        title: "Growth signal",
        description: "Strong growth.",
        strength: 0.9,
        confidence: 0.2,
      },
    ];

    mockFindMany.mockResolvedValue(signals);

    const result = await calculateOpportunityScore("company-1");

    /**
     * 0.9 × 0.2 = 0.18
     * 0.18 × 100 = 18
     */
    expect(result.score).toBe(18);
    expect(result.signalCount).toBe(1);
  });

  // ---------------------------------------------------------
  // TEST 4
  // ---------------------------------------------------------

  it("should clamp values between 0 and 1", async () => {
    const signals: ScoringSignal[] = [
      {
        id: "signal-1",
        type: "growth",
        title: "Growth signal",
        description: "Strong growth.",
        strength: 2,
        confidence: 2,
      },
    ];

    mockFindMany.mockResolvedValue(signals);

    const result = await calculateOpportunityScore("company-1");

    /**
     * Raw:
     * 2 × 2 = 4
     *
     * Clamped:
     * 1
     *
     * Score:
     * 100
     */
    expect(result.score).toBe(100);
  });

  // ---------------------------------------------------------
  // TEST 5
  // ---------------------------------------------------------

  it("should handle negative values safely", async () => {
    const signals: ScoringSignal[] = [
      {
        id: "signal-1",
        type: "growth",
        title: "Negative growth signal",
        description: "Negative signal.",
        strength: -1,
        confidence: 0.9,
      },
    ];

    mockFindMany.mockResolvedValue(signals);

    const result = await calculateOpportunityScore("company-1");

    /**
     * Score should never be below 0.
     */
    expect(result.score).toBe(0);
  });

  // ---------------------------------------------------------
  // TEST 6
  // ---------------------------------------------------------

  it("should handle multiple signals correctly", async () => {
    const signals: ScoringSignal[] = [
      {
        id: "signal-1",
        type: "growth",
        title: "Growth",
        description: "Strong growth.",
        strength: 1,
        confidence: 1,
      },
      {
        id: "signal-2",
        type: "funding",
        title: "Funding",
        description: "Recent funding.",
        strength: 0.5,
        confidence: 0.5,
      },
    ];

    mockFindMany.mockResolvedValue(signals);

    const result = await calculateOpportunityScore("company-1");

    /**
     * Signal 1:
     * 1 × 1 = 1
     *
     * Signal 2:
     * 0.5 × 0.5 = 0.25
     *
     * Average:
     * (1 + 0.25) / 2 = 0.625
     *
     * Score:
     * 62.5 → 63 if rounded.
     */
    expect(result.score).toBe(63);
    expect(result.signalCount).toBe(2);
  });

  // ---------------------------------------------------------
  // TEST 7
  // ---------------------------------------------------------

  it("should calculate a high opportunity score for strong signals", async () => {
    const signals: ScoringSignal[] = [
      {
        id: "signal-1",
        type: "growth",
        title: "Strong growth",
        description: "Company growth is accelerating.",
        strength: 1,
        confidence: 1,
      },
    ];

    mockFindMany.mockResolvedValue(signals);

    const result = await calculateOpportunityScore("company-1");

    expect(result.score).toBe(100);

    expect(result.explanation).toBeDefined();
    expect(result.explanation.summary).toBe(
      "Strong opportunity based on high-strength and high-confidence signals.",
    );
  });

  // ---------------------------------------------------------
  // TEST 8
  // ---------------------------------------------------------

  it("should explain every signal", async () => {
    const signals: ScoringSignal[] = [
      {
        id: "signal-1",
        type: "growth",
        title: "Company is expanding",
        description: "The company is showing strong growth.",
        strength: 0.9,
        confidence: 0.9,
      },
      {
        id: "signal-2",
        type: "funding",
        title: "Recent funding",
        description: "The company recently raised funding.",
        strength: 0.8,
        confidence: 0.85,
      },
    ];

    mockFindMany.mockResolvedValue(signals);

    const result = await calculateOpportunityScore("company-1");

    expect(result.explanation).toBeDefined();

    expect(result.explanation.signals).toHaveLength(2);

    expect(result.explanation.signals[0]).toMatchObject({
      id: "signal-1",
      title: "Company is expanding",
      strength: 0.9,
      confidence: 0.9,
    });

    expect(result.explanation.signals[1]).toMatchObject({
      id: "signal-2",
      title: "Recent funding",
      strength: 0.8,
      confidence: 0.85,
    });
  });

  // ---------------------------------------------------------
  // TEST 9
  // ---------------------------------------------------------

  it("should provide a strong-opportunity explanation", async () => {
    const signals: ScoringSignal[] = [
      {
        id: "signal-1",
        type: "growth",
        title: "Strong growth",
        description: "Company growth is accelerating.",
        strength: 1,
        confidence: 1,
      },
    ];

    mockFindMany.mockResolvedValue(signals);

    const result = await calculateOpportunityScore("company-1");

    expect(result.score).toBe(100);

    expect(result.explanation.summary).toBe(
      "Strong opportunity based on high-strength and high-confidence signals.",
    );
  });

  // ---------------------------------------------------------
  // TEST 10
  // ---------------------------------------------------------

  it("should call Prisma with the correct company id", async () => {
    mockFindMany.mockResolvedValue([]);

    await calculateOpportunityScore("company-123");

    expect(mockFindMany).toHaveBeenCalledTimes(1);

    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          companyId: "company-123",
        },
      }),
    );
  });
});