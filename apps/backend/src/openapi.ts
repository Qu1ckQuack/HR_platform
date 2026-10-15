export const openApiDocument = {
  openapi: "3.1.0",
  info: { title: "HR Platform API", version: "1.0.0", description: "Employee management API. Authenticated operations require an HR session cookie." },
  servers: [{ url: "/" }],
  tags: [{ name: "Employees" }],
  paths: {
    "/api/employees": {
      get: { tags: ["Employees"], summary: "List and filter employees", parameters: [
        { name: "page", in: "query", schema: { type: "integer", minimum: 1 } },
        { name: "search", in: "query", schema: { type: "string" } },
        { name: "status", in: "query", schema: { type: "string" } },
        { name: "department", in: "query", schema: { type: "string" } },
        { name: "employmentType", in: "query", schema: { type: "string" } },
        { name: "all", in: "query", schema: { type: "boolean" } },
      ], responses: { "200": { description: "Employee results and pagination" }, "401": { description: "Authentication required" } } },
      post: { tags: ["Employees"], summary: "Create employee", requestBody: { required: true, content: { "application/json": { schema: { type: "object" } } } }, responses: { "201": { description: "Employee created" }, "400": { description: "Invalid input" } } },
    },
    "/api/employees/{id}": { delete: { tags: ["Employees"], summary: "Soft-delete an employee when employment requirements are met", parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }], responses: { "200": { description: "Employee deleted" }, "409": { description: "Employment must be terminated and a fixed-term contract must have expired" } } } },
    "/api/employees/contracts/{contractId}/{action}": {
      post: { tags: ["Employees"], summary: "Perform a contract action", parameters: [{ name: "contractId", in: "path", required: true, schema: { type: "string" } }, { name: "action", in: "path", required: true, schema: { type: "string", enum: ["approve-probation", "reject-probation", "renew"] } }], responses: { "200": { description: "Contract action completed" }, "409": { description: "Contract state or dates do not meet action requirements" } } },
      delete: { tags: ["Employees"], summary: "Cancel a terminated contract", parameters: [{ name: "contractId", in: "path", required: true, schema: { type: "string" } }, { name: "action", in: "path", required: true, schema: { type: "string", enum: ["cancel"] } }], responses: { "200": { description: "Contract cancelled" }, "409": { description: "Only terminated contracts may be cancelled" } } },
    },
    "/api/employees/trash": { get: { tags: ["Employees"], summary: "List employees deleted within seven days", responses: { "200": { description: "Restorable employees" }, "401": { description: "Authentication required" } } } },
    "/api/employees/{id}/restore": { post: { tags: ["Employees"], summary: "Restore a deleted employee", parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }], responses: { "200": { description: "Employee restored" }, "409": { description: "Employee cannot be restored because the seven-day window expired" } } } },
    "/api/employees/{id}/sensitive": { get: { tags: ["Employees"], summary: "Reveal employee national ID, bank account, and phone", parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }], responses: { "200": { description: "Sensitive fields" }, "401": { description: "Authentication required" } } } },
  },
} as const;
