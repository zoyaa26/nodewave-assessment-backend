import bcrypt from "bcryptjs";
import { PrismaClient } from "../src/generated/prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting database seed...");

  const passwordHash = await bcrypt.hash("password123", 10);

  // =========================
  // USERS
  // =========================

  const pm = await prisma.user.upsert({
    where: {
      email: "pm@nodewave.test",
    },
    update: {},
    create: {
      name: "NodeWave PM",
      email: "pm@nodewave.test",
      passwordHash,
      role: "PM",
    },
  });

  const uiux = await prisma.user.upsert({
    where: {
      email: "uiux@nodewave.test",
    },
    update: {},
    create: {
      name: "UI UX Engineer",
      email: "uiux@nodewave.test",
      passwordHash,
      role: "INTERNAL",
      department: "UI_UX",
    },
  });

  const frontend = await prisma.user.upsert({
    where: {
      email: "frontend@nodewave.test",
    },
    update: {},
    create: {
      name: "Frontend Engineer",
      email: "frontend@nodewave.test",
      passwordHash,
      role: "INTERNAL",
      department: "FRONTEND",
    },
  });

  const backend = await prisma.user.upsert({
    where: {
      email: "backend@nodewave.test",
    },
    update: {},
    create: {
      name: "Backend Engineer",
      email: "backend@nodewave.test",
      passwordHash,
      role: "INTERNAL",
      department: "BACKEND",
    },
  });

  const client = await prisma.user.upsert({
    where: {
      email: "client@nodewave.test",
    },
    update: {},
    create: {
      name: "NodeWave Client",
      email: "client@nodewave.test",
      passwordHash,
      role: "CLIENT",
    },
  });

  console.log("✅ Users created");

  // =========================
  // CLEAN PREVIOUS ASSESSMENT DATA
  // =========================

  const existingProjects = await prisma.project.findMany({
    where: {
      name: "NodeWave E-Commerce Platform",
    },
    select: {
      id: true,
    },
  });

  const existingProjectIds = existingProjects.map(
    (existingProject) => existingProject.id,
  );

  if (existingProjectIds.length > 0) {
    const existingTasks = await prisma.task.findMany({
      where: {
        projectId: {
          in: existingProjectIds,
        },
      },
      select: {
        id: true,
      },
    });

    const existingTaskIds = existingTasks.map(
      (existingTask) => existingTask.id,
    );

    if (existingTaskIds.length > 0) {
      // Remove dependencies first because TaskDependency
      // references Task in two directions.
      await prisma.taskDependency.deleteMany({
        where: {
          OR: [
            {
              taskId: {
                in: existingTaskIds,
              },
            },
            {
              dependsOnTaskId: {
                in: existingTaskIds,
              },
            },
          ],
        },
      });

      // Remove attachments before removing tasks.
      await prisma.taskAttachment.deleteMany({
        where: {
          taskId: {
            in: existingTaskIds,
          },
        },
      });

      // Remove audit logs before removing tasks.
      await prisma.auditLog.deleteMany({
        where: {
          taskId: {
            in: existingTaskIds,
          },
        },
      });

      // Finally remove the tasks.
      await prisma.task.deleteMany({
        where: {
          id: {
            in: existingTaskIds,
          },
        },
      });
    }

    // Finally remove the old assessment projects.
    await prisma.project.deleteMany({
      where: {
        id: {
          in: existingProjectIds,
        },
      },
    });

    console.log("♻️ Previous assessment project cleaned");
  }

  // =========================
  // PROJECT
  // =========================

  const project = await prisma.project.create({
    data: {
      name: "NodeWave E-Commerce Platform",
      description:
        "High-value e-commerce project for NodeWave assessment.",
      clientId: client.id,
    },
  });

  console.log("✅ Project created");

  // =========================
  // TASK A
  // UI/UX DESIGN
  // =========================

  const uiuxTask = await prisma.task.create({
    data: {
      projectId: project.id,
      assigneeId: uiux.id,
      title: "UI/UX Design",
      description:
        "Create the UI/UX design and component specification.",
      status: "DONE",
      clientVisible: true,
    },
  });

  // =========================
  // TASK B
  // BACKEND API
  // =========================

  const backendTask = await prisma.task.create({
    data: {
      projectId: project.id,
      assigneeId: backend.id,
      title: "Backend API Integration",
      description:
        "Develop backend API required by the frontend application.",
      status: "DONE",
      clientVisible: false,
    },
  });

  // =========================
  // TASK C
  // FRONTEND SLICING
  // =========================

  const frontendTask = await prisma.task.create({
    data: {
      projectId: project.id,
      assigneeId: frontend.id,
      title: "Frontend Slicing",
      description:
        "Implement frontend based on UI/UX design and backend API.",
      status: "TODO",
      clientVisible: true,
    },
  });

  console.log("✅ Tasks created");

  // =========================
  // DEPENDENCIES
  // =========================

  await prisma.taskDependency.createMany({
    data: [
      {
        taskId: frontendTask.id,
        dependsOnTaskId: uiuxTask.id,
      },
      {
        taskId: frontendTask.id,
        dependsOnTaskId: backendTask.id,
      },
    ],
  });

  console.log("✅ Dependencies created");

  // =========================
  // SUMMARY
  // =========================

  console.log("");
  console.log("🎉 Seed completed successfully!");
  console.log("");
  console.log("Accounts:");
  console.log("PM       : pm@nodewave.test");
  console.log("UI/UX    : uiux@nodewave.test");
  console.log("Frontend : frontend@nodewave.test");
  console.log("Backend  : backend@nodewave.test");
  console.log("Client   : client@nodewave.test");
  console.log("Password: password123");
  console.log("");
  console.log(`Project ID: ${project.id}`);
  console.log(`UI/UX Task ID: ${uiuxTask.id}`);
  console.log(`Backend Task ID: ${backendTask.id}`);
  console.log(`Frontend Task ID: ${frontendTask.id}`);
}

main()
  .catch((error) => {
    console.error("❌ Seed failed:");
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });