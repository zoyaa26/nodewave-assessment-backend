import { Hono } from "hono";
import { authMiddleware } from "../../middleware/auth.middleware";
import { getTaskAuditLogsController } from "./audit.controller";

const auditRoutes = new Hono();

auditRoutes.use("*", authMiddleware);

auditRoutes.get("/:id/audit-logs", getTaskAuditLogsController);

export default auditRoutes;