import type { Context } from "hono";
import { getTaskAuditLogs } from "./audit.service";

export async function getTaskAuditLogsController(c: Context) {
  const taskId = c.req.param("id");

  if (!taskId) {
    return c.json(
      {
        success: false,
        message: "Task ID is required",
      },
      400,
    );
  }

  const user = c.get("user");

  try {
    const auditLogs = await getTaskAuditLogs(taskId, {
      userId: user.userId,
      role: user.role,
    });

    return c.json({
      success: true,
      data: auditLogs,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Internal server error";

    if (message === "Task not found") {
      return c.json(
        {
          success: false,
          message,
        },
        404,
      );
    }

    if (message === "Forbidden") {
      return c.json(
        {
          success: false,
          message,
        },
        403,
      );
    }

    return c.json(
      {
        success: false,
        message: "Internal server error",
      },
      500,
    );
  }
}