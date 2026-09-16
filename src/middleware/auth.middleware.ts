import type { Context, Next } from "hono";
import { verifyToken } from "../lib/jwt";
import { findUserById } from "../modules/auth/auth.repository";

export async function authMiddleware(c: Context, next: Next) {
  const authorization = c.req.header("Authorization");

  if (!authorization) {
    return c.json(
      {
        success: false,
        message: "Authorization header is required",
      },
      401,
    );
  }

  const [scheme, token] = authorization.split(" ");

  if (scheme !== "Bearer" || !token) {
    return c.json(
      {
        success: false,
        message: "Invalid authorization format",
      },
      401,
    );
  }

  try {
    const payload = verifyToken(token);

    if (
      typeof payload !== "object" ||
      !payload ||
      !("userId" in payload)
    ) {
      return c.json(
        {
          success: false,
          message: "Invalid token payload",
        },
        401,
      );
    }

    const user = await findUserById(payload.userId as string);

    if (!user || user.deletedAt) {
      return c.json(
        {
          success: false,
          message: "User not found",
        },
        401,
      );
    }

    c.set("user", {
      userId: user.id,
      role: user.role,
      department: user.department,
    });

    await next();
  } catch {
    return c.json(
      {
        success: false,
        message: "Invalid or expired token",
      },
      401,
    );
  }
}