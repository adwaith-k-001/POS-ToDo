import { prisma } from "@/lib/prisma";
import type { CreateTagInput, UpdateTagInput } from "@/lib/validations";
import type { TagWithCount } from "@/types";

export async function getTags(userId: string): Promise<TagWithCount[]> {
  return prisma.tag.findMany({
    where: { userId },
    include: { _count: { select: { tasks: true } } },
    orderBy: { name: "asc" },
  });
}

export async function getTagById(userId: string, id: string) {
  return prisma.tag.findFirst({
    where: { id, userId },
    include: {
      _count: { select: { tasks: true } },
      tasks: {
        include: {
          task: {
            include: {
              area: true,
              tags: { include: { tag: true } },
              _count: { select: { subTasks: true } },
            },
          },
        },
      },
    },
  });
}

export async function createTag(userId: string, input: CreateTagInput) {
  return prisma.tag.create({ data: { ...input, userId } });
}

export async function updateTag(userId: string, id: string, input: UpdateTagInput) {
  await prisma.tag.updateMany({ where: { id, userId }, data: input });
  return prisma.tag.findFirst({ where: { id, userId } });
}

export async function deleteTag(userId: string, id: string) {
  await prisma.taskTag.deleteMany({ where: { tagId: id } });
  await prisma.tag.deleteMany({ where: { id, userId } });
}
