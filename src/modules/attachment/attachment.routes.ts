import { Hono } from "hono";

import { authMiddleware } from "../../middleware/auth.middleware";

import {
  getTaskAttachmentsController,
  uploadTaskAttachmentController,
} from "./attachment.controller";

const attachmentRoutes = new Hono();

attachmentRoutes.use("*", authMiddleware);

attachmentRoutes.post(
  "/:id/attachments",
  uploadTaskAttachmentController,
);

attachmentRoutes.get(
  "/:id/attachments",
  getTaskAttachmentsController,
);

export default attachmentRoutes;