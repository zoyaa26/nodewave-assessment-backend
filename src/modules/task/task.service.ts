import {
  createTask,
  findTaskById,
  findTasksByProjectId,
  updateTaskStatusWithLock,
  updateTaskDescriptionWithLock,
  updateTaskAssigneeWithLock,
  createTaskDependency,
  hasDependencyPath,
  softDeleteTask,
} from "./task.repository";

type Role = "PM" | "INTERNAL" | "CLIENT";

type Department =
  | "UI_UX"
  | "FRONTEND"
  | "BACKEND";

type AuthUser = {
  userId: string;
  role: Role;
  department?: Department | null;
};

type TaskStatus =
  | "TODO"
  | "IN_PROGRESS"
  | "DONE"
  | "BLOCKED";

/**
 * =====================================================
 * GET SINGLE TASK
 * =====================================================
 */
export async function getTaskById(
  taskId: string,
  user: AuthUser,
) {
  if (!taskId) {
    throw new Error("Task ID is required");
  }

  const task =
    user.role === "CLIENT"
      ? await findTaskById(
          taskId,
          user.userId,
        )
      : await findTaskById(taskId);

  if (!task) {
    throw new Error("Task not found");
  }

  // PM dapat melihat semua task
  if (user.role === "PM") {
    return task;
  }

  // CLIENT:
  // repository sudah memastikan task
  // merupakan client-visible dan milik client
  if (user.role === "CLIENT") {
    return task;
  }

  // INTERNAL:
  // hanya task yang ditugaskan kepadanya
  if (user.role === "INTERNAL") {
    if (
      task.assigneeId !== user.userId
    ) {
      throw new Error("Forbidden");
    }

    return task;
  }

  throw new Error("Forbidden");
}

/**
 * =====================================================
 * GET TASKS BY PROJECT
 * =====================================================
 */
export async function getTasksByProject(
  projectId: string,
  user: AuthUser,
  params: Record<
    string,
    string | string[] | undefined
  > = {},
) {
  if (!projectId) {
    throw new Error(
      "Project ID is required",
    );
  }

  /**
   * PENTING:
   * params dari controller diteruskan
   * langsung ke repository supaya:
   *
   * filters
   * searchFilters
   * rangedFilters
   * orderKey
   * orderRule
   * page
   * rows
   *
   * tetap diproses oleh prisma-ezfilter.
   */

  // ===================================================
  // PM
  // ===================================================

  if (user.role === "PM") {
    return findTasksByProjectId(
      projectId,
      params,
    );
  }

  // ===================================================
  // INTERNAL
  // ===================================================

  if (user.role === "INTERNAL") {
    return findTasksByProjectId(
      projectId,
      params,
      undefined,
      user.userId,
    );
  }

  // ===================================================
  // CLIENT
  // ===================================================

  if (user.role === "CLIENT") {
    return findTasksByProjectId(
      projectId,
      params,
      user.userId,
      undefined,
    );
  }

  throw new Error("Forbidden");
}

/**
 * =====================================================
 * CREATE TASK
 * =====================================================
 */
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
  // Hanya PM
  if (user.role !== "PM") {
    throw new Error("Forbidden");
  }

  if (!data.projectId) {
    throw new Error(
      "Project ID is required",
    );
  }

  if (!data.title?.trim()) {
    throw new Error(
      "Task title is required",
    );
  }

  if (!data.description?.trim()) {
    throw new Error(
      "Task description is required",
    );
  }

  return createTask({
    projectId: data.projectId,
    assigneeId:
      data.assigneeId,
    title: data.title.trim(),
    description:
      data.description.trim(),
    clientVisible:
      data.clientVisible ?? false,
  });
}

/**
 * =====================================================
 * UPDATE TASK STATUS
 * =====================================================
 */
