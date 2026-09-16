import type { Context } from "hono";
import {
  getTaskById,
  getTasksByProject,
  createNewTask,
  updateTaskStatus,
  updateTaskDescription,
  updateTaskAssignee,
  addTaskDependency,
} from "./task.service";

export async function getTaskController(c: Context) {
  try {
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

    const user = c.get("user") as {
      userId: string;
      role: "PM" | "INTERNAL" | "CLIENT";
      department?: "UI_UX" | "FRONTEND" | "BACKEND" | null;
    };

    const task = await getTaskById(taskId, user);

    return c.json({
      success: true,
      data: task,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to get task";

    const status = message === "Forbidden" ? 403 : 404;

    return c.json(
      {
        success: false,
        message,
      },
      status,
    );
  }
}

export async function getProjectTasksController(c: Context) {
  try {
    const projectId = c.req.param("projectId");

    if (!projectId) {
      return c.json(
        {
          success: false,
          message: "Project ID is required",
        },
        400,
      );
    }

    const user = c.get("user") as {
      userId: string;
      role: "PM" | "INTERNAL" | "CLIENT";
      department?: "UI_UX" | "FRONTEND" | "BACKEND" | null;
    };

    const tasks = await getTasksByProject(projectId, user);

    return c.json({
      success: true,
      data: tasks,
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Failed to get project tasks";

    const status = message === "Forbidden" ? 403 : 500;

    return c.json(
      {
        success: false,
        message,
      },
      status,
    );
  }
}

export async function createTaskController(c: Context) {
  try {
    const body = await c.req.json();

    const user = c.get("user") as {
      userId: string;
      role: "PM" | "INTERNAL" | "CLIENT";
      department?: "UI_UX" | "FRONTEND" | "BACKEND" | null;
    };

    const task = await createNewTask(body, user);

    return c.json(
      {
        success: true,
        message: "Task created successfully",
        data: task,
      },
      201,
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to create task";

    const status = message === "Forbidden" ? 403 : 400;

    return c.json(
      {
        success: false,
        message,
      },
      status,
    );
  }
}
export async function updateTaskStatusController(c: Context) {
  try {
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

    const body = await c.req.json();

    const user = c.get("user") as {
      userId: string;
      role: "PM" | "INTERNAL" | "CLIENT";
      department?: "UI_UX" | "FRONTEND" | "BACKEND" | null;
    };

const task = await updateTaskStatus(
  taskId,
  body.status,
  body.version,
  user,
);

    return c.json({
      success: true,
      message: "Task status updated successfully",
      data: task,
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Failed to update task status";

    let status: 400 | 403 | 404 = 400;

    if (message === "Forbidden") {
      status = 403;
    }

    if (message === "Task not found") {
      status = 404;
    }

    return c.json(
      {
        success: false,
        message,
      },
      status,
    );
  }
}
export async function updateTaskDescriptionController(c: Context) {
  try {
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

    const body = await c.req.json();

    const user = c.get("user") as {
      userId: string;
      role: "PM" | "INTERNAL" | "CLIENT";
      department?: "UI_UX" | "FRONTEND" | "BACKEND" | null;
    };

    const task = await updateTaskDescription(
      taskId,
      body.description,
      body.version,
      user,
    );

    return c.json({
      success: true,
      message: "Task description updated successfully",
      data: task,
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Failed to update task description";

    let status: 400 | 403 | 404 | 409 = 400;

    if (message === "Forbidden") {
      status = 403;
    }

    if (message === "Task not found") {
      status = 404;
    }

    if (
      message ===
      "Task has been modified by another user"
    ) {
      status = 409;
    }

    return c.json(
      {
        success: false,
        message,
      },
      status,
    );
  }
}
export async function updateTaskAssigneeController(c: Context) {
  try {
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

    const body = await c.req.json();

    const user = c.get("user") as {
      userId: string;
      role: "PM" | "INTERNAL" | "CLIENT";
      department?: "UI_UX" | "FRONTEND" | "BACKEND" | null;
    };

    const task = await updateTaskAssignee(
      taskId,
      body.assigneeId ?? null,
      body.version,
      user,
    );

    return c.json({
      success: true,
      message: "Task assignee updated successfully",
      data: task,
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Failed to update task assignee";

    let status: 400 | 403 | 404 | 409 = 400;

    if (message === "Forbidden") {
      status = 403;
    }

    if (message === "Task not found") {
      status = 404;
    }

    if (
      message ===
      "Task has been modified by another user"
    ) {
      status = 409;
    }

    return c.json(
      {
        success: false,
        message,
      },
      status,
    );
  }
}
export async function addTaskDependencyController(c: Context) {
  try {
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

    const body = await c.req.json();

    const user = c.get("user") as {
      userId: string;
      role: "PM" | "INTERNAL" | "CLIENT";
      department?: "UI_UX" | "FRONTEND" | "BACKEND" | null;
    };

    const dependency = await addTaskDependency(
      taskId,
      body.dependsOnTaskId,
      user,
    );

    return c.json(
      {
        success: true,
        message: "Task dependency created successfully",
        data: dependency,
      },
      201,
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Internal server error";

    if (message === "Forbidden") {
      return c.json(
        {
          success: false,
          message,
        },
        403,
      );
    }

    if (message === "Task not found") {
      return c.json(
        {
          success: false,
          message,
        },
        404,
      );
    }

    if (
      message === "A task cannot depend on itself" ||
      message === "Tasks must belong to the same project"
    ) {
      return c.json(
        {
          success: false,
          message,
        },
        400,
      );
    }

    return c.json(
      {
        success: false,
        message,
      },
      500,
    );
  }
}