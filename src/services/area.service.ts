import { prisma } from "@/lib/prisma";
import type { CreateAreaInput, UpdateAreaInput } from "@/lib/validations";
import type { AreaWithCount } from "@/types";

export async function getAreas(): Promise<AreaWithCount[]> {
  return prisma.area.findMany({
    include: { _count: { select: { tasks: true } } },
    orderBy: { name: "asc" },
  });
}

export async function getAreaById(id: string) {
  return prisma.area.findUnique({
    where: { id },
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

export async function createArea(input: CreateAreaInput) {
  return prisma.area.create({ data: input });
}

export async function updateArea(id: string, input: UpdateAreaInput) {
  return prisma.area.update({ where: { id }, data: input });
}

export async function deleteArea(id: string) {
  // Unassign tasks before deleting area
  await prisma.task.updateMany({ where: { areaId: id }, data: { areaId: null } });
  return prisma.area.delete({ where: { id } });
}
