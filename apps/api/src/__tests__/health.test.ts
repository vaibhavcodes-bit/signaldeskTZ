import { describe, expect, it } from "vitest";
import { buildApp } from "../app.js";

describe("Health API", () => {
  it("should return API health status", async () => {
    const app = buildApp();

    const response = await app.inject({
      method: "GET",
      url: "/health",
    });

    expect(response.statusCode).toBe(200);

    expect(response.json()).toEqual({
      success: true,
      message: "API is running",
    });

    await app.close();
  });
});