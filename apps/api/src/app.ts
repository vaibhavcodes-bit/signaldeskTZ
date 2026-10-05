import Fastify, { type FastifyInstance } from "fastify";
import rateLimit from "@fastify/rate-limit";

import { companyRoutes } from "./routes/company.routes.js";
import {
  opportunitySignalRoutes,
} from "./routes/opportunity-signal.routes.js";
import {
  companyIntelligenceRoutes,
} from "./routes/company-intelligence.routes.js";

export const buildApp = (): FastifyInstance => {
  const app = Fastify({
    logger: true,
  });

  // ============================================================
  // GLOBAL ERROR HANDLER
  // ============================================================

  app.setErrorHandler((error, request, reply) => {
    request.log.error(
      {
        error,
        method: request.method,
        url: request.url,
      },
      "Unhandled request error",
    );

    // ----------------------------------------------------------
    // Safely extract status code
    // ----------------------------------------------------------

    const statusCode =
      typeof (error as { statusCode?: unknown }).statusCode ===
      "number"
        ? (error as { statusCode: number }).statusCode
        : 500;

    // ----------------------------------------------------------
    // Safely extract error message
    // ----------------------------------------------------------

    const errorMessage =
      error instanceof Error
        ? error.message
        : "Request failed";

    // ----------------------------------------------------------
    // Validation errors
    // ----------------------------------------------------------

    const validation = (
      error as {
        validation?: Array<{
          instancePath?: string;
          keyword?: string;
          message?: string;
          params?: {
            missingProperty?: string;
          };
        }>;
      }
    ).validation;

    if (Array.isArray(validation)) {
      return reply.status(400).send({
        success: false,
        message: "Validation failed",
        errors: validation.map((item) => ({
          field:
            item.instancePath?.replace(/^\//, "") ||
            item.params?.missingProperty ||
            "unknown",

          message: item.message || "Invalid value",
        })),
      });
    }

    // ----------------------------------------------------------
    // Rate limit
    // ----------------------------------------------------------

    if (statusCode === 429) {
      return reply.status(429).send({
        success: false,
        message:
          "Too many requests. Please try again later.",
      });
    }

    // ----------------------------------------------------------
    // Server errors
    // ----------------------------------------------------------

    if (statusCode >= 500) {
      return reply.status(statusCode).send({
        success: false,
        message: "Internal server error",
      });
    }

    // ----------------------------------------------------------
    // Client errors
    // ----------------------------------------------------------

    return reply.status(statusCode).send({
      success: false,
      message: errorMessage,
    });
  });

  // ============================================================
  // RATE LIMITING
  // ============================================================

  app.register(rateLimit, {
    max: 100,
    timeWindow: "1 minute",
  });

  // ============================================================
  // ROUTES
  // ============================================================

  app.register(companyRoutes);
  app.register(companyIntelligenceRoutes);
  app.register(opportunitySignalRoutes);
  // ============================================================
  // HEALTH CHECK
  // ============================================================

  app.get("/health", async () => {
    return {
      success: true,
      message: "API is running",
    };
  });

  return app;
};