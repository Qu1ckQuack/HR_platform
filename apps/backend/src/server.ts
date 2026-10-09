import cors from "cors";
import express from "express";
import { config } from "dotenv";
import path from "node:path";

config({ path: path.resolve(process.cwd(), "../../.env.local") });
config({ path: path.resolve(process.cwd(), "../../.env") });

const [{ toNodeHandler }, { auth }, employeeService, { requireHrSession }] = await Promise.all([
  import("better-auth/node"),
  import("./lib/auth"),
  import("./services/employee.service"),
  import("./lib/role-guard"),
]);
const [{ db }, { user, account, session }, { symmetricDecrypt, symmetricEncrypt, hashPassword }, otp] = await Promise.all([
  import("./lib/db"),
  import("./db/auth-schema"),
  import("better-auth/crypto"),
  import("otplib"),
]);
const { and, eq, isNull, sql } = await import("drizzle-orm");

const app = express();
const port = Number(process.env.PORT ?? 4000);
const frontendUrl = process.env.FRONTEND_URL ?? "http://localhost:3000";

app.use(cors({ origin: frontendUrl, credentials: true }));
app.get("/health", (_request, response) => response.json({ status: "ok" }));

const resetAttempts = new Map<string, { count: number; resetAt: number }>();
function isResetRateLimited(key: string) {
  const now = Date.now();
  if (resetAttempts.size > 10_000) {
    for (const [attemptKey, attempt] of resetAttempts) if (attempt.resetAt <= now) resetAttempts.delete(attemptKey);
  }
  const attempt = resetAttempts.get(key);
  if (!attempt || attempt.resetAt <= now) {
    resetAttempts.set(key, { count: 1, resetAt: now + 15 * 60_000 });
    return false;
  }
  attempt.count += 1;
  return attempt.count > 5;
}

app.post("/api/auth/totp/setup", async (request, response) => {
  const authorization = await requireHrSession(new Headers(request.headers as HeadersInit));
  if (!authorization.session) return response.status(authorization.response?.status ?? 401).json(await authorization.response?.json());
  const secret = otp.generateSecret();
  const uri = otp.generateURI({ issuer: "HR Platform", label: authorization.session.user.email, secret });
  const encrypted = await symmetricEncrypt({ key: process.env.BETTER_AUTH_SECRET!, data: secret });
  await db.update(user).set({ totpSecret: encrypted, totpEnabledAt: null, totpLastStep: null }).where(eq(user.id, authorization.session.user.id));
  return response.json({ uri, secret });
});

app.post("/api/auth/totp/enable", express.json({ limit: "10kb" }), async (request, response) => {
  const authorization = await requireHrSession(new Headers(request.headers as HeadersInit));
  if (!authorization.session) return response.status(authorization.response?.status ?? 401).json(await authorization.response?.json());
  const token = String(request.body?.token ?? "");
  if (!/^\d{6}$/.test(token)) return response.status(400).json({ error: "Enter a six-digit authenticator code" });
  const [record] = await db.select({ secret: user.totpSecret }).from(user).where(eq(user.id, authorization.session.user.id)).limit(1);
  if (!record?.secret) return response.status(400).json({ error: "Start authenticator setup first" });
  const secret = await symmetricDecrypt({ key: process.env.BETTER_AUTH_SECRET!, data: record.secret });
  const result = await otp.verify({ secret, token, epochTolerance: 30 });
  if (!result.valid) return response.status(400).json({ error: "Authenticator code is invalid" });
  await db.update(user).set({ totpEnabledAt: new Date(), totpLastStep: (result as unknown as { timeStep: number }).timeStep }).where(eq(user.id, authorization.session.user.id));
  return response.json({ enabled: true });
});

app.post("/api/auth/password/reset", express.json({ limit: "10kb" }), async (request, response) => {
  const email = String(request.body?.email ?? "").trim().toLowerCase();
  const token = String(request.body?.token ?? "");
  const newPassword = String(request.body?.newPassword ?? "");
  const rateKey = `${request.ip ?? "unknown"}:${email}`;
  if (isResetRateLimited(rateKey)) return response.status(429).json({ error: "Too many attempts. Try again in 15 minutes." });
  if (!email || !/^\d{6}$/.test(token) || newPassword.length < 12 || newPassword.length > 200) {
    return response.status(400).json({ error: "Enter your HR email, authenticator code, and a password of at least 12 characters" });
  }
  const [record] = await db.select({ id: user.id, secret: user.totpSecret, enabledAt: user.totpEnabledAt, lastStep: user.totpLastStep })
    .from(user).where(and(eq(user.email, email), sql`${user.role} IN ('hr', 'super_admin')`)).limit(1);
  const genericFailure = () => response.status(400).json({ error: "Unable to reset password with those details" });
  if (!record?.secret || !record.enabledAt) return genericFailure();
  const secret = await symmetricDecrypt({ key: process.env.BETTER_AUTH_SECRET!, data: record.secret });
  const result = await otp.verify({ secret, token, epochTolerance: 30, afterTimeStep: record.lastStep ?? undefined });
  if (!result.valid) return genericFailure();
  const passwordHash = await hashPassword(newPassword);
  try {
    await db.transaction(async (tx) => {
    const updated = await tx.update(user).set({ totpLastStep: (result as unknown as { timeStep: number }).timeStep }).where(and(eq(user.id, record.id), record.lastStep === null ? isNull(user.totpLastStep) : eq(user.totpLastStep, record.lastStep))).returning({ id: user.id });
    if (updated.length === 0) throw new Error("Authenticator code already used");
    const credential = await tx.update(account).set({ password: passwordHash, updatedAt: new Date() }).where(and(eq(account.userId, record.id), eq(account.providerId, "credential"))).returning({ id: account.id });
    if (credential.length === 0) throw new Error("Credential account not found");
    await tx.delete(session).where(eq(session.userId, record.id));
    });
  } catch {
    return genericFailure();
  }
  return response.json({ message: "If the authenticator details are valid, the password has been reset." });
});

