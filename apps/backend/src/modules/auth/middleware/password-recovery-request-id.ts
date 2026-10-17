import { randomUUID } from "node:crypto";
import type { RequestHandler } from "express";

declare module "express-serve-static-core" {
  interface Request {
    recoveryRequestId?: string;
  }
}

export const assignRecoveryRequestId: RequestHandler = (request, _response, next) => {
  request.recoveryRequestId = request.backendRequestId ?? randomUUID();
  next();
};
