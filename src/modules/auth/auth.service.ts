import bcrypt from "bcryptjs";
import {
  createUser,
  findUserByEmail,
} from "./auth.repository";
import { generateToken } from "../../lib/jwt";

export async function registerUser(data: {
  name: string;
  email: string;
  password: string;
  role: "PM" | "INTERNAL" | "CLIENT";
  department?: "UI_UX" | "FRONTEND" | "BACKEND";
}) {
  const existingUser = await findUserByEmail(data.email);

  if (existingUser) {
    throw new Error("Email already registered");
  }

  const passwordHash = await bcrypt.hash(data.password, 10);

  const user = await createUser({
    name: data.name,
    email: data.email,
    passwordHash,
    role: data.role,
    department: data.department,
  });

  const token = generateToken({
    userId: user.id,
    role: user.role,
  });

  return {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      department: user.department,
    },
    token,
  };
}

export async function loginUser(data: {
  email: string;
  password: string;
}) {
  const user = await findUserByEmail(data.email);

  if (!user) {
    throw new Error("Invalid email or password");
  }

  const passwordValid = await bcrypt.compare(
    data.password,
    user.passwordHash,
  );

  if (!passwordValid) {
    throw new Error("Invalid email or password");
  }

  const token = generateToken({
    userId: user.id,
    role: user.role,
  });

  return {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      department: user.department,
    },
    token,
  };
}