import { PrismaClient } from "../../generated/prisma/client";

const prisma = new PrismaClient();

export async function findUserByEmail(email: string) {
  return prisma.user.findUnique({
    where: {
      email,
    },
  });
}

export async function findUserById(id: string) {
  return prisma.user.findUnique({
    where: {
      id,
    },
  });
}

export async function createUser(data: {
  name: string;
  email: string;
  passwordHash: string;
  role: "PM" | "INTERNAL" | "CLIENT";
  department?: "UI_UX" | "FRONTEND" | "BACKEND";
}) {
  return prisma.user.create({
    data,
  });
}