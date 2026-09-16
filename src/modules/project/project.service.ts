import {
  createProject,
  findProjectById,
  findProjectsByClientId,
  getClientProjectMetrics,
} from "./project.repository";

type Role = "PM" | "INTERNAL" | "CLIENT";

type AuthUser = {
  userId: string;
  role: Role;
};

export async function getProjectById(
  projectId: string,
  user: AuthUser,
) {
  // PM boleh melihat semua task dalam project
  if (user.role === "PM") {
    const project = await findProjectById(projectId);

    if (!project) {
      throw new Error("Project not found");
    }

    return project;
  }

  // Client hanya boleh melihat project miliknya
  // dan hanya task yang clientVisible = true
  if (user.role === "CLIENT") {
    const project = await findProjectById(
      projectId,
      user.userId,
    );

    if (!project) {
      throw new Error("Project not found");
    }

    return project;
  }

  // Internal belum kita izinkan mengakses
  // detail project secara langsung
  if (user.role === "INTERNAL") {
    throw new Error("Forbidden");
  }

  throw new Error("Forbidden");
}

export async function getClientProjects(user: AuthUser) {
  if (user.role !== "CLIENT") {
    throw new Error("Forbidden");
  }

  return findProjectsByClientId(user.userId);
}

export async function createNewProject(
  data: {
    name: string;
    description?: string;
    clientId?: string;
  },
  user: AuthUser,
) {
  // Hanya PM yang boleh membuat project
  if (user.role !== "PM") {
    throw new Error("Forbidden");
  }

  if (!data.name?.trim()) {
    throw new Error("Project name is required");
  }

  return createProject({
    name: data.name,
    description: data.description,
    clientId: data.clientId,
  });
}
export async function getClientMetrics(user: AuthUser) {
  if (user.role !== "CLIENT") {
    throw new Error("Forbidden");
  }

  return getClientProjectMetrics(user.userId);
}