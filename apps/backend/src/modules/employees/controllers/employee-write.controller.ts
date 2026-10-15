import type { RequestHandler } from "express";
import * as employeeService from "../services/employee.service";

export const createEmployee: RequestHandler = async (request, response) => {
  try {
    response.status(201).json(await employeeService.createEmployee(request.hrUserId!, request.body));
  } catch (error) {
    if (error instanceof employeeService.EmployeeServiceError) {
      response.status(error.status).json({ error: error.message });
      return;
    }
    console.error("Unable to create employee", error);
    response.status(500).json({ error: "Unable to create employee" });
  }
};

export const updateEmployee: RequestHandler = async (request, response) => {
  try {
    const id = String(request.params.id);
    await employeeService.updateEmployee(request.hrUserId!, id, request.body);
    response.json({ id });
  } catch (error) {
    if (error instanceof employeeService.EmployeeServiceError) {
      response.status(error.status).json({ error: error.message });
      return;
    }
    response.status(500).json({ error: "Unable to update employee" });
  }
};

export const createOption: RequestHandler = async (request, response) => {
  try {
    const { type, name, departmentId } = request.body ?? {};
    if (type === "department") {
      response.status(201).json({ department: await employeeService.createDepartment(name) });
      return;
    }
    if (type === "position") {
      response.status(201).json({ position: await employeeService.createPosition(name, departmentId) });
      return;
    }
    response.status(400).json({ error: "Select a department or position" });
  } catch (error) {
    if (error instanceof employeeService.EmployeeServiceError) {
      response.status(error.status).json({ error: error.message });
      return;
    }
    response.status(500).json({ error: "Unable to create form option" });
  }
};

export const deleteEmployee: RequestHandler = async (request, response) => {
  try {
    const id = String(request.params.id);
    const result = await employeeService.softDeleteEmployee(request.hrUserId!, id);
    if (!result.ok) {
      response.status(result.status ?? 409).json({ code: result.code, error: result.message });
      return;
    }
    response.json({ id });
  } catch (error) {
    if (error instanceof employeeService.EmployeeServiceError) {
      response.status(error.status).json({ error: error.message });
      return;
    }
    response.status(500).json({ error: "Unable to delete employee" });
  }
};

export const restoreEmployee: RequestHandler = async (request, response) => {
  try {
    const id = String(request.params.id);
    const result = await employeeService.restoreEmployee(request.hrUserId!, id);
    if (!result.ok) {
      response.status(result.status ?? 409).json({ code: result.code, error: result.message });
      return;
    }
    response.json({ id });
  } catch (error) {
    if (error instanceof employeeService.EmployeeServiceError) {
      response.status(error.status).json({ error: error.message });
      return;
    }
    response.status(500).json({ error: "Unable to restore employee" });
  }
};
