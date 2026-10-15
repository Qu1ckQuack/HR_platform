import type { RequestHandler } from "express";
import * as employeeService from "../services/employee.service";

export const listEmployees: RequestHandler = async (request, response) => {
  try {
    await employeeService.expireDueContracts(request.hrUserId!);
    const result = await employeeService.listEmployees({
      requestedPage: Number.parseInt(String(request.query.page ?? "1"), 10),
      search: String(request.query.search ?? "").trim().toLocaleLowerCase(),
      statusFilter: String(request.query.status ?? "all"),
      departmentFilter: String(request.query.department ?? "all"),
      employmentTypeFilter: String(request.query.employmentType ?? "all"),
      includeAll: request.query.all === "true",
    });
    response.json(result);
  } catch (error) {
    console.error("Unable to load employees", error);
    response.status(500).json({ error: "Unable to load employees" });
  }
};

export const getOptions: RequestHandler = async (_request, response) => {
  response.json(await employeeService.getEmployeeFormOptions());
};

export const getNotifications: RequestHandler = async (request, response) => {
  const notifications = await employeeService.getEmployeeNotifications(request.hrUserId!);
  response.json({ notifications });
};

export const getTrash: RequestHandler = async (_request, response) => {
  try {
    response.json({ employees: await employeeService.listDeletedEmployees() });
  } catch {
    response.status(500).json({ error: "Unable to load deleted employees" });
  }
};

export const getHistory: RequestHandler = async (request, response) => {
  try {
    response.json(await employeeService.getEmployeePositionHistory(request.hrUserId!, String(request.params.id)));
  } catch (error) {
    if (error instanceof employeeService.EmployeeServiceError) {
      response.status(error.status).json({ error: error.message });
      return;
    }
    response.status(500).json({ error: "Unable to load position history" });
  }
};

export const getSensitiveData: RequestHandler = async (request, response) => {
  try {
    const data = await employeeService.getEmployeeSensitiveData(String(request.params.id));
    if (!data) {
      response.status(404).json({ error: "Employee not found" });
      return;
    }
    response.json(data);
  } catch (error) {
    if (error instanceof employeeService.EmployeeServiceError) {
      response.status(error.status).json({ error: error.message });
      return;
    }
    response.status(500).json({ error: "Unable to load personal data" });
  }
};
