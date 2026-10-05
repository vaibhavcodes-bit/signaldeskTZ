import type { FastifyInstance } from "fastify";

import { prisma } from "../lib/prisma.js";
import { analyzeCompany } from "../ai/company-intelligence.service.js";
import { GROQ_MODEL } from "../ai/groq.js";

/**
 * ============================================================
 * GROQ COST CONFIGURATION
 * ============================================================
 *
 * Prices are USD per 1,000,000 tokens.
 *
 * Configure these in your .env file:
 *
 * GROQ_INPUT_COST_PER_1M=YOUR_INPUT_PRICE
 * GROQ_OUTPUT_COST_PER_1M=YOUR_OUTPUT_PRICE
 *
 * Keeping pricing in environment variables makes it easy to
 * update pricing without changing application code.
 */

const GROQ_INPUT_COST_PER_1M = Number(
  process.env.GROQ_INPUT_COST_PER_1M ?? 0,
);

const GROQ_OUTPUT_COST_PER_1M = Number(
  process.env.GROQ_OUTPUT_COST_PER_1M ?? 0,
);

/**
 * ============================================================
 * CALCULATE AI COST
 * ============================================================
 */

function calculateGroqCost(
  inputTokens: number,
  outputTokens: number,
): number {
  const inputCost =
    (inputTokens / 1_000_000) *
    GROQ_INPUT_COST_PER_1M;

  const outputCost =
    (outputTokens / 1_000_000) *
    GROQ_OUTPUT_COST_PER_1M;

  return Number(
    (inputCost + outputCost).toFixed(8),
  );
}

/**
 * ============================================================
 * COMPANY INTELLIGENCE ROUTES
 * ============================================================
 */

