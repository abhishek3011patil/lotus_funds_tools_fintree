"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = __importDefault(require("path"));
const swagger_parser_1 = __importDefault(require("@apidevtools/swagger-parser"));
const vitest_1 = require("vitest");
const swagger_1 = require("../../src/config/swagger");
const documentPath = path_1.default.resolve(__dirname, "../../docs/openapi.yaml");
(0, vitest_1.describe)("OpenAPI documentation", () => {
    (0, vitest_1.it)("validates and resolves the bearer security scheme", async () => {
        const api = await swagger_parser_1.default.validate(documentPath);
        (0, vitest_1.expect)("openapi" in api ? api.openapi : api.swagger).toMatch(/^3\./);
        const securitySchemes = "components" in api
            ? api.components?.securitySchemes
            : undefined;
        (0, vitest_1.expect)(securitySchemes?.bearerAuth).toMatchObject({
            type: "http",
            scheme: "bearer",
            bearerFormat: "JWT",
        });
    });
    (0, vitest_1.it)("contains unique operations for the main Express routes", () => {
        const document = (0, swagger_1.loadSwaggerDocument)();
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
        ];
        for (const [method, routePath] of expectedOperations) {
            (0, vitest_1.expect)(document.paths?.[routePath]?.[method]).toBeDefined();
        }
        const operationKeys = Object.entries(document.paths || {}).flatMap(([routePath, pathItem]) => Object.keys(pathItem)
            .filter((method) => [
            "get",
            "post",
            "put",
            "patch",
            "delete",
        ].includes(method))
            .map((method) => `${method.toUpperCase()} ${routePath}`));
        (0, vitest_1.expect)(new Set(operationKeys).size).toBe(operationKeys.length);
    });
    (0, vitest_1.it)("is opt-in in development and always disabled in production", () => {
        (0, vitest_1.expect)((0, swagger_1.isSwaggerEnabled)({
            NODE_ENV: "development",
            SWAGGER_ENABLED: "true",
        })).toBe(true);
        (0, vitest_1.expect)((0, swagger_1.isSwaggerEnabled)({
            NODE_ENV: "development",
            SWAGGER_ENABLED: "false",
        })).toBe(false);
        (0, vitest_1.expect)((0, swagger_1.isSwaggerEnabled)({
            NODE_ENV: "production",
            SWAGGER_ENABLED: "true",
        })).toBe(false);
    });
});
