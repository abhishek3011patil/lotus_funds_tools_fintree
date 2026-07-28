import fs from "fs";
import path from "path";
import type { Express, RequestHandler } from "express";
import swaggerUi from "swagger-ui-express";
import { parse } from "yaml";

const swaggerDocumentPath = path.resolve(
  __dirname,
  "../../docs/openapi.yaml"
);

export const isSwaggerEnabled = (
  environment: NodeJS.ProcessEnv = process.env
): boolean =>
  environment.NODE_ENV !== "production" &&
  environment.SWAGGER_ENABLED?.trim().toLowerCase() ===
    "true";

export const loadSwaggerDocument = (): object => {
  const source = fs.readFileSync(
    swaggerDocumentPath,
    "utf8"
  );
  const parsed: unknown = parse(source);

  if (
    typeof parsed !== "object" ||
    parsed === null ||
    Array.isArray(parsed)
  ) {
    throw new Error(
      "The OpenAPI document must contain a YAML object."
    );
  }

  return parsed;
};

export const mountSwaggerDocs = (
  app: Express
): boolean => {
  if (!isSwaggerEnabled()) {
    return false;
  }

  const document = loadSwaggerDocument();
  const allowSwaggerAssets: RequestHandler = (
    _req,
    res,
    next
  ) => {
    res.setHeader(
      "Content-Security-Policy",
      "default-src 'self'; img-src 'self' data:; style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-inline'"
    );
    next();
  };

  app.use(
    "/api-docs",
    allowSwaggerAssets,
    swaggerUi.serve,
    swaggerUi.setup(document, {
      customSiteTitle: "Lotus Funds API",
    })
  );

  return true;
};
