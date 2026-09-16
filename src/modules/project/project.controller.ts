import type { Context } from "hono";
import {
  getProjectById,
  getClientProjects,
  createNewProject,
  getClientMetrics,
} from "./project.service";

export async function getProjectController(c: Context) {
  try {
    const projectId = c.req.param("id");

    if (!projectId) {
      throw new Error("Project ID is required");
    }

    const user = c.get("user") as {
      userId: string;
      role: "PM" | "INTERNAL" | "CLIENT";
    };

    const project = await getProjectById(projectId, user);

    return c.json({
      success: true,
      data: project,
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Failed to get project";

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

export async function getClientProjectsController(c: Context) {
  try {
    const user = c.get("user") as {
      userId: string;
      role: "PM" | "INTERNAL" | "CLIENT";
    };

    const projects = await getClientProjects(user);

    return c.json({
      success: true,
      data: projects,
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Failed to get client projects";

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

export async function createProjectController(c: Context) {
  try {
    const body = await c.req.json();

    const user = c.get("user") as {
      userId: string;
      role: "PM" | "INTERNAL" | "CLIENT";
    };

    const project = await createNewProject(body, user);

    return c.json(
      {
        success: true,
        message: "Project created successfully",
        data: project,
      },
      201,
    );
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Failed to create project";

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
export async function getClientMetricsController(c: Context) {
  try {
    const user = c.get("user") as {
      userId: string;
      role: "PM" | "INTERNAL" | "CLIENT";
    };

    const metrics = await getClientMetrics(user);

    return c.json({
      success: true,
      data: metrics,
    });
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

    return c.json(
      {
        success: false,
        message,
      },
      500,
    );
  }
}