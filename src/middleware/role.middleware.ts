import type { Context, Next } from "hono";

type Role = "PM" | "INTERNAL" | "CLIENT";

export function roleMiddleware(...allowedRoles: Role[]) {
  return async (c: Context, next: Next) => {
    const user = c.get("user") as {
      userId: string;
      role: Role;
    } | undefined;

    if (!user) {
      return c.json(
        {
          success: false,
          message: "Unauthorized",
        },
        401,
      );
    }

    if (!allowedRoles.includes(user.role)) {
      return c.json(
        {
          success: false,
          message: "Forbidden",
        },
        403,
      );
    }

    await next();
  };
}