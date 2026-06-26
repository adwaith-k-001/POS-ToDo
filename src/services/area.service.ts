import { prisma } from "@/lib/prisma";
import type { CreateAreaInput, UpdateAreaInput } from "@/lib/validations";
import type { AreaWithCount } from "@/types";

export async function getAreas(userId: string): Promise<AreaWithCount[]> {
  return prisma.area.findMany({
    where: { userId },
    include: { _count: { select: { tasks: true } } },
    orderBy: { name: "asc" },
  });
}

export async function getAreaById(userId: string, id: string) {
  return prisma.area.findFirst({
    where: { id, userId },
    include: {
      _count: { select: { tasks: true } },
      tasks: {
        where: { status: { notIn: ["ARCHIVED"] }, parentTaskId: null },
        include: {
          area: true,
          tags: { include: { tag: true } },
          _count: { select: { subTasks: true } },
        },
        orderBy: [{ priority: "asc" }, { deadline: "asc" }],
      },
    },
  });
}

export async function createArea(userId: string, input: CreateAreaInput) {
  return prisma.area.create({ data: { ...input, userId } });
}

export async function updateArea(userId: string, id: string, input: UpdateAreaInput) {
  await prisma.area.updateMany({ where: { id, userId }, data: input });
  return prisma.area.findFirst({ where: { id, userId } });
}

export async function deleteArea(userId: string, id: string) {
  await prisma.task.updateMany({ where: { areaId: id, userId }, data: { areaId: null } });
  await prisma.area.deleteMany({ where: { id, userId } });
}
