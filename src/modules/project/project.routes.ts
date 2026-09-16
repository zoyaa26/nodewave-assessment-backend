import { Hono } from "hono";
import { authMiddleware } from "../../middleware/auth.middleware";
import {
  createProjectController,
  getClientMetricsController,
  getClientProjectsController,
  getProjectController,
} from "./project.controller";

const projectRoutes = new Hono();

projectRoutes.use("*", authMiddleware);

projectRoutes.get("/client", getClientProjectsController);

projectRoutes.get("/client/metrics",getClientMetricsController,);

projectRoutes.get("/:id", getProjectController);

projectRoutes.post("/", createProjectController);

export default projectRoutes;