export async function updateTaskStatus(
  taskId: string,
  newStatus: TaskStatus,
  currentVersion: number,
  user: AuthUser,
) {
  if (!taskId) {
    throw new Error(
      "Task ID is required",
    );
  }

  if (
    ![
      "TODO",
      "IN_PROGRESS",
      "DONE",
      "BLOCKED",
    ].includes(newStatus)
  ) {
    throw new Error(
      "Invalid task status",
    );
  }

  if (
    typeof currentVersion !== "number" ||
    !Number.isInteger(currentVersion) ||
    currentVersion < 1
  ) {
    throw new Error(
      "Invalid task version",
    );
  }

  const task =
    await findTaskById(taskId);

  if (!task) {
    throw new Error(
      "Task not found",
    );
  }

  // CLIENT tidak boleh mengubah task
  if (user.role === "CLIENT") {
    throw new Error("Forbidden");
  }

  // INTERNAL hanya boleh mengubah task sendiri
  if (
    user.role === "INTERNAL" &&
    task.assigneeId !== user.userId
  ) {
    throw new Error("Forbidden");
  }

  // PM tidak boleh mengubah status menjadi DONE
  if (
    user.role === "PM" &&
    newStatus === "DONE"
  ) {
    throw new Error(
      "PM cannot change task status to DONE",
    );
  }

  /**
   * FRONTEND:
   * Tidak boleh mulai bekerja jika dependency
   * belum semuanya DONE.
   */
  if (
    user.role === "INTERNAL" &&
    user.department === "FRONTEND" &&
    newStatus === "IN_PROGRESS"
  ) {
    const unfinishedDependencies =
      task.dependencies.filter(
        (dependency) =>
          dependency.dependsOnTask.status !==
          "DONE",
      );

    if (
      unfinishedDependencies.length > 0
    ) {
      throw new Error(
        "Task dependencies must be completed before starting this task",
      );
    }
  }

  // Optimistic locking
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

/**
 * =====================================================
 * UPDATE DESCRIPTION
 * =====================================================
 */
export async function updateTaskDescription(
  taskId: string,
  newDescription: string,
  currentVersion: number,
  user: AuthUser,
) {
  if (!taskId) {
    throw new Error(
      "Task ID is required",
    );
  }

  // Hanya PM
  if (user.role !== "PM") {
    throw new Error("Forbidden");
  }

  if (!newDescription?.trim()) {
    throw new Error(
      "Task description is required",
    );
  }

  if (
    typeof currentVersion !== "number" ||
    !Number.isInteger(currentVersion) ||
    currentVersion < 1
  ) {
    throw new Error(
      "Invalid task version",
    );
  }

  const task =
    await findTaskById(taskId);

  if (!task) {
    throw new Error(
      "Task not found",
    );
  }

  const result =
    await updateTaskDescriptionWithLock(
      taskId,
      newDescription.trim(),
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


/**
 * =====================================================
 * UPDATE ASSIGNEE
 * =====================================================
 */
export async function updateTaskAssignee(
  taskId: string,
  newAssigneeId: string | null,
  currentVersion: number,
  user: AuthUser,
) {
  if (!taskId) {
    throw new Error(
      "Task ID is required",
    );
  }

  // Hanya PM
  if (user.role !== "PM") {
    throw new Error("Forbidden");
  }

  if (
    typeof currentVersion !== "number" ||
    !Number.isInteger(currentVersion) ||
    currentVersion < 1
  ) {
    throw new Error(
      "Invalid task version",
    );
  }

  const task =
    await findTaskById(taskId);

  if (!task) {
    throw new Error(
      "Task not found",
    );
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

/**
 * =====================================================
 * ADD TASK DEPENDENCY
 * =====================================================
 */
export async function addTaskDependency(
  taskId: string,
  dependsOnTaskId: string,
  user: AuthUser,
) {
  // Hanya PM
  if (user.role !== "PM") {
    throw new Error("Forbidden");
  }

  if (
    !taskId ||
    !dependsOnTaskId
  ) {
    throw new Error(
      "Task ID and dependency task ID are required",
    );
  }

  // Tidak boleh bergantung pada dirinya sendiri
  if (
    taskId === dependsOnTaskId
  ) {
    throw new Error(
      "A task cannot depend on itself",
    );
  }

  const task =
    await findTaskById(taskId);

  const dependency =
    await findTaskById(
      dependsOnTaskId,
    );

  if (!task || !dependency) {
    throw new Error(
      "Task not found",
    );
  }

  // Harus satu project
  if (
    task.projectId !==
    dependency.projectId
  ) {
    throw new Error(
      "Tasks must belong to the same project",
    );
  }

  /**
   * Cegah circular dependency.
   *
   * Apabila dependency -> task sudah memiliki
   * jalur ke task utama, maka penambahan ini
   * akan membuat cycle.
   */
  const createsCycle =
    await hasDependencyPath(
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
export async function deleteTask(
  taskId: string,
  user: {
    id: string;
    role: Role;
  },
) {
  if (user.role !== "PM") {
    throw new Error("Forbidden");
  }

  const task = await softDeleteTask(
    taskId,
    user.id,
  );

  if (!task) {
    throw new Error("Task not found");
  }

  return task;
}