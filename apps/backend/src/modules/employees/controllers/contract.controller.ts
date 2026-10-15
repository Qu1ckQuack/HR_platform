import type { RequestHandler } from "express";
import * as employeeService from "../services/employee.service";

export const updateContract: RequestHandler = async (request, response) => {
  try {
    const contractId = String(request.params.contractId);
    const action = String(request.params.action);
    let result: { ok: boolean; code?: string; message?: string; status?: number };
    if (action === "approve-probation") result = await employeeService.approveProbation(request.hrUserId!, contractId);
    else if (action === "reject-probation") result = await employeeService.rejectProbation(request.hrUserId!, contractId);
    else if (action === "cancel" && request.method === "DELETE") result = await employeeService.cancelTerminatedContract(request.hrUserId!, contractId);
    else if (action === "renew") result = await employeeService.renewContract(request.hrUserId!, contractId, request.body);
    else {
      response.status(404).json({ error: "Unknown contract action" });
      return;
    }
    if (!result.ok) {
      response.status(result.status ?? 409).json({ code: result.code, error: result.message });
      return;
    }
    response.json({ id: contractId });
  } catch (error) {
    if (error instanceof employeeService.EmployeeServiceError) {
      response.status(error.status).json({ error: error.message });
      return;
    }
    console.error("Unable to update employment contract", error);
    response.status(500).json({ error: "Unable to update employment contract" });
  }
};
