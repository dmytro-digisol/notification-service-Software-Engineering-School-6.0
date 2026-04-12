#!/usr/bin/env node
/**
 * pnpm swag — generate swagger.json from OpenAPI JSDoc annotations.
 * Output: ./swagger.json (OpenAPI 3.0 schema)
 */
import swaggerJsdoc from "swagger-jsdoc";
import { writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Notification Service API",
      version: "1.0.0",
      description:
        "REST API for subscribing to GitHub repository release notifications via email.",
      contact: {
        name: "Notification Service",
      },
    },
    servers: [
      {
        url: "http://localhost:3535",
        description: "Local development server",
      },
    ],
    tags: [
      {
        name: "Subscriptions",
        description: "Manage GitHub release notification subscriptions",
      },
    ],
  },
  apis: [resolve(root, "src", "routes", "*.ts")],
};

const spec = swaggerJsdoc(options);
const outPath = resolve(root, "swagger.json");

writeFileSync(outPath, JSON.stringify(spec, null, 2));
console.log(`✓ OpenAPI schema written to ${outPath}`);
