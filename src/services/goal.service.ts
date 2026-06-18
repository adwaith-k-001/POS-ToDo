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

export async function getGoals(status?: GoalStatus[]) {
  return prisma.goal.findMany({
    where: status?.length ? { status: { in: status } } : undefined,
    include: goalInclude,
    orderBy: { createdAt: "desc" },
  });
}

export async function getGoalById(id: string) {
  return prisma.goal.findUnique({ where: { id }, include: goalInclude });
}

export async function createGoal(input: {
  title: string;
  description?: string;
  color?: string;
  icon?: string | null;
  targetDate?: string | null;
}) {
  return prisma.goal.create({
    data: {
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
  return prisma.goal.update({
    where: { id },
    data: {
      ...input,
      targetDate:
        input.targetDate !== undefined
          ? input.targetDate
            ? new Date(input.targetDate)
            : null
          : undefined,
    },
    include: goalInclude,
  });
}

export async function deleteGoal(id: string) {
  // Detach tasks so they become inbox items
  await prisma.task.updateMany({ where: { goalId: id }, data: { goalId: null } });
  await prisma.goal.delete({ where: { id } });
}
