import type { FastifyInstance } from "fastify";
import { prisma } from "../lib/prisma.js";
import {
  createCompanySchema,
  updateCompanySchema,
  companyQuerySchema,
} from "../schemas/company.schema.js";

export async function companyRoutes(app: FastifyInstance) {
  // ============================================
  // CREATE COMPANY
  // ============================================

  app.post("/companies", async (request, reply) => {
    // -----------------------------
    // 1. Validate request body
    // -----------------------------

    const result = createCompanySchema.safeParse(request.body);

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

    const body = result.data;

    try {
      // -----------------------------
      // 2. Create company
      // -----------------------------

      const company = await prisma.company.create({
        data: {
          name: body.name,
          websiteUrl: body.websiteUrl,
          description: body.description,
          industry: body.industry,
          location: body.location,
          employeeCount: body.employeeCount,
        },
      });

      return reply.status(201).send({
        success: true,
        data: company,
      });
    } catch (error) {
      request.log.error(error);

      return reply.status(500).send({
        success: false,
        message: "Failed to create company",
      });
    }
  });

  // ============================================
  // GET ALL COMPANIES
  // SEARCH / FILTER / PAGINATION
  // ============================================

  app.get("/companies", async (request, reply) => {
    // -----------------------------
    // 1. Validate query parameters
    // -----------------------------

    const result = companyQuerySchema.safeParse(request.query);

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

    const {
      search,
      industry,
      location,
      page,
      limit,
    } = result.data;

    try {
      // -----------------------------
      // 2. Build filters
      // -----------------------------

      const where = {
        ...(search
          ? {
              OR: [
                {
                  name: {
                    contains: search,
                    mode: "insensitive" as const,
                  },
                },
                {
                  description: {
                    contains: search,
                    mode: "insensitive" as const,
                  },
                },
                {
                  websiteUrl: {
                    contains: search,
                    mode: "insensitive" as const,
                  },
                },
              ],
            }
          : {}),

        ...(industry
          ? {
              industry: {
                contains: industry,
                mode: "insensitive" as const,
              },
            }
          : {}),

        ...(location
          ? {
              location: {
                contains: location,
                mode: "insensitive" as const,
              },
            }
          : {}),
      };

      // -----------------------------
      // 3. Pagination
      // -----------------------------

      const skip = (page - 1) * limit;

      // -----------------------------
      // 4. Get companies + total
      // -----------------------------

      const [companies, total] = await Promise.all([
        prisma.company.findMany({
          where,
          orderBy: {
            createdAt: "desc",
          },
          skip,
          take: limit,
        }),

        prisma.company.count({
          where,
        }),
      ]);

      const totalPages =
        total === 0 ? 0 : Math.ceil(total / limit);

      // -----------------------------
      // 5. Response
      // -----------------------------

      return {
        success: true,
        data: companies,
        pagination: {
          page,
          limit,
          total,
          totalPages,
        },
      };
    } catch (error) {
      request.log.error(error);

      return reply.status(500).send({
        success: false,
        message: "Failed to fetch companies",
      });
    }
  });

  // ============================================
  // GET COMPANY BY ID
  // ============================================

  app.get("/companies/:id", async (request, reply) => {
    const { id } = request.params as {
      id: string;
    };

    try {
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

      return {
        success: true,
        data: company,
      };
    } catch (error) {
      request.log.error(error);

      return reply.status(500).send({
        success: false,
        message: "Failed to fetch company",
      });
    }
  });

  // ============================================
  // UPDATE COMPANY
  // ============================================

  app.patch("/companies/:id", async (request, reply) => {
    const { id } = request.params as {
      id: string;
    };

    // -----------------------------
    // 1. Validate request body
    // -----------------------------

    const result = updateCompanySchema.safeParse(request.body);

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

    const body = result.data;

    try {
      // -----------------------------
      // 2. Update company
      // -----------------------------

      const company = await prisma.company.update({
        where: {
          id,
        },
        data: body,
      });

      return {
        success: true,
        data: company,
      };
    } catch (error) {
      request.log.error(error);

      return reply.status(404).send({
        success: false,
        message: "Company not found",
      });
    }
  });

  // ============================================
  // DELETE COMPANY
  // ============================================

  app.delete("/companies/:id", async (request, reply) => {
    const { id } = request.params as {
      id: string;
    };

    try {
      await prisma.company.delete({
        where: {
          id,
        },
      });

      return {
        success: true,
        message: "Company deleted successfully",
      };
    } catch (error) {
      request.log.error(error);

      return reply.status(404).send({
        success: false,
        message: "Company not found",
      });
    }
  });
}