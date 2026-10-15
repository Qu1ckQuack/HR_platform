import express, { Router } from "express";
import { completeReset, requestOtp, verifyOtp } from "../controllers/password-recovery.controller";
import { passwordRecoveryErrorHandler } from "../middleware/password-recovery-error-handler";
import { assignRecoveryRequestId } from "../middleware/password-recovery-request-id";

export const passwordRecoveryRouter = Router();
passwordRecoveryRouter.use(assignRecoveryRequestId);
passwordRecoveryRouter.use(express.json({ limit: "10kb" }));
passwordRecoveryRouter.post("/request-otp", requestOtp);
passwordRecoveryRouter.post("/verify-otp", verifyOtp);
passwordRecoveryRouter.post("/complete", completeReset);
passwordRecoveryRouter.use(passwordRecoveryErrorHandler);
