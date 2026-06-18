import type {
  Task,
  Area,
  Tag,
  TaskTag,
  TaskHistory,
  TaskStatus,
  Priority,
  RepeatPattern,
  HistoryAction,
  Goal,
  GoalStatus,
} from "@/generated/prisma/client";

export type {
  Task,
  Area,
  Tag,
  TaskTag,
  TaskHistory,
  TaskStatus,
  Priority,
  RepeatPattern,
  HistoryAction,
  Goal,
  GoalStatus,
};

// Task with all relations loaded
export type TaskWithRelations = Task & {
  area: Area | null;
  tags: (TaskTag & { tag: Tag })[];
  subTasks: TaskWithRelations[];
  history?: TaskHistory[];
  _count?: { subTasks: number };
};

export type GoalWithTasks = Goal & {
  tasks: TaskWithRelations[];
  _count: { tasks: number };
};

export type AreaWithCount = Area & {
  _count: { tasks: number };
};

export type TagWithCount = Tag & {
  _count: { tasks: number };
};

// Analytics types (all calculated, nothing stored)
export interface OverviewStats {
  totalCreated: number;
  totalCompleted: number;
  completionRate: number;
  activeTasks: number;
  overdueTasks: number;
  archivedTasks: number;
}

export interface LatencyStats {
  average: number | null;
  median: number | null;
  fastest: number | null;
  slowest: number | null;
}

export interface DeadlineStats {
  onTime: number;
  late: number;
  successRate: number;
  averageDelayDays: number | null;
}

export interface AreaStat {
  area: Area;
  created: number;
  completed: number;
  completionRate: number;
  avgCompletionDays: number | null;
}

export interface TrendPoint {
  date: string;
  created: number;
  completed: number;
}

export interface AnalyticsSummary {
  overview: OverviewStats;
  latency: LatencyStats;
  deadline: DeadlineStats;
  byArea: AreaStat[];
  trends: TrendPoint[];
}

// API response wrapper
export interface ApiResponse<T> {
  data: T;
  error?: never;
}
export interface ApiError {
  data?: never;
  error: string;
  details?: unknown;
}
export type ApiResult<T> = ApiResponse<T> | ApiError;
