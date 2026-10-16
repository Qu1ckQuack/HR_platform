import type { RequestHandler } from "express";
import { requireHrSession } from "../../../lib/role-guard";

declare module "express-serve-static-core" {
  interface Request {
    hrUserId?: string;
    hrEmployeeId?: string;
  }
}

export const requireHrUser: RequestHandler = async (request, response, next) => {
  try {
    const authorization = await requireHrSession(new Headers(request.headers as HeadersInit));
    if (!authorization.session) {
      const result = authorization.response;
      response.status(result?.status ?? 401).json(await result?.json());
      return;
    }
    request.hrUserId = authorization.session.user.id;
    request.hrEmployeeId = authorization.session.user.employeeId ?? undefined;
    next();
  } catch (error) {
    next(error);
  }
};
