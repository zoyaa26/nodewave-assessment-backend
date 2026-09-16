import {
  createTask,
  findTaskById,
  findTasksByProjectId,
  updateTaskStatusWithLock,
  updateTaskDescriptionWithLock,
  updateTaskAssigneeWithLock,
  createTaskDependency,
  hasDependencyPath,
} from "./task.repository";

type Role = "PM" | "INTERNAL" | "CLIENT";

type Department = "UI_UX" | "FRONTEND" | "BACKEND";

type AuthUser = {
  userId: string;
  role: Role;
  department?: Department | null;
};

// =====================================================
// GET TASK BY ID
// =====================================================

export async function getTaskById(
  taskId: string,
  user: AuthUser,
) {
  const task = await findTaskById(taskId);

  if (!task) {
    throw new Error("Task not found");
  }

  // PM boleh melihat semua task
  if (user.role === "PM") {
    return task;
  }

  // Client hanya boleh melihat task yang:
  // 1. clientVisible = true
  // 2. berasal dari project miliknya
  if (user.role === "CLIENT") {
    if (
      !task.clientVisible ||
      task.project.clientId !== user.userId
    ) {
      throw new Error("Forbidden");
    }

    return task;
  }

  // Internal hanya boleh melihat task miliknya
  if (user.role === "INTERNAL") {
    if (task.assigneeId !== user.userId) {
      throw new Error("Forbidden");
    }

    return task;
  }

  throw new Error("Forbidden");
}

// =====================================================
// GET TASKS BY PROJECT
// =====================================================

export async function getTasksByProject(
  projectId: string,
  user: AuthUser,
) {
  // PM boleh melihat semua task
  if (user.role === "PM") {
    return findTasksByProjectId(projectId);
  }

  // Internal hanya melihat task yang ditugaskan kepadanya
  if (user.role === "INTERNAL") {
    const tasks = await findTasksByProjectId(projectId);

    return tasks.filter(
      (task) => task.assigneeId === user.userId,
    );
  }

  // Client hanya melihat task visible
  // dari project miliknya
  if (user.role === "CLIENT") {
    return findTasksByProjectId(
      projectId,
      user.userId,
    );
  }

  throw new Error("Forbidden");
}

// =====================================================
// CREATE TASK
// =====================================================

export async function createNewTask(
  data: {
    projectId: string;
    assigneeId?: string;
    title: string;
    description: string;
    clientVisible?: boolean;
  },
  user: AuthUser,
) {
  // Hanya PM yang boleh membuat task
  if (user.role !== "PM") {
    throw new Error("Forbidden");
  }

  if (!data.title.trim()) {
    throw new Error("Task title is required");
  }

  if (!data.description.trim()) {
    throw new Error("Task description is required");
  }

  return createTask(data);
}

// =====================================================
// UPDATE TASK STATUS
// =====================================================

export async function updateTaskStatus(
  taskId: string,
  newStatus:
    | "TODO"
    | "IN_PROGRESS"
    | "DONE"
    | "BLOCKED",
  currentVersion: number,
  user: AuthUser,
) {
  const task = await findTaskById(taskId);

  if (!task) {
    throw new Error("Task not found");
  }

  // Client tidak boleh mengubah task
  if (user.role === "CLIENT") {
    throw new Error("Forbidden");
  }

  // Internal hanya boleh mengubah task miliknya
  if (user.role === "INTERNAL") {
    if (task.assigneeId !== user.userId) {
      throw new Error("Forbidden");
    }
  }

  // PM tidak boleh mengubah task menjadi DONE
  if (
    user.role === "PM" &&
    newStatus === "DONE"
  ) {
    throw new Error(
      "PM cannot change task status to DONE",
    );
  }

  // Frontend harus menunggu semua dependency selesai
  if (
    user.role === "INTERNAL" &&
    user.department === "FRONTEND" &&
    newStatus === "IN_PROGRESS"
  ) {
    const unfinishedDependencies =
      task.dependencies.filter(
        (dependency) =>
          dependency.dependsOnTask.status !== "DONE",
      );

    if (unfinishedDependencies.length > 0) {
      throw new Error(
        "Task dependencies must be completed before starting this task",
      );
    }
  }

  const result =
    await updateTaskStatusWithLock(
      taskId,
      newStatus,
      currentVersion,
      user.userId,
    );

  if (result.conflict) {
    throw new Error(
      "Task has been modified by another user",
    );
  }

  return result.task;
}

// =====================================================
// UPDATE TASK DESCRIPTION
// =====================================================

export async function updateTaskDescription(
  taskId: string,
  newDescription: string,
  currentVersion: number,
  user: AuthUser,
) {
  const task = await findTaskById(taskId);

  if (!task) {
    throw new Error("Task not found");
  }

  // CLIENT tidak boleh mengubah task
  if (user.role === "CLIENT") {
    throw new Error("Forbidden");
  }

  // INTERNAL hanya boleh mengubah task miliknya
  if (user.role === "INTERNAL") {
    if (task.assigneeId !== user.userId) {
      throw new Error("Forbidden");
    }
  }

  if (!newDescription.trim()) {
    throw new Error("Task description is required");
  }

  const result =
    await updateTaskDescriptionWithLock(
      taskId,
      newDescription,
      currentVersion,
      user.userId,
    );

  if (result.conflict) {
    throw new Error(
      "Task has been modified by another user",
    );
  }

  return result.task;
}
// =====================================================
// UPDATE TASK ASSIGNEE
// =====================================================

export async function updateTaskAssignee(
  taskId: string,
  newAssigneeId: string | null,
  currentVersion: number,
  user: AuthUser,
) {
  const task = await findTaskById(taskId);

  if (!task) {
    throw new Error("Task not found");
  }

  // Hanya PM yang boleh mengubah assignee
  if (user.role !== "PM") {
    throw new Error("Forbidden");
  }

  const result =
    await updateTaskAssigneeWithLock(
      taskId,
      newAssigneeId,
      currentVersion,
      user.userId,
    );

  if (result.conflict) {
    throw new Error(
      "Task has been modified by another user",
    );
  }

  return result.task;
}

// =====================================================
// ADD TASK DEPENDENCY
// =====================================================

export async function addTaskDependency(
  taskId: string,
  dependsOnTaskId: string,
  user: AuthUser,
) {
  // Hanya PM yang boleh membuat dependency
  if (user.role !== "PM") {
    throw new Error("Forbidden");
  }

  // Task tidak boleh bergantung pada dirinya sendiri
  if (taskId === dependsOnTaskId) {
    throw new Error(
      "A task cannot depend on itself",
    );
  }

  const task = await findTaskById(taskId);

  const dependency = await findTaskById(
    dependsOnTaskId,
  );

  if (!task || !dependency) {
    throw new Error("Task not found");
  }

  // Dependency harus berada di project yang sama
  if (task.projectId !== dependency.projectId) {
    throw new Error(
      "Tasks must belong to the same project",
    );
  }

  // Cegah circular dependency
  const createsCycle = await hasDependencyPath(
    dependsOnTaskId,
    taskId,
  );

  if (createsCycle) {
    throw new Error(
      "Circular dependency is not allowed",
    );
  }

  return createTaskDependency(
    taskId,
    dependsOnTaskId,
  );
}