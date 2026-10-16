import type { RequestHandler } from "express";
import * as employeeService from "../services/employee.service";

export const importEmployees: RequestHandler = async (request, response) => {
  if (!Buffer.isBuffer(request.body)) {
    response.status(400).json({ error: "Upload a CSV or XLSX file" });
    return;
  }
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
    if (!sheet) {
      response.status(400).json({ error: "The uploaded file has no worksheet" });
      return;
    }
    const headers = sheet.getRow(1).values as Array<unknown>;
    const fields = headers.slice(1).map((header) => String(header ?? "").trim());
    const errors: Array<{ row: number; error: string; values: Record<string, string> }> = [];
    let imported = 0;
    for (let rowNumber = 2; rowNumber <= sheet.rowCount; rowNumber += 1) {
      const values = sheet.getRow(rowNumber).values as Array<unknown>;
      if (values.slice(1).every((value) => value === null || value === undefined || value === "")) continue;
      const rowData = Object.fromEntries(fields.map((field, index) => [field, String(values[index + 1] ?? "")]));
      try {
        await employeeService.createEmployee(request.hrUserId!, rowData);
        imported += 1;
      } catch (error) {
        errors.push({ row: rowNumber, error: error instanceof Error ? error.message : "Invalid row", values: rowData });
      }
    }
    response.json({ imported, rejected: errors.length, errors });
  } catch (error) {
    console.error("Unable to import employees", error);
    response.status(400).json({ error: "Unable to read the uploaded CSV or XLSX file" });
  }
};