app.all("/api/auth/*splat", toNodeHandler(auth));
app.use(express.json({ limit: "1mb" }));

app.get("/api/employees", async (request, response) => {
  const authorization = await requireHrSession(new Headers(request.headers as HeadersInit));
  if (!authorization.session) return response.status(authorization.response?.status ?? 401).json(await authorization.response?.json());
  try {
    await employeeService.expireDueContracts(authorization.session.user.id);
    const result = await employeeService.listEmployees({
      requestedPage: Number.parseInt(String(request.query.page ?? "1"), 10),
      search: String(request.query.search ?? "").trim().toLocaleLowerCase(),
      statusFilter: String(request.query.status ?? "all"),
      departmentFilter: String(request.query.department ?? "all"),
      employmentTypeFilter: String(request.query.employmentType ?? "all"),
      includeAll: request.query.all === "true",
    });
    return response.json(result);
  } catch (error) {
    console.error("Unable to load employees", error);
    return response.status(500).json({ error: "Unable to load employees" });
  }
});

app.get("/api/employees/options", async (request, response) => {
  const authorization = await requireHrSession(new Headers(request.headers as HeadersInit));
  if (!authorization.session) return response.status(authorization.response?.status ?? 401).json(await authorization.response?.json());
  return response.json(await employeeService.getEmployeeFormOptions());
});

app.post("/api/employees/options", async (request, response) => {
  const authorization = await requireHrSession(new Headers(request.headers as HeadersInit));
  if (!authorization.session) return response.status(authorization.response?.status ?? 401).json(await authorization.response?.json());
  try {
    if (request.body?.type === "department") return response.status(201).json({ department: await employeeService.createDepartment(request.body.name) });
    if (request.body?.type === "position") return response.status(201).json({ position: await employeeService.createPosition(request.body.name, request.body.departmentId) });
    return response.status(400).json({ error: "Choose a department or position" });
  } catch (error) {
    if (error instanceof employeeService.EmployeeServiceError) return response.status(error.status).json({ error: error.message });
    return response.status(500).json({ error: "Unable to create form option" });
  }
});

app.get("/api/employees/notifications", async (request, response) => {
  const authorization = await requireHrSession(new Headers(request.headers as HeadersInit));
  if (!authorization.session) return response.status(authorization.response?.status ?? 401).json(await authorization.response?.json());
  const notifications = await employeeService.getEmployeeNotifications(authorization.session.user.id);
  return response.json({ notifications });
});

app.get("/api/employees/:id/history", async (request, response) => {
  const authorization = await requireHrSession(new Headers(request.headers as HeadersInit));
  if (!authorization.session) return response.status(authorization.response?.status ?? 401).json(await authorization.response?.json());
  try {
    return response.json(await employeeService.getEmployeePositionHistory(authorization.session.user.id, request.params.id));
  } catch (error) {
    if (error instanceof employeeService.EmployeeServiceError) return response.status(error.status).json({ error: error.message });
    return response.status(500).json({ error: "Unable to load employee history" });
  }
});

app.patch("/api/employees/:id", async (request, response) => {
  const authorization = await requireHrSession(new Headers(request.headers as HeadersInit));
  if (!authorization.session) return response.status(authorization.response?.status ?? 401).json(await authorization.response?.json());
  try {
    await employeeService.updateEmployee(authorization.session.user.id, request.params.id, request.body);
    return response.json({ id: request.params.id });
  } catch (error) {
    if (error instanceof employeeService.EmployeeServiceError) return response.status(error.status).json({ error: error.message });
    return response.status(500).json({ error: "Unable to update employee" });
  }
});

app.delete("/api/employees/:id", async (request, response) => {
  const authorization = await requireHrSession(new Headers(request.headers as HeadersInit));
  if (!authorization.session) return response.status(authorization.response?.status ?? 401).json(await authorization.response?.json());
  try {
    await employeeService.softDeleteEmployee(authorization.session.user.id, request.params.id);
    return response.json({ id: request.params.id });
  } catch (error) {
    if (error instanceof employeeService.EmployeeServiceError) return response.status(error.status).json({ error: error.message });
    return response.status(500).json({ error: "Unable to remove employee" });
  }
});

