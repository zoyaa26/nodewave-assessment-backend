import { PrismaClient } from "../../generated/prisma/client";

const prisma = new PrismaClient();

export async function findProjectById(
  id: string,
  clientId?: string,
) {
  return prisma.project.findFirst({
    where: {
      id,
      deletedAt: null,
      ...(clientId ? { clientId } : {}),
    },
    include: {
      client: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          department: true,
        },
      },
tasks: clientId
  ? {
      where: {
        deletedAt: null,
        clientVisible: true,
      },
      select: {
        id: true,
        title: true,
        description: true,
        status: true,
        clientVisible: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: {
        createdAt: "asc",
      },
    }
  : {
      where: {
        deletedAt: null,
      },
      include: {
        assignee: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            department: true,
          },
        },
      },
      orderBy: {
        createdAt: "asc",
      },
    },
    },
  });
}

export async function findProjectsByClientId(clientId: string) {
  return prisma.project.findMany({
    where: {
      clientId,
      deletedAt: null,
    },
    include: {
      tasks: {
        where: {
          deletedAt: null,
          clientVisible: true,
        },
        select: {
          id: true,
          title: true,
          status: true,
          clientVisible: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: {
          createdAt: "asc",
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });
}

export async function createProject(data: {
  name: string;
  description?: string;
  clientId?: string;
}) {
  return prisma.project.create({
    data,
  });
}
export async function getClientProjectMetrics(clientId: string) {
  const projects = await prisma.project.findMany({
    where: {
      clientId,
      deletedAt: null,
    },
    select: {
      id: true,
      name: true,
      tasks: {
        where: {
          deletedAt: null,
          clientVisible: true,
        },
        select: {
          status: true,
        },
      },
    },
  });

  return projects.map((project) => {
    const totalTasks = project.tasks.length;

    const todo = project.tasks.filter(
      (task) => task.status === "TODO",
    ).length;

    const inProgress = project.tasks.filter(
      (task) => task.status === "IN_PROGRESS",
    ).length;

    const done = project.tasks.filter(
      (task) => task.status === "DONE",
    ).length;

    const blocked = project.tasks.filter(
      (task) => task.status === "BLOCKED",
    ).length;

    return {
      projectId: project.id,
      projectName: project.name,
      totalTasks,
      todo,
      inProgress,
      done,
      blocked,
    };
  });
}