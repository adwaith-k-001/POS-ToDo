import { prisma } from "@/lib/prisma";
import type { Prisma, GoalStatus } from "@/generated/prisma/client";

const goalInclude = {
  tasks: {
    where: { parentTaskId: null },
    include: {
      area: true,
      tags: { include: { tag: true } },
      subTasks: {
        include: {
          area: true,
          tags: { include: { tag: true } },
          subTasks: true,
          _count: { select: { subTasks: true } },
        },
      },
      _count: { select: { subTasks: true } },
    },
    orderBy: [{ status: "asc" }, { priority: "asc" }, { createdAt: "desc" }] as Prisma.TaskOrderByWithRelationInput[],
  },
  _count: { select: { tasks: true } },
} satisfies Prisma.GoalInclude;

export async function getGoals(userId: string, status?: GoalStatus[]) {
  return prisma.goal.findMany({
    where: {
      userId,
      ...(status?.length ? { status: { in: status } } : {}),
    },
    include: goalInclude,
    orderBy: { createdAt: "desc" },
  });
}

export async function getGoalById(userId: string, id: string) {
  return prisma.goal.findFirst({ where: { id, userId }, include: goalInclude });
}

export async function createGoal(
  userId: string,
  input: {
    title: string;
    description?: string;
    color?: string;
    icon?: string | null;
    targetDate?: string | null;
  }
) {
  return prisma.goal.create({
    data: {
      userId,
      title: input.title,
      description: input.description,
      color: input.color ?? "#6366f1",
      icon: input.icon ?? null,
      targetDate: input.targetDate ? new Date(input.targetDate) : null,
    },
    include: goalInclude,
  });
}

export async function updateGoal(
  userId: string,
  id: string,
  input: Partial<{
    title: string;
    description: string | null;
    color: string;
    icon: string | null;
    status: GoalStatus;
    targetDate: string | null;
  }>
) {
  await prisma.goal.updateMany({
    where: { id, userId },
    data: {
      ...input,
      targetDate:
        input.targetDate !== undefined
          ? input.targetDate
            ? new Date(input.targetDate)
            : null
          : undefined,
    },
  });
  return prisma.goal.findFirst({ where: { id, userId }, include: goalInclude });
}

export async function deleteGoal(userId: string, id: string) {
  await prisma.task.updateMany({ where: { goalId: id, userId }, data: { goalId: null } });
  await prisma.goal.deleteMany({ where: { id, userId } });
}
