import { prisma } from "../../lib/prisma";

export async function findAuditLogsByTaskId(taskId: string) {
  return prisma.auditLog.findMany({
    where: {
      taskId,
    },
    select: {
      id: true,
      taskId: true,
      userId: true,
      timestamp: true,
      changedColumn: true,
      oldValue: true,
      newValue: true,
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          department: true,
        },
      },
    },
    orderBy: {
      timestamp: "asc",
    },
  });
}