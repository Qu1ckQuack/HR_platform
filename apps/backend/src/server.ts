import cors from "cors";
import express from "express";
import swaggerUi from "swagger-ui-express";
import { config } from "dotenv";
import path from "node:path";
import { requireDatabaseUrl } from "./lib/database-connection-config";

config({ path: path.resolve(process.cwd(), "../../.env.local") });
config({ path: path.resolve(process.cwd(), "../../.env") });
requireDatabaseUrl();

const { assertAuthIpAddressOptionsConfigured } = await import("./lib/auth-ip-config");
assertAuthIpAddressOptionsConfigured();
const { getAuthRuntimeConfig } = await import("./lib/auth-runtime-config");
const { frontendUrl } = getAuthRuntimeConfig();

const [{ toNodeHandler }, { auth }, { passwordRecoveryRouter }, { employeeRouter }] = await Promise.all([
  import("better-auth/node"),
  import("./lib/auth"),
  import("./modules/auth/routes/password-recovery"),
  import("./modules/employees/routes"),
]);
const { assertAuthRateLimitStorageReady } = await import("./lib/auth-rate-limit-readiness");

await assertAuthRateLimitStorageReady();

const app = express();
const { openApiDocument } = await import("./openapi");
const port = Number(process.env.PORT ?? 4000);

app.use(cors({ origin: frontendUrl, credentials: true }));
app.get("/health", (_request, response) => response.json({ status: "ok" }));
app.get("/openapi.json", (_request, response) => response.json(openApiDocument));
app.get("/docs", (_request, response) => response.redirect(307, "/docs/index"));
app.get("/docs/index", swaggerUi.setup(openApiDocument));
app.use("/docs", swaggerUi.serve, swaggerUi.setup(openApiDocument));

app.use("/api/auth/password/reset", passwordRecoveryRouter);
app.all("/api/auth/*splat", toNodeHandler(auth));
app.use(express.json({ limit: "1mb" }));
app.use("/api/employees", employeeRouter);

app.listen(port, () => {
  console.info(`HR backend listening on port ${port}`);
});