export async function companyIntelligenceRoutes(
  app: FastifyInstance,
) {
  /**
   * ==========================================================
   * GENERATE COMPANY INTELLIGENCE
   * ==========================================================
   */

  app.post(
    "/companies/:id/intelligence",
    async (request, reply) => {
      const { id } = request.params as {
        id: string;
      };

      try {
        // ------------------------------------------------------
        // 1. Find company
        // ------------------------------------------------------

        const company = await prisma.company.findUnique({
          where: {
            id,
          },
        });

        if (!company) {
          return reply.status(404).send({
            success: false,
            message: "Company not found",
          });
        }

        // ------------------------------------------------------
        // 2. Check existing intelligence
        // ------------------------------------------------------

        const existingIntelligence =
          await prisma.companyIntelligence.findUnique({
            where: {
              companyId: id,
            },
          });

        if (existingIntelligence) {
          return {
            success: true,
            message:
              "Company intelligence already exists",
            data: existingIntelligence,
          };
        }

        // ------------------------------------------------------
        // 3. Call AI service
        // ------------------------------------------------------

        const result = await analyzeCompany({
          name: company.name,
          websiteUrl: company.websiteUrl,
          description: company.description,
          industry: company.industry,
        });

        const intelligence = result.intelligence;
        const usage = result.usage;

        // ------------------------------------------------------
        // 4. Calculate AI cost
        // ------------------------------------------------------

        const estimatedCost = calculateGroqCost(
          usage.inputTokens,
          usage.outputTokens,
        );

        // ------------------------------------------------------
        // 5. Save intelligence + AI usage
        // ------------------------------------------------------

        const savedIntelligence =
          await prisma.$transaction(async (tx) => {
            const intelligenceRecord =
              await tx.companyIntelligence.create({
                data: {
                  companyId: company.id,

                  summary: intelligence.summary,
                  industry: intelligence.industry,
                  businessModel:
                    intelligence.businessModel,

                  targetCustomers:
                    intelligence.targetCustomers,

                  productsOrServices:
                    intelligence.productsOrServices,

                  technologies:
                    intelligence.technologies,

                  growthSignals:
                    intelligence.growthSignals,

                  potentialOpportunities:
                    intelligence.potentialOpportunities,

                  confidence:
                    intelligence.confidence,
                },
              });

            // --------------------------------------------------
            // Save AI usage
            // --------------------------------------------------

            await tx.aIUsage.create({
              data: {
                companyId: company.id,

                provider: "groq",
                model: GROQ_MODEL,

                inputTokens:
                  usage.inputTokens,

                outputTokens:
                  usage.outputTokens,

                totalTokens:
                  usage.totalTokens,

                estimatedCost,
              },
            });

            return intelligenceRecord;
          });

        // ------------------------------------------------------
        // 6. Return response
        // ------------------------------------------------------

        return reply.status(201).send({
          success: true,
          message:
            "Company intelligence generated",
          data: savedIntelligence,
        });
      } catch (error) {
        request.log.error(error);

        return reply.status(500).send({
          success: false,
          message:
            "Failed to generate company intelligence",
        });
      }
    },
  );

  /**
   * ==========================================================
   * REGENERATE COMPANY INTELLIGENCE
   * ==========================================================
   */

  app.post(
    "/companies/:id/intelligence/regenerate",
    async (request, reply) => {
      const { id } = request.params as {
        id: string;
      };

      try {
        // ------------------------------------------------------
        // 1. Find company
        // ------------------------------------------------------

        const company = await prisma.company.findUnique({
          where: {
            id,
          },
        });

        if (!company) {
          return reply.status(404).send({
            success: false,
            message: "Company not found",
          });
        }

        // ------------------------------------------------------
        // 2. Always call AI
        // ------------------------------------------------------

        const result = await analyzeCompany({
          name: company.name,
          websiteUrl: company.websiteUrl,
          description: company.description,
          industry: company.industry,
        });

        const intelligence = result.intelligence;
        const usage = result.usage;

        // ------------------------------------------------------
        // 3. Calculate AI cost
        // ------------------------------------------------------

        const estimatedCost = calculateGroqCost(
          usage.inputTokens,
          usage.outputTokens,
        );

        // ------------------------------------------------------
        // 4. Update intelligence + save usage
        // ------------------------------------------------------

        const savedIntelligence =
          await prisma.$transaction(async (tx) => {
            const intelligenceRecord =
              await tx.companyIntelligence.upsert({
                where: {
                  companyId: company.id,
                },

                create: {
                  companyId: company.id,

                  summary: intelligence.summary,
                  industry: intelligence.industry,
                  businessModel:
                    intelligence.businessModel,

                  targetCustomers:
                    intelligence.targetCustomers,

                  productsOrServices:
                    intelligence.productsOrServices,

                  technologies:
                    intelligence.technologies,

                  growthSignals:
                    intelligence.growthSignals,

                  potentialOpportunities:
                    intelligence.potentialOpportunities,

                  confidence:
                    intelligence.confidence,
                },

                update: {
                  summary: intelligence.summary,
                  industry: intelligence.industry,
                  businessModel:
                    intelligence.businessModel,

                  targetCustomers:
                    intelligence.targetCustomers,

                  productsOrServices:
                    intelligence.productsOrServices,

                  technologies:
                    intelligence.technologies,

                  growthSignals:
                    intelligence.growthSignals,

                  potentialOpportunities:
                    intelligence.potentialOpportunities,

                  confidence:
                    intelligence.confidence,
                },
              });

            // --------------------------------------------------
            // Save every regeneration as a separate usage record
            // --------------------------------------------------

            await tx.aIUsage.create({
              data: {
                companyId: company.id,

                provider: "groq",
                model: GROQ_MODEL,

                inputTokens:
                  usage.inputTokens,

                outputTokens:
                  usage.outputTokens,

                totalTokens:
                  usage.totalTokens,

                estimatedCost,
              },
            });

            return intelligenceRecord;
          });

        // ------------------------------------------------------
        // 5. Return response
        // ------------------------------------------------------

        return {
          success: true,
          message:
            "Company intelligence regenerated",
          data: savedIntelligence,
        };
      } catch (error) {
        request.log.error(error);

        return reply.status(500).send({
          success: false,
          message:
            "Failed to regenerate company intelligence",
        });
      }
    },
  );

  /**
   * ==========================================================
   * GET COMPANY INTELLIGENCE
   * ==========================================================
   */

  app.get(
    "/companies/:id/intelligence",
    async (request, reply) => {
      const { id } = request.params as {
        id: string;
      };

      try {
        // ------------------------------------------------------
        // 1. Verify company exists
        // ------------------------------------------------------

        const company = await prisma.company.findUnique({
          where: {
            id,
          },
        });

        if (!company) {
          return reply.status(404).send({
            success: false,
            message: "Company not found",
          });
        }

        // ------------------------------------------------------
        // 2. Find intelligence
        // ------------------------------------------------------

        const intelligence =
          await prisma.companyIntelligence.findUnique({
            where: {
              companyId: id,
            },
          });

        if (!intelligence) {
          return reply.status(404).send({
            success: false,
            message:
              "Company intelligence has not been generated yet",
          });
        }

        // ------------------------------------------------------
        // 3. Return intelligence
        // ------------------------------------------------------

        return {
          success: true,
          data: intelligence,
        };
      } catch (error) {
        request.log.error(error);

        return reply.status(500).send({
          success: false,
          message:
            "Failed to fetch company intelligence",
        });
      }
    },
  );
// ==========================================================
// GET AI USAGE
// ==========================================================

app.get(
  "/companies/:id/ai-usage",
  async (request, reply) => {
    const { id } = request.params as {
      id: string;
    };

    try {
      // ------------------------------------------------------
      // 1. Verify company exists
      // ------------------------------------------------------

      const company = await prisma.company.findUnique({
        where: {
          id,
        },
      });

      if (!company) {
        return reply.status(404).send({
          success: false,
          message: "Company not found",
        });
      }

      // ------------------------------------------------------
      // 2. Fetch AI usage
      // ------------------------------------------------------

      const records = await prisma.aIUsage.findMany({
        where: {
          companyId: id,
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      // ------------------------------------------------------
      // 3. Normalize every database value
      // ------------------------------------------------------

      const normalizedRecords = records.map((record) => {
        const inputTokens = Number(record.inputTokens);
        const outputTokens = Number(record.outputTokens);
        const totalTokens = Number(record.totalTokens);
        const estimatedCost = Number(record.estimatedCost);

        return {
          id: String(record.id),
          companyId: String(record.companyId),
          provider: String(record.provider),
          model: String(record.model),

          inputTokens: Number.isFinite(inputTokens)
            ? inputTokens
            : 0,

          outputTokens: Number.isFinite(outputTokens)
            ? outputTokens
            : 0,

          totalTokens: Number.isFinite(totalTokens)
            ? totalTokens
            : 0,

          estimatedCost: Number.isFinite(estimatedCost)
            ? estimatedCost
            : 0,

          createdAt: record.createdAt,
        };
      });

      // ------------------------------------------------------
      // 4. Calculate primitive-number totals
      // ------------------------------------------------------

      let inputTokens = 0;
      let outputTokens = 0;
      let totalTokens = 0;
      let estimatedCost = 0;

      for (const record of normalizedRecords) {
        inputTokens += record.inputTokens;
        outputTokens += record.outputTokens;
        totalTokens += record.totalTokens;
        estimatedCost += record.estimatedCost;
      }

      // ------------------------------------------------------
      // 5. Create a completely new totals object
      // ------------------------------------------------------

      const responseTotals = {
        inputTokens: Number(inputTokens),
        outputTokens: Number(outputTokens),
        totalTokens: Number(totalTokens),
        estimatedCost: Number(
          estimatedCost.toFixed(8),
        ),
      };

      // ------------------------------------------------------
      // 6. Safety check
      // ------------------------------------------------------

      if (
        typeof responseTotals.inputTokens !== "number" ||
        typeof responseTotals.outputTokens !== "number" ||
        typeof responseTotals.totalTokens !== "number" ||
        typeof responseTotals.estimatedCost !== "number"
      ) {
        throw new Error(
          "AI usage totals must contain primitive numbers",
        );
      }

      // ------------------------------------------------------
      // 7. Return API response
      // ------------------------------------------------------

      return reply.status(200).send({
        success: true,

        data: {
          companyId: id,

          provider: "groq",

          records: normalizedRecords,

          totals: {
            inputTokens: responseTotals.inputTokens,
            outputTokens: responseTotals.outputTokens,
            totalTokens: responseTotals.totalTokens,
            estimatedCost: responseTotals.estimatedCost,
          },
        },
      });
    } catch (error) {
      request.log.error(error);

      return reply.status(500).send({
        success: false,
        message: "Failed to fetch AI usage",
      });
    }
  },
);
}