import { prisma } from "@/lib/prisma";
import type { CreateTagInput, UpdateTagInput } from "@/lib/validations";
import type { TagWithCount } from "@/types";

export async function getTags(): Promise<TagWithCount[]> {
  return prisma.tag.findMany({
    include: { _count: { select: { tasks: true } } },
    orderBy: { name: "asc" },
  });
}

export async function getTagById(id: string) {
  return prisma.tag.findUnique({
    where: { id },
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

export async function createTag(input: CreateTagInput) {
  return prisma.tag.create({ data: input });
}

export async function updateTag(id: string, input: UpdateTagInput) {
  return prisma.tag.update({ where: { id }, data: input });
}

export async function deleteTag(id: string) {
  await prisma.taskTag.deleteMany({ where: { tagId: id } });
  return prisma.tag.delete({ where: { id } });
}
