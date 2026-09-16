import type { Context } from "hono";

import {
  getTaskById,
  getTasksByProject,
  createNewTask,
  updateTaskStatus,
  updateTaskDescription,
  updateTaskAssignee,
  addTaskDependency,
  deleteTask,
} from "./task.service";

type AuthUser = {
  userId: string;
  role: "PM" | "INTERNAL" | "CLIENT";
  department?:
    | "UI_UX"
    | "FRONTEND"
    | "BACKEND"
    | null;
};

/**
 * GET TASK BY ID
 */
export async function getTaskController(
  c: Context,
) {
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

    const user =
      c.get("user") as AuthUser;

    const task = await getTaskById(
      taskId,
      user,
    );

    return c.json({
      success: true,
      data: task,
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Failed to get task";

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

    console.error(error);

    return c.json(
      {
        success: false,
        message: "Internal server error",
      },
      500,
    );
  }
}

/**
 * GET PROJECT TASKS
 */
export async function getProjectTasksController(
  c: Context,
) {
  try {
    const projectId =
      c.req.param("projectId");

    if (!projectId) {
      return c.json(
        {
          success: false,
          message: "Project ID is required",
        },
        400,
      );
    }

    const user =
      c.get("user") as AuthUser;

    // Ambil SEMUA query parameter secara langsung
    const params: Record<
      string,
      string | string[] | undefined
    > = {};

    const url = new URL(
      c.req.url,
    );

    url.searchParams.forEach(
      (value, key) => {
        params[key] = value;
      },
    );

    const result =
      await getTasksByProject(
        projectId,
        user,
        params,
      );

    return c.json({
      success: true,
      data: result.items,
      pagination: result.pagination,
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Internal server error";

    if (message === "Forbidden") {
      return c.json(
        {
          success: false,
          message: "Forbidden",
        },
        403,
      );
    }

    if (
      message.startsWith(
        "Invalid query parameters",
      )
    ) {
      return c.json(
        {
          success: false,
          message,
        },
        400,
      );
    }

    console.error(
      "GET PROJECT TASKS ERROR:",
      error,
    );

    return c.json(
      {
        success: false,
        message:
          "Internal server error",
      },
      500,
    );
  }
}
/**
 * CREATE TASK
 */
export async function createTaskController(
  c: Context,
) {
  try {
    const body = await c.req.json();

    const user =
      c.get("user") as AuthUser;

    const task = await createNewTask(
      body,
      user,
    );

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
      error instanceof Error
        ? error.message
        : "Failed to create task";

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
        message,
      },
      400,
    );
  }
}

/**
 * UPDATE STATUS
 */
export async function updateTaskStatusController(
  c: Context,
) {
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

    const user =
      c.get("user") as AuthUser;

    const task =
      await updateTaskStatus(
        taskId,
        body.status,
        body.version,
        user,
      );

    return c.json({
      success: true,
      message:
        "Task status updated successfully",
      data: task,
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Failed to update task status";

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
      message ===
      "Task has been modified by another user"
    ) {
      return c.json(
        {
          success: false,
          message,
        },
        409,
      );
    }

    return c.json(
      {
        success: false,
        message,
      },
      400,
    );
  }
}

/**
 * UPDATE DESCRIPTION
 */
export async function updateTaskDescriptionController(
  c: Context,
) {
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

    const user =
      c.get("user") as AuthUser;

    const task =
      await updateTaskDescription(
        taskId,
        body.description,
        body.version,
        user,
      );

    return c.json({
      success: true,
      message:
        "Task description updated successfully",
      data: task,
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Failed to update task description";

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
      message ===
      "Task has been modified by another user"
    ) {
      return c.json(
        {
          success: false,
          message,
        },
        409,
      );
    }

    return c.json(
      {
        success: false,
        message,
      },
      400,
    );
  }
}

/**
 * UPDATE ASSIGNEE
 */
export async function updateTaskAssigneeController(
  c: Context,
) {
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

    const user =
      c.get("user") as AuthUser;

    const task =
      await updateTaskAssignee(
        taskId,
        body.assigneeId ?? null,
        body.version,
        user,
      );

    return c.json({
      success: true,
      message:
        "Task assignee updated successfully",
      data: task,
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Failed to update task assignee";

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
      message ===
      "Task has been modified by another user"
    ) {
      return c.json(
        {
          success: false,
          message,
        },
        409,
      );
    }

    return c.json(
      {
        success: false,
        message,
      },
      400,
    );
  }
}

/**
 * ADD DEPENDENCY
 */
export async function addTaskDependencyController(
  c: Context,
) {
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

    const user =
      c.get("user") as AuthUser;

    const dependency =
      await addTaskDependency(
        taskId,
        body.dependsOnTaskId,
        user,
      );

    return c.json(
      {
        success: true,
        message:
          "Task dependency created successfully",
        data: dependency,
      },
      201,
    );
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Internal server error";

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
      message ===
        "A task cannot depend on itself" ||
      message ===
        "Tasks must belong to the same project" ||
      message ===
        "Circular dependency is not allowed"
    ) {
      return c.json(
        {
          success: false,
          message,
        },
        400,
      );
    }

    console.error(error);

    return c.json(
      {
        success: false,
        message: "Internal server error",
      },
      500,
    );
  }
}
export async function deleteTaskController(c: Context) {
  const taskId = c.req.param("id");
  const user = c.get("user") as AuthUser;

  if (!taskId) {
    return c.json(
      {
        success: false,
        message: "Task ID is required",
      },
      400,
    );
  }

  try {
    const task = await deleteTask(taskId, {
      id: user.userId,
      role: user.role,
    });

    return c.json({
      success: true,
      data: task,
    });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "Forbidden") {
        return c.json(
          {
            success: false,
            message: "Forbidden",
          },
          403,
        );
      }

      if (error.message === "Task not found") {
        return c.json(
          {
            success: false,
            message: "Task not found",
          },
          404,
        );
      }
    }

    return c.json(
      {
        success: false,
        message: "Failed to delete task",
      },
      500,
    );
  }
}