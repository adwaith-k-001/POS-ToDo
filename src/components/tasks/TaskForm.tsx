"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { CreateTaskInput } from "@/lib/validations";
import type { AreaWithCount, TagWithCount } from "@/types";

interface TaskFormProps {
  onSubmit: (data: CreateTaskInput) => Promise<void>;
  onCancel: () => void;
  areas: AreaWithCount[];
  tags: TagWithCount[];
  defaultAreaId?: string;
  defaultValues?: Partial<CreateTaskInput>;
}

export function TaskForm({ onSubmit, onCancel, areas, tags, defaultAreaId, defaultValues }: TaskFormProps) {
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState(defaultValues?.title ?? "");
  const [description, setDescription] = useState(defaultValues?.description ?? "");
  const [priority, setPriority] = useState<string>(defaultValues?.priority ?? "MEDIUM");
  const [status, setStatus] = useState<string>(defaultValues?.status ?? "TODO");
  const [deadline, setDeadline] = useState(defaultValues?.deadline ?? "");
  const [areaId, setAreaId] = useState(defaultValues?.areaId ?? defaultAreaId ?? "");
  const [selectedTags, setSelectedTags] = useState<string[]>(defaultValues?.tagIds ?? []);
  const [repeatEnabled, setRepeatEnabled] = useState(defaultValues?.repeatEnabled ?? false);
  const [repeatPattern, setRepeatPattern] = useState<string>(defaultValues?.repeatPattern ?? "");

  const toggleTag = (id: string) => {
    setSelectedTags((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setLoading(true);
    try {
      await onSubmit({
        title: title.trim(),
        description: description || undefined,
        priority: priority as CreateTaskInput["priority"],
        status: status as CreateTaskInput["status"],
        deadline: deadline ? new Date(deadline).toISOString() : null,
        areaId: areaId || null,
        tagIds: selectedTags,
        repeatEnabled,
        repeatPattern: repeatEnabled ? (repeatPattern as CreateTaskInput["repeatPattern"]) : null,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Title */}
      <div className="space-y-1.5">
        <Label htmlFor="title">Title *</Label>
        <Input
          id="title"
          placeholder="What needs to be done?"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          autoFocus
          required
        />
      </div>

      {/* Description */}
      <div className="space-y-1.5">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          placeholder="Add more details..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Priority */}
        <div className="space-y-1.5">
          <Label>Priority</Label>
          <Select value={priority} onValueChange={setPriority}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="LOW">Low</SelectItem>
              <SelectItem value="MEDIUM">Medium</SelectItem>
              <SelectItem value="HIGH">High</SelectItem>
              <SelectItem value="URGENT">Urgent</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Status */}
        <div className="space-y-1.5">
          <Label>Status</Label>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="TODO">To Do</SelectItem>
              <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
              <SelectItem value="COMPLETED">Completed</SelectItem>
              <SelectItem value="CANCELLED">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Area */}
        <div className="space-y-1.5">
          <Label>Area</Label>
          <Select value={areaId || "none"} onValueChange={(v) => setAreaId(v === "none" ? "" : v)}>
            <SelectTrigger>
              <SelectValue placeholder="None (Inbox)" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">None (Inbox)</SelectItem>
              {areas.map((a) => (
                <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Deadline */}
        <div className="space-y-1.5">
          <Label htmlFor="deadline">Deadline</Label>
          <Input
            id="deadline"
            type="datetime-local"
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
            className="[color-scheme:dark]"
          />
        </div>
      </div>

      {/* Tags */}
      {tags.length > 0 && (
        <div className="space-y-1.5">
          <Label>Tags</Label>
          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => (
              <button
                key={tag.id}
                type="button"
                onClick={() => toggleTag(tag.id)}
                className={`rounded-md border px-2 py-0.5 text-xs transition-colors ${
                  selectedTags.includes(tag.id)
                    ? "border-transparent text-white"
                    : "border-slate-700 text-slate-400 hover:border-slate-500"
                }`}
                style={selectedTags.includes(tag.id) ? { backgroundColor: tag.color } : {}}
              >
                {tag.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Recurring */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="repeat"
            checked={repeatEnabled}
            onChange={(e) => setRepeatEnabled(e.target.checked)}
            className="accent-indigo-500"
          />
          <Label htmlFor="repeat" className="cursor-pointer">Recurring task</Label>
        </div>
        {repeatEnabled && (
          <Select value={repeatPattern} onValueChange={setRepeatPattern}>
            <SelectTrigger>
              <SelectValue placeholder="Repeat pattern" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="DAILY">Daily</SelectItem>
              <SelectItem value="WEEKLY">Weekly</SelectItem>
              <SelectItem value="MONTHLY">Monthly</SelectItem>
              <SelectItem value="YEARLY">Yearly</SelectItem>
            </SelectContent>
          </Select>
        )}
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="ghost" onClick={onCancel}>Cancel</Button>
        <Button type="submit" variant="primary" disabled={loading || !title.trim()}>
          {loading ? "Saving…" : "Save Task"}
        </Button>
      </div>
    </form>
  );
}
