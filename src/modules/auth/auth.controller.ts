import type { Context } from "hono";
import {
  loginUser,
  registerUser,
} from "./auth.service";

export async function registerController(c: Context) {
  try {
    const body = await c.req.json();

    const result = await registerUser(body);

    return c.json(
      {
        success: true,
        message: "User registered successfully",
        data: result,
      },
      201,
    );
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Registration failed";

    return c.json(
      {
        success: false,
        message,
      },
      400,
    );
  }
}

export async function loginController(c: Context) {
  try {
    const body = await c.req.json();

    const result = await loginUser(body);

    return c.json({
      success: true,
      message: "Login successful",
      data: result,
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Login failed";

    return c.json(
      {
        success: false,
        message,
      },
      401,
    );
  }
}