import { randomUUID } from "node:crypto";

import {
  createTaskAttachment,
  findTaskAttachments,
  findTaskForAttachment,
} from "./attachment.repository";

const MAX_FILE_SIZE = 10 * 1024 * 1024;

const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
  "application/zip",
  "application/x-zip-compressed",
]);

export async function uploadTaskAttachment(
  taskId: string,
  user: {
    userId: string;
    role: "PM" | "INTERNAL" | "CLIENT";
  },
  file: File,
) {
  if (user.role === "CLIENT") {
    throw new Error("Forbidden");
  }

  const task = await findTaskForAttachment(taskId);

  if (!task) {
    throw new Error("Task not found");
  }

  if (
    user.role === "INTERNAL" &&
    task.assigneeId !== user.userId
  ) {
    throw new Error("Forbidden");
  }

  if (file.size === 0) {
    throw new Error("File cannot be empty");
  }

  if (file.size > MAX_FILE_SIZE) {
    throw new Error("File size must not exceed 10 MB");
  }

  if (!ALLOWED_MIME_TYPES.has(file.type)) {
    throw new Error("File type is not supported");
  }

  const extension = file.name.includes(".")
    ? `.${file.name.split(".").pop()}`
    : "";

  const storedFilename = `${randomUUID()}${extension}`;

  const uploadDirectory = "uploads/tasks";

  await Bun.write(
    `${uploadDirectory}/${storedFilename}`,
    file,
  );

  return createTaskAttachment({
    taskId,
    uploadedById: user.userId,
    filename: file.name,
    storedFilename,
    mimeType: file.type,
    size: file.size,
  });
}

export async function getTaskAttachments(
  taskId: string,
  user: {
    userId: string;
    role: "PM" | "INTERNAL" | "CLIENT";
  },
) {
  if (user.role === "CLIENT") {
    throw new Error("Forbidden");
  }

  const task = await findTaskForAttachment(taskId);

  if (!task) {
    throw new Error("Task not found");
  }

  if (
    user.role === "INTERNAL" &&
    task.assigneeId !== user.userId
  ) {
    throw new Error("Forbidden");
  }

  return findTaskAttachments(taskId);
}