import { Hono } from "hono";
import { authMiddleware } from "../../middleware/auth.middleware";
import {
  getTaskController,
  getProjectTasksController,
  createTaskController,
  updateTaskStatusController,
  updateTaskDescriptionController,
  updateTaskAssigneeController,
  addTaskDependencyController,
  deleteTaskController
} from "./task.controller";

const taskRoutes = new Hono();

taskRoutes.use("*", authMiddleware);

taskRoutes.get("/:id", getTaskController);
taskRoutes.patch("/:id/status",updateTaskStatusController,);
taskRoutes.patch("/:id/description",updateTaskDescriptionController,);
taskRoutes.patch("/:id/assignee",updateTaskAssigneeController,);
taskRoutes.get("/project/:projectId",getProjectTasksController,);
taskRoutes.post("/:id/dependencies", addTaskDependencyController);
taskRoutes.post("/", createTaskController);
taskRoutes.delete("/:id", deleteTaskController);

export default taskRoutes;
