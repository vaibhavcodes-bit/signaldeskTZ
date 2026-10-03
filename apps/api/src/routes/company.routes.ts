import type { FastifyInstance } from "fastify";
import { prisma } from "../lib/prisma.js";

export async function companyRoutes(app: FastifyInstance) {
  // CREATE COMPANY
  app.post("/companies", async (request, reply) => {
    const body = request.body as {
      name: string;
      websiteUrl: string;
      description?: string;
      industry?: string;
      location?: string;
      employeeCount?: number;
    };

    if (!body.name || !body.websiteUrl) {
      return reply.status(400).send({
        success: false,
        message: "name and websiteUrl are required",
      });
    }

    try {
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

  // GET ALL COMPANIES
  app.get("/companies", async (request, reply) => {
    try {
      const companies = await prisma.company.findMany({
        orderBy: {
          createdAt: "desc",
        },
      });

      return {
        success: true,
        data: companies,
      };
    } catch (error) {
      request.log.error(error);

      return reply.status(500).send({
        success: false,
        message: "Failed to fetch companies",
      });
    }
  });

  // GET COMPANY BY ID
  app.get("/companies/:id", async (request, reply) => {
    const { id } = request.params as {
      id: string;
    };

    try {
      const company = await prisma.company.findUnique({
        where: { id },
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

  // UPDATE COMPANY
  app.patch("/companies/:id", async (request, reply) => {
    const { id } = request.params as {
      id: string;
    };

    const body = request.body as {
      name?: string;
      websiteUrl?: string;
      description?: string;
      industry?: string;
      location?: string;
      employeeCount?: number;
    };

    try {
      const company = await prisma.company.update({
        where: { id },
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

  // DELETE COMPANY
  app.delete("/companies/:id", async (request, reply) => {
    const { id } = request.params as {
      id: string;
    };

    try {
      await prisma.company.delete({
        where: { id },
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