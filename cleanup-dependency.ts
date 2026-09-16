import { prisma } from "./src/lib/prisma";

async function main() {
  await prisma.taskDependency.delete({
    where: {
      taskId_dependsOnTaskId: {
        taskId: "cmu35r0q60008crz8g6cfjs2l",
        dependsOnTaskId: "cmu35r0qb000ccrz8bhmqx9lo",
      },
    },
  });

  console.log("Circular dependency test data deleted.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });