import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import app from "../src/server.js";

describe("TypeAhead API Tests", () => {
  beforeAll(async () => {
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it("GET /suggest - should return suggestions from the DB", async () => {
    const response = await request(app.server).get("/api/v1/suggest?q=app");

    expect(response.status).toBe(200);
    expect(response.body.message).toBe("search suggestions (v1)");
    expect(Array.isArray(response.body.data)).toBe(true);
  });

  it("POST /search - should save a query successfully", async () => {
    const response = await request(app.server)
        .post("/api/v1/search")
        .send({ query: "apple" });

    expect(response.status).toBe(200);
    expect(response.body.message).toBe("Searched");
  });

});
