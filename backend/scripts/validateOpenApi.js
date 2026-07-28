const path = require("path");
const SwaggerParser = require("@apidevtools/swagger-parser");

const documentPath = path.resolve(
  __dirname,
  "../docs/openapi.yaml"
);

SwaggerParser.validate(documentPath)
  .then((api) => {
    const methods = new Set([
      "get",
      "post",
      "put",
      "patch",
      "delete",
      "options",
      "head",
      "trace",
    ]);
    const operationKeys = new Set();

    for (const [routePath, pathItem] of Object.entries(
      api.paths || {}
    )) {
      for (const method of Object.keys(pathItem || {})) {
        if (!methods.has(method.toLowerCase())) {
          continue;
        }

        const key = `${method.toUpperCase()} ${routePath}`;
        if (operationKeys.has(key)) {
          throw new Error(
            `Duplicate OpenAPI operation: ${key}`
          );
        }
        operationKeys.add(key);
      }
    }

    if (!api.components?.securitySchemes?.bearerAuth) {
      throw new Error(
        "components.securitySchemes.bearerAuth is required."
      );
    }

    console.log(
      `OpenAPI validation passed: ${operationKeys.size} operations.`
    );
  })
  .catch((error) => {
    console.error(
      "OpenAPI validation failed:",
      error instanceof Error
        ? error.message
        : String(error)
    );
    process.exitCode = 1;
  });
