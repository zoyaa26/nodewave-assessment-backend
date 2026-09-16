import { Hono } from "hono";
import {
  loginController,
  registerController,
} from "./auth.controller";

const authRoutes = new Hono();

authRoutes.post("/register", registerController);
authRoutes.post("/login", loginController);

export default authRoutes;