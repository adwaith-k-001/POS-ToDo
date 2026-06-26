import { prisma } from "@/lib/prisma";
import type { CreateTaskInput, UpdateTaskInput } from "@/lib/validations";
import type { TaskWithRelations } from "@/types";
import type { TaskStatus, Priority, Prisma } from "@/generated/prisma/client";
import { addDays, addWeeks, addMonths, addYears } from "date-fns";

const taskInclude = {
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
} satisfies Prisma.TaskInclude;

export interface TaskFilters {
  status?: TaskStatus[];
  priority?: Priority[];
  areaId?: string;
  tagId?: string;
  goalId?: string;
  parentTaskId?: string | null;
  inbox?: boolean;
  search?: string;
  includeArchived?: boolean;
  onlyRecurring?: boolean;
  dueBefore?: Date;
  dueAfter?: Date;
}

export async function getTasks(
  userId: string,
  filters: TaskFilters = {}
): Promise<TaskWithRelations[]> {
  const where: Prisma.TaskWhereInput = { userId };

  if (filters.status?.length) {
    where.status = { in: filters.status };
  } else if (!filters.includeArchived) {
    where.status = { not: "ARCHIVED" };
  }

  if (filters.priority?.length) {
    where.priority = { in: filters.priority };
  }

  if (filters.areaId !== undefined) {
    where.areaId = filters.areaId || null;
  }

  if (filters.inbox) {
    where.areaId = null;
    where.parentTaskId = null;
    where.status = { notIn: ["ARCHIVED", "COMPLETED", "CANCELLED"] };
  }

  if (filters.tagId) {
    where.tags = { some: { tagId: filters.tagId } };
  }

  if (filters.goalId !== undefined) {
    where.goalId = filters.goalId || null;
  }

  if (filters.parentTaskId !== undefined) {
    where.parentTaskId = filters.parentTaskId;
  }

  if (filters.search) {
    where.title = { contains: filters.search, mode: "insensitive" };
  }

  if (filters.onlyRecurring) {
    where.repeatEnabled = true;
  }

  if (filters.dueBefore) {
    where.deadline = { ...(where.deadline as object), lte: filters.dueBefore };
  }

  if (filters.dueAfter) {
    where.deadline = { ...(where.deadline as object), gte: filters.dueAfter };
  }

  return prisma.task.findMany({
    where,
    include: taskInclude,
    orderBy: [{ priority: "asc" }, { deadline: "asc" }, { createdAt: "desc" }],
  }) as Promise<TaskWithRelations[]>;
}

export async function getTaskById(
  userId: string,
  id: string
): Promise<TaskWithRelations | null> {
  return prisma.task.findFirst({
    where: { id, userId },
    include: {
      ...taskInclude,
      history: { orderBy: { timestamp: "desc" } },
    },
  }) as Promise<TaskWithRelations | null>;
}

export async function createTask(
  userId: string,
  input: CreateTaskInput
): Promise<TaskWithRelations> {
  const { tagIds, ...data } = input;

  const task = await prisma.task.create({
    data: {
      ...data,
      userId,
      deadline: data.deadline ? new Date(data.deadline) : null,
      tags: tagIds.length
        ? { create: tagIds.map((tagId) => ({ tagId })) }
        : undefined,
    },
    include: taskInclude,
  });

  await prisma.taskHistory.create({
    data: { taskId: task.id, action: "CREATED" },
  });

  return task as TaskWithRelations;
}

