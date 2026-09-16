import { prisma } from "../../lib/prisma";

export async function findTaskForAttachment(taskId: string) {
  return prisma.task.findFirst({
    where: {
      id: taskId,
      deletedAt: null,
    },
    select: {
      id: true,
      assigneeId: true,
      projectId: true,
    },
  });
}

export async function createTaskAttachment(data: {
  taskId: string;
  uploadedById: string;
  filename: string;
  storedFilename: string;
  mimeType: string;
  size: number;
}) {
  return prisma.taskAttachment.create({
    data,
    select: {
      id: true,
      taskId: true,
      uploadedById: true,
      filename: true,
      mimeType: true,
      size: true,
      createdAt: true,
    },
  });
}

export async function findTaskAttachments(taskId: string) {
  return prisma.taskAttachment.findMany({
    where: {
      taskId,
      deletedAt: null,
    },
    select: {
      id: true,
      taskId: true,
      uploadedById: true,
      filename: true,
      mimeType: true,
      size: true,
      createdAt: true,
      uploadedBy: {
        select: {
          id: true,
          name: true,
          role: true,
          department: true,
        },
      },
    },
    orderBy: {
      createdAt: "asc",
    },
  });
}