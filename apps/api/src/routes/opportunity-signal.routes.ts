import type { FastifyInstance } from "fastify";
import { Prisma } from "../generated/prisma/client.js";

import {
  createOpportunitySignalSchema,
  opportunitySignalQuerySchema,
} from "../schemas/opportunity.schema.js";

import {
  createOpportunitySignals,
  getOpportunitySignals,
  deleteOpportunitySignals,
} from "../opportunities/signal.service.js";

import { prisma } from "../lib/prisma.js";

export async function opportunitySignalRoutes(
  app: FastifyInstance,
) {
  // ============================================================
  // GET OPPORTUNITY SIGNALS
  // ============================================================

  app.get(
    "/companies/:companyId/opportunity-signals",
    async (request, reply) => {
      const { companyId } = request.params as {
        companyId: string;
      };

      try {
        // --------------------------------------------------------
        // Check company exists
        // --------------------------------------------------------

        const company = await prisma.company.findUnique({
          where: {
            id: companyId,
          },
        });

        if (!company) {
          return reply.status(404).send({
            success: false,
            message: "Company not found",
          });
        }

        // --------------------------------------------------------
        // Get signals
        // --------------------------------------------------------

        const signals =
          await getOpportunitySignals(companyId);

        return {
          success: true,
          data: signals,
        };
      } catch (error) {
        request.log.error(error);

        return reply.status(500).send({
          success: false,
          message: "Failed to fetch opportunity signals",
        });
      }
    },
  );

  // ============================================================
  // CREATE OPPORTUNITY SIGNAL
  // ============================================================

  app.post(
    "/companies/:companyId/opportunity-signals",
    async (request, reply) => {
      const { companyId } = request.params as {
        companyId: string;
      };

      try {
        // --------------------------------------------------------
        // 1. Check company exists
        // --------------------------------------------------------

        const company = await prisma.company.findUnique({
          where: {
            id: companyId,
          },
        });

        if (!company) {
          return reply.status(404).send({
            success: false,
            message: "Company not found",
          });
        }

        // --------------------------------------------------------
        // 2. Validate request body
        // --------------------------------------------------------

        const result =
          createOpportunitySignalSchema.safeParse(
            request.body,
          );

        if (!result.success) {
          return reply.status(400).send({
            success: false,
            message: "Validation failed",
            errors: result.error.issues.map((issue) => ({
              field: issue.path.join("."),
              message: issue.message,
            })),
          });
        }

        // --------------------------------------------------------
        // 3. Convert evidence to Prisma JSON input
        // --------------------------------------------------------

        const signal = {
          type: result.data.type,
          title: result.data.title,
          description: result.data.description,
          strength: result.data.strength,
          confidence: result.data.confidence,

          // Zod currently returns evidence as `unknown`.
          // Prisma expects `InputJsonValue`.
          evidence:
            result.data.evidence as Prisma.InputJsonValue,
        };

        // --------------------------------------------------------
        // 4. Create signal
        // --------------------------------------------------------

        const signals =
          await createOpportunitySignals(
            companyId,
            [signal],
          );

        // --------------------------------------------------------
        // 5. Return created signal
        // --------------------------------------------------------

        return reply.status(201).send({
          success: true,
          data: signals[0],
        });
      } catch (error) {
        request.log.error(error);

        return reply.status(500).send({
          success: false,
          message: "Failed to create opportunity signal",
        });
      }
    },
  );

  // ============================================================
  // DELETE ALL SIGNALS FOR COMPANY
  // ============================================================

  app.delete(
    "/companies/:companyId/opportunity-signals",
    async (request, reply) => {
      const { companyId } = request.params as {
        companyId: string;
      };

      try {
        // --------------------------------------------------------
        // Check company exists
        // --------------------------------------------------------

        const company = await prisma.company.findUnique({
          where: {
            id: companyId,
          },
        });

        if (!company) {
          return reply.status(404).send({
            success: false,
            message: "Company not found",
          });
        }

        // --------------------------------------------------------
        // Delete signals
        // --------------------------------------------------------

        const result =
          await deleteOpportunitySignals(companyId);

        return {
          success: true,
          deleted: result.count,
        };
      } catch (error) {
        request.log.error(error);

        return reply.status(500).send({
          success: false,
          message: "Failed to delete opportunity signals",
        });
      }
    },
  );
}