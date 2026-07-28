import path from "path";
import SwaggerParser from "@apidevtools/swagger-parser";
import { describe, expect, it } from "vitest";
import {
  isSwaggerEnabled,
  loadSwaggerDocument,
} from "../../src/config/swagger";

const documentPath = path.resolve(
  __dirname,
  "../../docs/openapi.yaml"
);

describe("OpenAPI documentation", () => {
  it("validates and resolves the bearer security scheme", async () => {
    const api = await SwaggerParser.validate(documentPath);

    expect(api.openapi).toMatch(/^3\./);
    expect(
      api.components?.securitySchemes?.bearerAuth
    ).toMatchObject({
      type: "http",
      scheme: "bearer",
      bearerFormat: "JWT",
    });
  });

  it("contains unique operations for the main Express routes", () => {
    const document = loadSwaggerDocument() as {
      paths?: Record<string, Record<string, unknown>>;
    };
    const expectedOperations = [
      ["post", "/api/auth/login"],
      ["post", "/api/registration/register-ra"],
      ["post", "/api/broker/register-broker"],
      ["post", "/api/research/calls"],
      ["patch", "/api/research/calls/{id}/publish"],
      ["patch", "/api/research/calls/{id}/exit"],
      ["post", "/api/research/calls/errata"],
      ["get", "/api/performance"],
      ["get", "/notifications"],
      ["post", "/api/telegram/send-ra-message"],
      ["get", "/api/whatsapp/participants"],
      ["get", "/api/subscriptions/me"],
      ["post", "/api/payments/registration-verify"],
      ["get", "/api/audit-logs"],
      ["post", "/admin/approve-user"],
    ] as const;

    for (const [method, routePath] of expectedOperations) {
      expect(document.paths?.[routePath]?.[method]).toBeDefined();
    }

    const operationKeys = Object.entries(
      document.paths || {}
    ).flatMap(([routePath, pathItem]) =>
      Object.keys(pathItem)
        .filter((method) =>
          [
            "get",
            "post",
            "put",
            "patch",
            "delete",
          ].includes(method)
        )
        .map(
          (method) =>
            `${method.toUpperCase()} ${routePath}`
        )
    );

    expect(new Set(operationKeys).size).toBe(
      operationKeys.length
    );
  });

  it("is opt-in in development and always disabled in production", () => {
    expect(
      isSwaggerEnabled({
        NODE_ENV: "development",
        SWAGGER_ENABLED: "true",
      })
    ).toBe(true);
    expect(
      isSwaggerEnabled({
        NODE_ENV: "development",
        SWAGGER_ENABLED: "false",
      })
    ).toBe(false);
    expect(
      isSwaggerEnabled({
        NODE_ENV: "production",
        SWAGGER_ENABLED: "true",
      })
    ).toBe(false);
  });
});
