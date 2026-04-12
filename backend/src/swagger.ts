import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import swaggerJsdoc from "swagger-jsdoc";

const __dirname = dirname(fileURLToPath(import.meta.url));

const options: swaggerJsdoc.Options = {
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
  apis: [join(__dirname, "routes", "*.js"), join(__dirname, "routes", "*.ts")],
};

export const swaggerSpec = swaggerJsdoc(options);
