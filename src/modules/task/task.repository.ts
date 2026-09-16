import { prisma } from "../../lib/prisma";
import { buildQueryFilter } from "../../lib/query-filter";
import { extractQueryFromParams } from "@nodewave/prisma-ezfilter";

// =====================================================
// GET TASK BY ID
// =====================================================

export async function findTaskById(
  id: string,
  clientId?: string,
) {
  const isClient = Boolean(clientId);

  return prisma.task.findFirst({
    where: {
      id,
      deletedAt: null,

      ...(clientId
        ? {
            clientVisible: true,
            project: {
              clientId,
            },
          }
        : {}),
    },

    select: {
      id: true,
      projectId: true,

      // CLIENT tidak boleh mendapatkan assigneeId
      ...(isClient
        ? {}
        : {
            assigneeId: true,
          }),

      title: true,
      description: true,
      status: true,
      clientVisible: true,
      version: true,
      createdAt: true,
      updatedAt: true,
      deletedAt: true,

      // CLIENT tidak boleh mendapatkan clientId
      project: isClient
        ? {
            select: {
              id: true,
              name: true,
              description: true,
              createdAt: true,
              updatedAt: true,
            },
          }
        : true,

      // CLIENT tidak boleh mendapatkan identitas engineer
      ...(isClient
        ? {}
        : {
            assignee: {
              select: {
                id: true,
                name: true,
                email: true,
                role: true,
                department: true,
              },
            },
          }),

      // =================================================
      // DEPENDENCIES
      // =================================================

      dependencies: {
        select: {
          id: true,
          taskId: true,
          dependsOnTaskId: true,
          createdAt: true,

          dependsOnTask: isClient
            ? {
                select: {
                  id: true,
                  title: true,
                  status: true,
                },
              }
            : true,
        },
      },
    },
  });
}

// =====================================================
// GET TASKS BY PROJECT
// =====================================================

export async function findTasksByProjectId(
  projectId: string,
  params: Record<string, string | string[] | undefined> = {},
  clientId?: string,
  assigneeId?: string,
) {
  const result = buildQueryFilter(params);

  if (!result.validation.isValid) {
    throw new Error(
      `Invalid query parameters: ${result.validation.errors.join(", ")}`,
    );
  }

  const securityWhere = {
    projectId,
    deletedAt: null,
    ...(clientId
      ? {
          clientVisible: true,
          project: {
            clientId,
          },
        }
      : {}),
    ...(assigneeId
      ? {
          assigneeId,
        }
      : {}),
  };

  const where = result.query.where
    ? {
        AND: [
          securityWhere,
          result.query.where,
        ],
      }
    : securityWhere;

  const page = result.query.skip !== undefined
    ? Math.floor(result.query.skip / (result.query.take ?? 10)) + 1
    : 1;

  const rows = result.query.take ?? 10;

  const orderBy = result.query.orderBy ?? {
    createdAt: "asc" as const,
  };

  const [items, total] = await prisma.$transaction([
    prisma.task.findMany({
      where,
      orderBy,
      skip: result.query.skip ?? 0,
      take: rows,
      include: {
        assignee: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            department: true,
          },
        },

        project: {
          select: {
            id: true,
            name: true,
            clientId: true,
          },
        },

        dependencies: {
          select: {
            id: true,
            dependsOnTaskId: true,

            dependsOnTask: {
              select: {
                id: true,
                title: true,
                status: true,
              },
            },
          },
        },
      },
    }),

    prisma.task.count({
      where,
    }),
  ]);

  return {
    items,
    pagination: {
      page,
      rows,
      total,
      totalPages: Math.ceil(total / rows),
    },
  };
}

// =====================================================
// CREATE TASK
// =====================================================

export async function createTask(data: {
  projectId: string;
  assigneeId?: string;
  title: string;
  description: string;
  clientVisible?: boolean;
}) {
  return prisma.task.create({
    data: {
      projectId: data.projectId,
      assigneeId:
        data.assigneeId ?? null,
      title: data.title,
      description: data.description,
      clientVisible:
        data.clientVisible ?? false,
    },

    select: {
      id: true,
      projectId: true,
      assigneeId: true,
      title: true,
      description: true,
      status: true,
      clientVisible: true,
      version: true,
      createdAt: true,
      updatedAt: true,
      deletedAt: true,
    },
  });
}

// =====================================================
// UPDATE STATUS WITH OPTIMISTIC LOCK
// =====================================================

export async function updateTaskStatusWithLock(
  taskId: string,
  status:
    | "TODO"
    | "IN_PROGRESS"
    | "DONE"
    | "BLOCKED",
  version: number,
  userId: string,
) {
  return prisma.$transaction(
    async (tx) => {
      const task =
        await tx.task.findFirst({
          where: {
            id: taskId,
            deletedAt: null,
            version,
          },
        });

      if (!task) {
        return {
          conflict: true,
          task: null,
        };
      }

      const updated =
        await tx.task.updateMany({
          where: {
            id: taskId,
            deletedAt: null,
            version,
          },

          data: {
            status,
            version: {
              increment: 1,
            },
          },
        });

      if (updated.count !== 1) {
        return {
          conflict: true,
          task: null,
        };
      }

      await tx.auditLog.create({
        data: {
          taskId,
          userId,
          changedColumn: "status",
          oldValue: task.status,
          newValue: status,
        },
      });

      const updatedTask =
        await tx.task.findUnique({
          where: {
            id: taskId,
          },

          select: {
            id: true,
            projectId: true,
            assigneeId: true,
            title: true,
            description: true,
            status: true,
            clientVisible: true,
            version: true,
            createdAt: true,
            updatedAt: true,
            deletedAt: true,
          },
        });

      return {
        conflict: false,
        task: updatedTask,
      };
    },
  );
}

