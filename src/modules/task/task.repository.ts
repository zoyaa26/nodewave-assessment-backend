import { prisma } from "../../lib/prisma";

// =====================================================
// FIND TASK BY ID
// =====================================================

export async function findTaskById(id: string) {
  return prisma.task.findFirst({
    where: {
      id,
      deletedAt: null,
    },
    include: {
      project: true,

      assignee: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          department: true,
        },
      },

      dependencies: {
        include: {
          dependsOnTask: true,
        },
      },
    },
  });
}

// =====================================================
// FIND TASKS BY PROJECT
// =====================================================

export async function findTasksByProjectId(
  projectId: string,
  clientId?: string,
) {
  return prisma.task.findMany({
    where: {
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
    },

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

      dependencies: {
        include: {
          dependsOnTask: true,
        },
      },
    },

    orderBy: {
      createdAt: "asc",
    },
  });
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
    data,
  });
}

// =====================================================
// UPDATE TASK STATUS WITH OPTIMISTIC LOCK
// =====================================================

export async function updateTaskStatusWithLock(
  taskId: string,
  newStatus:
    | "TODO"
    | "IN_PROGRESS"
    | "DONE"
    | "BLOCKED",
  currentVersion: number,
  userId: string,
) {
  return prisma.$transaction(async (tx) => {
    const task = await tx.task.findFirst({
      where: {
        id: taskId,
        version: currentVersion,
        deletedAt: null,
      },
    });

    if (!task) {
      return {
        success: false,
        conflict: true,
      };
    }

    const updatedTask = await tx.task.update({
      where: {
        id: taskId,
      },

      data: {
        status: newStatus,

        version: {
          increment: 1,
        },
      },
    });

    await tx.auditLog.create({
      data: {
        taskId: task.id,
        userId,
        changedColumn: "status",
        oldValue: task.status,
        newValue: newStatus,
      },
    });

    return {
      success: true,
      conflict: false,
      task: updatedTask,
    };
  });
}

// =====================================================
// UPDATE TASK DESCRIPTION WITH OPTIMISTIC LOCK
// =====================================================

export async function updateTaskDescriptionWithLock(
  taskId: string,
  newDescription: string,
  currentVersion: number,
  userId: string,
) {
  return prisma.$transaction(async (tx) => {
    const task = await tx.task.findFirst({
      where: {
        id: taskId,
        version: currentVersion,
        deletedAt: null,
      },
    });

    if (!task) {
      return {
        success: false,
        conflict: true,
      };
    }

    const updatedTask = await tx.task.update({
      where: {
        id: taskId,
      },

      data: {
        description: newDescription,

        version: {
          increment: 1,
        },
      },
    });

    await tx.auditLog.create({
      data: {
        taskId: task.id,
        userId,
        changedColumn: "description",
        oldValue: task.description,
        newValue: newDescription,
      },
    });

    return {
      success: true,
      conflict: false,
      task: updatedTask,
    };
  });
}

// =====================================================
// UPDATE TASK ASSIGNEE WITH OPTIMISTIC LOCK
// =====================================================

export async function updateTaskAssigneeWithLock(
  taskId: string,
  newAssigneeId: string | null,
  currentVersion: number,
  userId: string,
) {
  return prisma.$transaction(async (tx) => {
    const task = await tx.task.findFirst({
      where: {
        id: taskId,
        version: currentVersion,
        deletedAt: null,
      },
    });

    if (!task) {
      return {
        success: false,
        conflict: true,
      };
    }

    const updatedTask = await tx.task.update({
      where: {
        id: taskId,
      },

      data: {
        assigneeId: newAssigneeId,

        version: {
          increment: 1,
        },
      },
    });

    await tx.auditLog.create({
      data: {
        taskId: task.id,
        userId,
        changedColumn: "assigneeId",
        oldValue: task.assigneeId,
        newValue: newAssigneeId,
      },
    });

    return {
      success: true,
      conflict: false,
      task: updatedTask,
    };
  });
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
  });
}

// =====================================================
// DELETE TASK DEPENDENCY
// =====================================================

export async function deleteTaskDependency(
  taskId: string,
  dependsOnTaskId: string,
) {
  return prisma.taskDependency.delete({
    where: {
      taskId_dependsOnTaskId: {
        taskId,
        dependsOnTaskId,
      },
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
  const visited = new Set<string>();

  const queue = [startTaskId];

  while (queue.length > 0) {
    const currentTaskId = queue.shift()!;

    if (currentTaskId === targetTaskId) {
      return true;
    }

    if (visited.has(currentTaskId)) {
      continue;
    }

    visited.add(currentTaskId);

    const dependencies =
      await prisma.taskDependency.findMany({
        where: {
          taskId: currentTaskId,
        },

        select: {
          dependsOnTaskId: true,
        },
      });

    for (const dependency of dependencies) {
      queue.push(
        dependency.dependsOnTaskId,
      );
    }
  }

  return false;
}