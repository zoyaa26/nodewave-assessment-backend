import type { Context } from "hono";

import {
  getTaskAttachments,
  uploadTaskAttachment,
} from "./attachment.service";

export async function uploadTaskAttachmentController(c: Context) {
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

    const body = await c.req.parseBody();

    const file = body.file;

    if (!(file instanceof File)) {
      return c.json(
        {
          success: false,
          message: "File is required",
        },
        400,
      );
    }

    const user = c.get("user");

    const attachment = await uploadTaskAttachment(
      taskId,
      user,
      file,
    );

    return c.json(
      {
        success: true,
        message: "Attachment uploaded successfully",
        data: attachment,
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
          message: "Forbidden",
        },
        403,
      );
    }

    if (message === "Task not found") {
      return c.json(
        {
          success: false,
          message: "Task not found",
        },
        404,
      );
    }

    if (
      message === "File cannot be empty" ||
      message === "File size must not exceed 10 MB" ||
      message === "File type is not supported"
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

export async function getTaskAttachmentsController(c: Context) {
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

    const user = c.get("user");

    const attachments = await getTaskAttachments(
      taskId,
      user,
    );

    return c.json({
      success: true,
      data: attachments,
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

    if (message === "Task not found") {
      return c.json(
        {
          success: false,
          message: "Task not found",
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