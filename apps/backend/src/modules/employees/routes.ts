import express from "express";
import { createOption, createEmployee, deleteEmployee, restoreEmployee, updateEmployee } from "./controllers/employee-write.controller";
import { updateContract } from "./controllers/contract.controller";
import { importEmployees } from "./controllers/employee-import.controller";
import { getHistory, getNotifications, getOptions, getSensitiveData, getTrash, listEmployees } from "./controllers/employee-read.controller";
import { requireHrUser } from "./middleware/require-hr-session";

const router = express.Router();
router.use(requireHrUser);
router.get("/", listEmployees);
router.get("/options", getOptions);
router.post("/options", createOption);
router.get("/notifications", getNotifications);
router.get("/trash", getTrash);
router.get("/:id/history", getHistory);
router.get("/:id/sensitive", getSensitiveData);
router.patch("/:id", updateEmployee);
router.delete("/:id", deleteEmployee);
router.post("/:id/restore", restoreEmployee);
router.all("/contracts/:contractId/:action", updateContract);
router.post("/", createEmployee);
router.post("/import", express.raw({
  type: ["text/csv", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"],
  limit: "100mb",
}), importEmployees);

export { router as employeeRouter };
