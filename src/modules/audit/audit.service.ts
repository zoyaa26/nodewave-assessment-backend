import { prisma } from "../../lib/prisma";
import { findAuditLogsByTaskId } from "./audit.repository";

export async function getTaskAuditLogs(
  taskId: string,
  user: {
    userId: string;
    role: "PM" | "INTERNAL" | "CLIENT";
  },
) {
  const task = await prisma.task.findFirst({
    where: {
      id: taskId,
    },
    select: {
      id: true,
      assigneeId: true,
    },
  });

  if (!task) {
    throw new Error("Task not found");
  }

  if (user.role === "CLIENT") {
    throw new Error("Forbidden");
  }

  if (user.role === "INTERNAL" && task.assigneeId !== user.userId) {
    throw new Error("Forbidden");
  }

  return findAuditLogsByTaskId(taskId);
}