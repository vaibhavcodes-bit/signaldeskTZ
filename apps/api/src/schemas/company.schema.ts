import { z } from "zod";

/**
 * CREATE COMPANY
 */
export const createCompanySchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Company name is required")
    .max(200, "Company name must be less than 200 characters"),

  websiteUrl: z
    .string()
    .trim()
    .url("websiteUrl must be a valid URL"),

  description: z
    .string()
    .trim()
    .min(1, "Description is required")
    .max(2000, "Description must be less than 2000 characters"),

  industry: z
    .string()
    .trim()
    .min(1, "Industry is required")
    .max(100, "Industry must be less than 100 characters"),

  location: z
    .string()
    .trim()
    .max(200, "Location must be less than 200 characters")
    .optional(),

  employeeCount: z
    .number()
    .int("employeeCount must be an integer")
    .positive("employeeCount must be greater than 0")
    .optional(),
});

/**
 * UPDATE COMPANY
 *
 * All fields are optional because PATCH
 * allows partial updates.
 */
export const updateCompanySchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, "Company name cannot be empty")
      .max(200, "Company name must be less than 200 characters")
      .optional(),

    websiteUrl: z
      .string()
      .trim()
      .url("websiteUrl must be a valid URL")
      .optional(),

    description: z
      .string()
      .trim()
      .min(1, "Description cannot be empty")
      .max(2000, "Description must be less than 2000 characters")
      .optional(),

    industry: z
      .string()
      .trim()
      .min(1, "Industry cannot be empty")
      .max(100, "Industry must be less than 100 characters")
      .optional(),

    location: z
      .string()
      .trim()
      .max(200, "Location must be less than 200 characters")
      .optional(),

    employeeCount: z
      .number()
      .int("employeeCount must be an integer")
      .positive("employeeCount must be greater than 0")
      .optional(),
  })
  .refine(
    (data) => Object.keys(data).length > 0,
    {
      message: "At least one field is required for update",
    },
  );

/**
 * GET COMPANIES QUERY PARAMETERS
 */
export const companyQuerySchema = z.object({
  search: z
    .string()
    .trim()
    .optional(),

  industry: z
    .string()
    .trim()
    .optional(),

  location: z
    .string()
    .trim()
    .optional(),

  page: z
    .coerce
    .number()
    .int()
    .min(1, "page must be at least 1")
    .default(1),

  limit: z
    .coerce
    .number()
    .int()
    .min(1, "limit must be at least 1")
    .max(100, "limit cannot exceed 100")
    .default(10),
});

export type CreateCompanyInput = z.infer<
  typeof createCompanySchema
>;

export type UpdateCompanyInput = z.infer<
  typeof updateCompanySchema
>;

export type CompanyQueryInput = z.infer<
  typeof companyQuerySchema
>;