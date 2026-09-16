import { Hono } from "hono";
import {
  loginController,
  registerController,
  logoutController,
} from "./auth.controller";

const authRoutes = new Hono();

authRoutes.post("/register", registerController);
authRoutes.post("/login", loginController);
authRoutes.post("/logout", logoutController);

export default authRoutes;