// =====================================================
// UPDATE DESCRIPTION WITH OPTIMISTIC LOCK
// =====================================================

export async function updateTaskDescriptionWithLock(
  taskId: string,
  description: string,
  version: number,
  userId: string,
) {
  return prisma.$transaction(
    async (tx) => {
      const task =
        await tx.task.findFirst({
          where: {
            id: taskId,
            deletedAt: null,
            version,
          },
        });

      if (!task) {
        return {
          conflict: true,
          task: null,
        };
      }

      const updated =
        await tx.task.updateMany({
          where: {
            id: taskId,
            deletedAt: null,
            version,
          },

          data: {
            description,
            version: {
              increment: 1,
            },
          },
        });

      if (updated.count !== 1) {
        return {
          conflict: true,
          task: null,
        };
      }

      await tx.auditLog.create({
        data: {
          taskId,
          userId,
          changedColumn: "description",
          oldValue: task.description,
          newValue: description,
        },
      });

      const updatedTask =
        await tx.task.findUnique({
          where: {
            id: taskId,
          },

          select: {
            id: true,
            projectId: true,
            assigneeId: true,
            title: true,
            description: true,
            status: true,
            clientVisible: true,
            version: true,
            createdAt: true,
            updatedAt: true,
            deletedAt: true,
          },
        });

      return {
        conflict: false,
        task: updatedTask,
      };
    },
  );
}

// =====================================================
// UPDATE ASSIGNEE WITH OPTIMISTIC LOCK
// =====================================================

export async function updateTaskAssigneeWithLock(
  taskId: string,
  assigneeId: string | null,
  version: number,
  userId: string,
) {
  return prisma.$transaction(
    async (tx) => {
      const task =
        await tx.task.findFirst({
          where: {
            id: taskId,
            deletedAt: null,
            version,
          },
        });

      if (!task) {
        return {
          conflict: true,
          task: null,
        };
      }

      const updated =
        await tx.task.updateMany({
          where: {
            id: taskId,
            deletedAt: null,
            version,
          },

          data: {
            assigneeId,
            version: {
              increment: 1,
            },
          },
        });

      if (updated.count !== 1) {
        return {
          conflict: true,
          task: null,
        };
      }

      await tx.auditLog.create({
        data: {
          taskId,
          userId,
          changedColumn: "assigneeId",
          oldValue: task.assigneeId,
          newValue: assigneeId,
        },
      });

      const updatedTask =
        await tx.task.findUnique({
          where: {
            id: taskId,
          },

          select: {
            id: true,
            projectId: true,
            assigneeId: true,
            title: true,
            description: true,
            status: true,
            clientVisible: true,
            version: true,
            createdAt: true,
            updatedAt: true,
            deletedAt: true,
          },
        });

      return {
        conflict: false,
        task: updatedTask,
      };
    },
  );
}

// =====================================================
// CREATE TASK DEPENDENCY
// =====================================================

export async function createTaskDependency(
  taskId: string,
  dependsOnTaskId: string,
) {
  return prisma.taskDependency.create({
    data: {
      taskId,
      dependsOnTaskId,
    },

    select: {
      id: true,
      taskId: true,
      dependsOnTaskId: true,
      createdAt: true,
    },
  });
}

// =====================================================
// CHECK DEPENDENCY PATH
// =====================================================

export async function hasDependencyPath(
  startTaskId: string,
  targetTaskId: string,
): Promise<boolean> {
  if (
    startTaskId === targetTaskId
  ) {
    return true;
  }

  const visited = new Set<string>();

  const queue: string[] = [
    startTaskId,
  ];

  while (queue.length > 0) {
    const currentTaskId =
      queue.shift();

    if (!currentTaskId) {
      continue;
    }

    if (
      visited.has(currentTaskId)
    ) {
      continue;
    }

    visited.add(currentTaskId);

    const dependencies =
      await prisma.taskDependency.findMany(
        {
          where: {
            taskId: currentTaskId,
          },

          select: {
            dependsOnTaskId: true,
          },
        },
      );

    for (const dependency of dependencies) {
      if (
        dependency.dependsOnTaskId ===
        targetTaskId
      ) {
        return true;
      }

      if (
        !visited.has(
          dependency.dependsOnTaskId,
        )
      ) {
        queue.push(
          dependency.dependsOnTaskId,
        );
      }
    }
  }

  return false;
}
// =====================================================
// SOFT DELETE TASK
// =====================================================

export async function softDeleteTask(
  taskId: string,
  userId: string,
) {
  return prisma.$transaction(async (tx) => {
    const task = await tx.task.findFirst({
      where: {
        id: taskId,
        deletedAt: null,
      },
    });

    if (!task) {
      return null;
    }

    const deletedTask = await tx.task.update({
      where: {
        id: taskId,
      },
      data: {
        deletedAt: new Date(),
      },
    });

    await tx.auditLog.create({
      data: {
        taskId,
        userId,
        changedColumn: "deletedAt",
        oldValue: null,
        newValue: deletedTask.deletedAt?.toISOString(),
      },
    });

    return deletedTask;
  });
}