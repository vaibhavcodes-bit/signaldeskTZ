import {
  afterAll,
  beforeAll,
  describe,
  expect,
  it,
} from "vitest";

import { buildApp } from "../app.js";
import { prisma } from "../lib/prisma.js";

describe("Company API", () => {
  // ============================================================
  // Create a fresh Fastify application for this test suite
  // ============================================================
  const app = buildApp();

  let companyId: string | undefined;

  // ============================================================
  // Test company data
  // ============================================================

  const testCompany = {
    name: "Vitest Test Company",
    websiteUrl: "https://vitest-test-company.com",
    description: "Company created for automated API testing.",
    industry: "Technology",
    employeeCount: 100,
    location: "Bengaluru, India",
  };

  // ============================================================
  // BEFORE ALL TESTS
  // ============================================================
  //
  // Why:
  // Removes an old test company so every test run starts
  // from a predictable database state.
  //
  // What changes:
  // Prevents duplicate-data failures between test runs.
  // ============================================================

  beforeAll(async () => {
    await prisma.company.deleteMany({
      where: {
        name: testCompany.name,
      },
    });
  });

  // ============================================================
  // AFTER ALL TESTS
  // ============================================================
  //
  // Why:
  // Removes the company created by this test suite and closes
  // the Fastify instance.
  //
  // What changes:
  // Prevents test data from polluting the development database
  // and prevents open Fastify handles after Vitest finishes.
  // ============================================================

  afterAll(async () => {
    if (companyId) {
      await prisma.company.delete({
        where: {
          id: companyId,
        },
      });
    }

    await app.close();
  });

  // ============================================================
  // TEST 1: CREATE COMPANY
  // ============================================================
  //
  // Why:
  // Verifies that POST /companies can create a company.
  //
  // What changes:
  // Confirms the complete request → validation → Prisma →
  // response flow works.
  // ============================================================

  it("should create a company", async () => {
    const response = await app.inject({
      method: "POST",
      url: "/companies",
      payload: testCompany,
    });

    expect(response.statusCode).toBe(201);

    const body = response.json();

    expect(body.success).toBe(true);
    expect(body.data).toBeDefined();

    expect(body.data.name).toBe(testCompany.name);
    expect(body.data.websiteUrl).toBe(
      testCompany.websiteUrl,
    );
    expect(body.data.description).toBe(
      testCompany.description,
    );
    expect(body.data.industry).toBe(testCompany.industry);

    expect(body.data.id).toBeDefined();

    companyId = body.data.id;
  });

  // ============================================================
  // TEST 2: LIST COMPANIES
  // ============================================================
  //
  // Why:
  // Verifies pagination/listing works.
  //
  // What changes:
  // Confirms GET /companies returns a valid paginated response.
  // ============================================================

  it("should list companies with pagination", async () => {
    const response = await app.inject({
      method: "GET",
      url: "/companies?page=1&limit=10",
    });

    expect(response.statusCode).toBe(200);

    const body = response.json();

    expect(body.success).toBe(true);
    expect(body.data).toBeDefined();
  });

  // ============================================================
  // TEST 3: GET COMPANY BY ID
  // ============================================================
  //
  // Why:
  // Verifies that a company can be retrieved using its ID.
  //
  // What changes:
  // Confirms the detail endpoint correctly queries Prisma
  // using the company ID.
  // ============================================================

  it("should get a company by id", async () => {
    expect(companyId).toBeDefined();

    const response = await app.inject({
      method: "GET",
      url: `/companies/${companyId}`,
    });

    expect(response.statusCode).toBe(200);

    const body = response.json();

    expect(body.success).toBe(true);
    expect(body.data).toBeDefined();

    expect(body.data.id).toBe(companyId);
    expect(body.data.name).toBe(testCompany.name);
    expect(body.data.websiteUrl).toBe(
      testCompany.websiteUrl,
    );
  });

  // ============================================================
  // TEST 4: SEARCH COMPANIES
  // ============================================================
  //
  // Why:
  // Verifies the company search functionality.
  //
  // What changes:
  // Confirms the search query is passed to the backend and
  // matching companies are returned.
  // ============================================================

  it("should search companies", async () => {
    const response = await app.inject({
      method: "GET",
      url: "/companies?search=Vitest&page=1&limit=10",
    });

    expect(response.statusCode).toBe(200);

    const body = response.json();

    expect(body.success).toBe(true);
    expect(body.data).toBeDefined();
  });

  // ============================================================
  // TEST 5: INVALID PAGINATION
  // ============================================================
  //
  // Why:
  // Verifies that invalid pagination values are rejected.
  //
  // What changes:
  // Confirms request validation prevents invalid values such
  // as a negative page number from reaching business logic.
  // ============================================================

  it("should reject invalid pagination", async () => {
    const response = await app.inject({
      method: "GET",
      url: "/companies?page=-5&limit=10",
    });

    expect(response.statusCode).toBe(400);

    const body = response.json();

    expect(body.success).toBe(false);
  });

  // ============================================================
  // TEST 6: INVALID COMPANY PAYLOAD
  // ============================================================
  //
  // Why:
  // Verifies that invalid company creation data is rejected.
  //
  // What changes:
  // Confirms schema validation and the global error handler
  // return a clean 400 response.
  // ============================================================

  it("should reject invalid company payload", async () => {
    const response = await app.inject({
      method: "POST",
      url: "/companies",
      payload: {
        name: "",
      },
    });

    expect(response.statusCode).toBe(400);

    const body = response.json();

    expect(body.success).toBe(false);
    expect(body.message).toBe("Validation failed");
    expect(Array.isArray(body.errors)).toBe(true);
  });
});