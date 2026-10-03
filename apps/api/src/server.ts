import Fastify from "fastify";
import cors from "@fastify/cors";
import dotenv from "dotenv";
import { companyRoutes } from "./routes/company.routes.js";

dotenv.config();

const app = Fastify({
  logger: true,
});

await app.register(cors, {
  origin: true,
});

await app.register(companyRoutes);

app.get("/health", async () => {
  return {
    success: true,
    service: "signaldesk-api",
    status: "healthy",
  };
});

const port = Number(process.env.PORT) || 4000;

try {
  await app.listen({
    port,
    host: "0.0.0.0",
  });

  console.log(`API running on http://localhost:${port}`);
} catch (error) {
  app.log.error(error);
  process.exit(1);
}