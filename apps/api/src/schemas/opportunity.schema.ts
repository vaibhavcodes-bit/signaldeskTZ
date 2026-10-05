import { z } from "zod";

export const createOpportunitySignalSchema = z.object({
  type: z.string().min(1).max(100),

  title: z.string().min(1).max(200),

  description: z.string().min(1).max(2000),

  strength: z.number().min(0).max(1),

  confidence: z.number().min(0).max(1),

  evidence: z.unknown(),
});

export const opportunitySignalQuerySchema = z.object({
  type: z.string().optional(),
});