export async function updateTask(
  userId: string,
  id: string,
  input: UpdateTaskInput
): Promise<TaskWithRelations> {
  const existing = await prisma.task.findFirstOrThrow({ where: { id, userId } });
  const { tagIds, ...data } = input;

  const historyEntries: Prisma.TaskHistoryCreateManyInput[] = [];

  if (data.title && data.title !== existing.title) {
    historyEntries.push({
      taskId: id,
      action: "TITLE_CHANGED",
      oldValue: existing.title,
      newValue: data.title,
    });
  }

  if (data.priority && data.priority !== existing.priority) {
    historyEntries.push({
      taskId: id,
      action: "PRIORITY_CHANGED",
      oldValue: existing.priority,
      newValue: data.priority,
    });
  }

  if ("deadline" in data) {
    const oldDeadline = existing.deadline?.toISOString() ?? null;
    const newDeadline = data.deadline ?? null;
    if (oldDeadline !== newDeadline) {
      historyEntries.push({
        taskId: id,
        action: "DEADLINE_CHANGED",
        oldValue: oldDeadline,
        newValue: newDeadline,
      });
    }
  }

  if ("areaId" in data && data.areaId !== existing.areaId) {
    historyEntries.push({
      taskId: id,
      action: "AREA_CHANGED",
      oldValue: existing.areaId,
      newValue: data.areaId ?? null,
    });
  }

  if (data.status && data.status !== existing.status) {
    if (data.status === "COMPLETED") {
      historyEntries.push({ taskId: id, action: "COMPLETED" });
    } else if (data.status === "ARCHIVED") {
      historyEntries.push({ taskId: id, action: "ARCHIVED" });
    } else if (existing.status === "COMPLETED") {
      historyEntries.push({ taskId: id, action: "REOPENED" });
    } else if (existing.status === "ARCHIVED") {
      historyEntries.push({ taskId: id, action: "RESTORED" });
    } else {
      historyEntries.push({
        taskId: id,
        action: "STATUS_CHANGED",
        oldValue: existing.status,
        newValue: data.status,
      });
    }
  }

  const updateData: Prisma.TaskUpdateInput = {
    ...data,
    deadline: data.deadline ? new Date(data.deadline) : data.deadline === null ? null : undefined,
    completedAt:
      data.status === "COMPLETED" && !existing.completedAt
        ? new Date()
        : data.status !== "COMPLETED" && existing.completedAt
        ? null
        : undefined,
    tags:
      tagIds !== undefined
        ? {
            deleteMany: {},
            create: tagIds.map((tagId) => ({ tagId })),
          }
        : undefined,
  };

  const [task] = await prisma.$transaction([
    prisma.task.update({
      where: { id },
      data: updateData,
      include: taskInclude,
    }),
    ...(historyEntries.length
      ? [prisma.taskHistory.createMany({ data: historyEntries })]
      : []),
  ]);

  if (data.status === "COMPLETED" && existing.repeatEnabled && existing.repeatPattern) {
    await spawnNextOccurrence(userId, task as TaskWithRelations);
  }

  return task as TaskWithRelations;
}

export async function archiveTask(userId: string, id: string): Promise<void> {
  await prisma.task.updateMany({ where: { id, userId }, data: { status: "ARCHIVED" } });
  await prisma.taskHistory.create({ data: { taskId: id, action: "ARCHIVED" } });
}

export async function permanentlyDeleteTask(userId: string, id: string): Promise<void> {
  await prisma.task.findFirstOrThrow({ where: { id, userId } });
  await prisma.task.updateMany({ where: { parentTaskId: id }, data: { parentTaskId: null } });
  await prisma.task.delete({ where: { id } });
}

async function spawnNextOccurrence(userId: string, task: TaskWithRelations): Promise<void> {
  if (!task.repeatPattern) return;

  const now = new Date();
  const base = task.deadline ?? now;
  const nextDeadline: Date =
    task.repeatPattern === "DAILY"
      ? addDays(base, 1)
      : task.repeatPattern === "WEEKLY"
      ? addWeeks(base, 1)
      : task.repeatPattern === "MONTHLY"
      ? addMonths(base, 1)
      : addYears(base, 1);

  await prisma.task.create({
    data: {
      userId,
      title: task.title,
      description: task.description,
      priority: task.priority,
      areaId: task.areaId,
      icon: task.icon,
      color: task.color,
      repeatEnabled: true,
      repeatPattern: task.repeatPattern,
      deadline: nextDeadline,
      recurringParentId: task.recurringParentId ?? task.id,
      tags: { create: task.tags.map((tt) => ({ tagId: tt.tagId })) },
    },
  });
}
