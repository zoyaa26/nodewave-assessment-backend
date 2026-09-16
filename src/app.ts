import { Hono } from "hono";

import authRoutes from "./modules/auth/auth.routes";
import { authMiddleware } from "./middleware/auth.middleware";
import { roleMiddleware } from "./middleware/role.middleware";

import taskRoutes from "./modules/task/task.routes";
import projectRoutes from "./modules/project/project.routes";
import auditRoutes from "./modules/audit/audit.routes";
import attachmentRoutes from "./modules/attachment/attachment.routes";

const app = new Hono();

app.get("/", (c) => {
  return c.json({
    success: true,
    message: "NodeWave Assessment Backend API is running",
  });
});


app.route("/api/auth", authRoutes);
app.route("/api/tasks", taskRoutes);
app.route("/api/projects", projectRoutes);
app.route("/api/audit", auditRoutes);
app.route("/api/attachments", attachmentRoutes);
app.get("/api/auth/me", authMiddleware, (c) => {
  return c.json({
    success: true,
    message: "Authenticated successfully",
  });
});

app.get(
  "/api/pm-only",
  authMiddleware,
  roleMiddleware("PM"),
  (c) => {
    return c.json({
      success: true,
      message: "PM access granted",
    });
  },
);

export default app;