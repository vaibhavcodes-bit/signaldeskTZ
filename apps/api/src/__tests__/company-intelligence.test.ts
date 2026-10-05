import { describe, expect, it, afterAll } from "vitest";

import { buildApp } from "../app.js";
import { prisma } from "../lib/prisma.js";

describe("Company Intelligence API", () => {
  const app = buildApp();

  let companyId: string;

  afterAll(async () => {
    // ----------------------------------------------------------
    // Clean up AI usage records
    // ----------------------------------------------------------

    if (companyId) {
      await prisma.aIUsage.deleteMany({
        where: {
          companyId,
        },
      });

      // --------------------------------------------------------
      // Clean up company
      // --------------------------------------------------------

      await prisma.company.delete({
        where: {
          id: companyId,
        },
      });
    }

    await app.close();
    await prisma.$disconnect();
  });

  // ============================================================
  // CREATE COMPANY
  // ============================================================

  it("should create a company for intelligence testing", async () => {
    const response = await app.inject({
      method: "POST",
      url: "/companies",
      payload: {
        name: "Anthropic",
        websiteUrl: "https://www.anthropic.com",
        description:
          "Anthropic is an AI safety and research company focusing on generative AI.",
        industry: "AI / Generative AI",
        employeeCount: 1000,
      },
    });

    expect(response.statusCode).toBe(201);

    const body = response.json();

    expect(body.success).toBe(true);
    expect(body.data).toBeDefined();
    expect(body.data.id).toBeDefined();

    companyId = body.data.id;
  });

  // ============================================================
  // GET INTELLIGENCE - NOT FOUND
  // ============================================================

  it("should return 404 when intelligence does not exist", async () => {
    const response = await app.inject({
      method: "GET",
      url: `/companies/${companyId}/intelligence`,
    });

    expect([200, 404]).toContain(response.statusCode);

    if (response.statusCode === 404) {
      const body = response.json();

      expect(body.success).toBe(false);
    }
  });

  // ============================================================
  // GENERATE INTELLIGENCE
  // ============================================================

  it("should generate company intelligence", async () => {
    const response = await app.inject({
      method: "POST",
      url: `/companies/${companyId}/intelligence`,
    });

    expect(response.statusCode).toBe(201);

    const body = response.json();

    expect(body.success).toBe(true);
    expect(body.data).toBeDefined();

    expect(body.data.companyId).toBe(companyId);
    expect(body.data.summary).toBeDefined();
    expect(body.data.industry).toBeDefined();
    expect(body.data.businessModel).toBeDefined();

    expect(Array.isArray(body.data.targetCustomers)).toBe(true);
    expect(Array.isArray(body.data.productsOrServices)).toBe(true);
    expect(Array.isArray(body.data.technologies)).toBe(true);
    expect(Array.isArray(body.data.growthSignals)).toBe(true);
    expect(Array.isArray(body.data.potentialOpportunities)).toBe(
      true,
    );

    expect(body.data.confidence).toBeGreaterThanOrEqual(0);
    expect(body.data.confidence).toBeLessThanOrEqual(1);
  });

  // ============================================================
  // GET INTELLIGENCE
  // ============================================================

  it("should return generated company intelligence", async () => {
    const response = await app.inject({
      method: "GET",
      url: `/companies/${companyId}/intelligence`,
    });

    expect(response.statusCode).toBe(200);

    const body = response.json();

    expect(body.success).toBe(true);
    expect(body.data).toBeDefined();

    expect(body.data.companyId).toBe(companyId);
    expect(body.data.summary).toBeDefined();
    expect(body.data.industry).toBeDefined();
    expect(body.data.businessModel).toBeDefined();
  });

  // ============================================================
  // DUPLICATE GENERATION
  // ============================================================

  it("should return existing intelligence instead of creating a duplicate", async () => {
    const response = await app.inject({
      method: "POST",
      url: `/companies/${companyId}/intelligence`,
    });

    expect(response.statusCode).toBe(200);

    const body = response.json();

    expect(body.success).toBe(true);
    expect(body.data).toBeDefined();
    expect(body.data.companyId).toBe(companyId);
  });

  // ============================================================
  // REGENERATE INTELLIGENCE
  // ============================================================

  it("should regenerate company intelligence", async () => {
    const response = await app.inject({
      method: "POST",
      url: `/companies/${companyId}/intelligence/regenerate`,
      payload: {},
    });

    expect(response.statusCode).toBe(200);

    const body = response.json();

    expect(body.success).toBe(true);
    expect(body.message).toBe(
      "Company intelligence regenerated",
    );

    expect(body.data).toBeDefined();
    expect(body.data.companyId).toBe(companyId);

    expect(body.data.summary).toBeDefined();
    expect(body.data.industry).toBeDefined();
    expect(body.data.businessModel).toBeDefined();

    expect(body.data.confidence).toBeGreaterThanOrEqual(0);
    expect(body.data.confidence).toBeLessThanOrEqual(1);
  });

  // ============================================================
  // AI USAGE
  // ============================================================

  it("should return AI usage for the company", async () => {
    const response = await app.inject({
      method: "GET",
      url: `/companies/${companyId}/ai-usage`,
    });

    expect(response.statusCode).toBe(200);

    const body = response.json();

    expect(body.success).toBe(true);
    expect(body.data).toBeDefined();

    // ----------------------------------------------------------
    // Company/provider
    // ----------------------------------------------------------

    expect(body.data.companyId).toBe(companyId);
    expect(body.data.provider).toBe("groq");

    // ----------------------------------------------------------
    // Records
    // ----------------------------------------------------------

    expect(Array.isArray(body.data.records)).toBe(true);

    // ----------------------------------------------------------
    // Totals
    // ----------------------------------------------------------

    expect(body.data.totals).toBeDefined();

    expect(
      typeof body.data.totals.inputTokens,
    ).toBe("number");

    expect(
      typeof body.data.totals.outputTokens,
    ).toBe("number");

    expect(
      typeof body.data.totals.totalTokens,
    ).toBe("number");

    expect(
      typeof body.data.totals.estimatedCost,
    ).toBe("number");

    expect(body.data.totals.inputTokens).toBeGreaterThanOrEqual(
      0,
    );

    expect(body.data.totals.outputTokens).toBeGreaterThanOrEqual(
      0,
    );

    expect(body.data.totals.totalTokens).toBeGreaterThanOrEqual(
      0,
    );

    expect(body.data.totals.estimatedCost).toBeGreaterThanOrEqual(
      0,
    );

    // ----------------------------------------------------------
    // Token consistency
    // ----------------------------------------------------------

    expect(body.data.totals.totalTokens).toBe(
      body.data.totals.inputTokens +
        body.data.totals.outputTokens,
    );

    // ----------------------------------------------------------
    // Validate individual records
    // ----------------------------------------------------------

    for (const record of body.data.records) {
      expect(record.id).toBeDefined();
      expect(record.companyId).toBe(companyId);

      expect(record.provider).toBe("groq");
      expect(record.model).toBeDefined();

      expect(typeof record.inputTokens).toBe("number");
      expect(typeof record.outputTokens).toBe("number");
      expect(typeof record.totalTokens).toBe("number");
      expect(typeof record.estimatedCost).toBe("number");

      expect(record.inputTokens).toBeGreaterThanOrEqual(0);
      expect(record.outputTokens).toBeGreaterThanOrEqual(0);
      expect(record.totalTokens).toBeGreaterThanOrEqual(0);
      expect(record.estimatedCost).toBeGreaterThanOrEqual(0);

      expect(record.totalTokens).toBe(
        record.inputTokens + record.outputTokens,
      );
    }
  });
});