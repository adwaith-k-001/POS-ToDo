import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { formatDistanceToNow, format, differenceInDays } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return "—";
  return format(new Date(date), "MMM d, yyyy");
}

export function formatRelative(date: Date | string | null | undefined): string {
  if (!date) return "—";
  return formatDistanceToNow(new Date(date), { addSuffix: true });
}

export function completionLatencyDays(
  createdAt: Date | string,
  completedAt: Date | string | null | undefined
): number | null {
  if (!completedAt) return null;
  return differenceInDays(new Date(completedAt), new Date(createdAt));
}

export function isOverdue(deadline: Date | string | null | undefined): boolean {
  if (!deadline) return false;
  return new Date(deadline) < new Date();
}

export function priorityOrder(priority: string): number {
  return { URGENT: 0, HIGH: 1, MEDIUM: 2, LOW: 3 }[priority] ?? 99;
}

export const PRIORITY_COLORS: Record<string, string> = {
  URGENT: "text-red-400",
  HIGH: "text-orange-400",
  MEDIUM: "text-yellow-400",
  LOW: "text-slate-400",
};

export const STATUS_COLORS: Record<string, string> = {
  TODO: "text-slate-400",
  IN_PROGRESS: "text-blue-400",
  COMPLETED: "text-green-400",
  CANCELLED: "text-slate-500",
  ARCHIVED: "text-slate-600",
};