app.post("/api/employees/:id/restore", async (request, response) => {
  const authorization = await requireHrSession(new Headers(request.headers as HeadersInit));
  if (!authorization.session) return response.status(authorization.response?.status ?? 401).json(await authorization.response?.json());
  try {
    await employeeService.restoreEmployee(authorization.session.user.id, request.params.id);
    return response.json({ id: request.params.id });
  } catch (error) {
    if (error instanceof employeeService.EmployeeServiceError) return response.status(error.status).json({ error: error.message });
    return response.status(500).json({ error: "Unable to restore employee" });
  }
});

app.all("/api/employees/contracts/:contractId/:action", async (request, response) => {
  const authorization = await requireHrSession(new Headers(request.headers as HeadersInit));
  if (!authorization.session) return response.status(authorization.response?.status ?? 401).json(await authorization.response?.json());
  try {
    const { contractId, action } = request.params;
    if (action === "approve-probation") await employeeService.approveProbation(authorization.session.user.id, contractId);
    else if (action === "reject-probation") await employeeService.rejectProbation(authorization.session.user.id, contractId);
    else if (action === "cancel" && request.method === "DELETE") await employeeService.cancelTerminatedContract(authorization.session.user.id, contractId);
    else if (action === "renew") await employeeService.renewContract(authorization.session.user.id, contractId, request.body);
    else return response.status(404).json({ error: "Unknown contract action" });
    return response.json({ id: contractId });
  } catch (error) {
    if (error instanceof employeeService.EmployeeServiceError) return response.status(error.status).json({ error: error.message });
    return response.status(500).json({ error: "Unable to update contract" });
  }
});

app.post("/api/employees", async (request, response) => {
  const authorization = await requireHrSession(new Headers(request.headers as HeadersInit));
  if (!authorization.session) return response.status(authorization.response?.status ?? 401).json(await authorization.response?.json());
  try {
    return response.status(201).json(await employeeService.createEmployee(authorization.session.user.id, request.body));
  } catch (error) {
    if (error instanceof employeeService.EmployeeServiceError) return response.status(error.status).json({ error: error.message });
    console.error("Unable to create employee", error);
    return response.status(500).json({ error: "Unable to create employee" });
  }
});

app.post(
  "/api/employees/import",
  express.raw({
    type: ["text/csv", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"],
    limit: "5mb",
  }),
  async (request, response) => {
    const authorization = await requireHrSession(new Headers(request.headers as HeadersInit));
    if (!authorization.session) return response.status(authorization.response?.status ?? 401).json(await authorization.response?.json());
    if (!Buffer.isBuffer(request.body)) return response.status(400).json({ error: "Upload a CSV or XLSX file" });

    try {
      const ExcelJS = (await import("exceljs")).default;
      const workbook = new ExcelJS.Workbook();
      if (request.is("text/csv")) {
        const { Readable } = await import("node:stream");
        await workbook.csv.read(Readable.from(request.body));
      } else {
        await workbook.xlsx.load(request.body as never);
      }
      const sheet = workbook.worksheets[0];
      if (!sheet) return response.status(400).json({ error: "The uploaded file has no worksheet" });
      const headers = sheet.getRow(1).values as Array<unknown>;
      const fieldNames = headers.slice(1).map((header) => String(header ?? "").trim());
      const errors: Array<{ row: number; error: string }> = [];
      let imported = 0;
      for (let rowNumber = 2; rowNumber <= sheet.rowCount; rowNumber += 1) {
        const row = sheet.getRow(rowNumber);
        const values = row.values as Array<unknown>;
        if (values.slice(1).every((value) => value === null || value === undefined || value === "")) continue;
        const data = Object.fromEntries(fieldNames.map((field, index) => [field, values[index + 1]]));
        try {
          await employeeService.createEmployee(authorization.session.user.id, data);
          imported += 1;
        } catch (error) {
          errors.push({ row: rowNumber, error: error instanceof Error ? error.message : "Invalid row" });
        }
      }
      return response.json({ imported, rejected: errors.length, errors });
    } catch (error) {
      console.error("Unable to import employee file", error);
      return response.status(400).json({ error: "The file could not be read. Use CSV or XLSX with EmployeeEditForm field names as headers." });
    }
  },
);

app.get("/api/employees/:id/sensitive", async (request, response) => {
  const authorization = await requireHrSession(new Headers(request.headers as HeadersInit));
  if (!authorization.session) return response.status(authorization.response?.status ?? 401).json(await authorization.response?.json());
  try {
    const sensitive = await employeeService.getEmployeeSensitiveData(request.params.id);
    if (!sensitive) return response.status(404).json({ error: "Employee not found" });
    return response.json(sensitive);
  } catch (error) {
    if (error instanceof employeeService.EmployeeServiceError) return response.status(error.status).json({ error: error.message });
    return response.status(500).json({ error: "Unable to load sensitive employee data" });
  }
});

app.listen(port, () => {
  console.info(`HR backend listening on port ${port}`);
});
