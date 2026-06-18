"use client";
import { useState } from "react";
import Link from "next/link";
import { Plus, Tag, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useTags } from "@/hooks/useTags";
import type { TagWithCount } from "@/types";

const PRESET_COLORS = [
  "#6366f1", "#8b5cf6", "#ec4899", "#f43f5e",
  "#f97316", "#eab308", "#22c55e", "#06b6d4",
];

export function TagsClient({ tags: initial }: { tags: TagWithCount[] }) {
  const { tags, createTag } = useTags();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [name, setName] = useState("");
  const [color, setColor] = useState(PRESET_COLORS[0]);

  const displayed = tags.length > 0 ? tags : initial;

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    await createTag({ name: name.trim(), color });
    setDialogOpen(false);
    setName("");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-100">Tags</h1>
          <p className="text-sm text-slate-500 mt-0.5">Flexible labels across all tasks.</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="primary" size="sm"><Plus className="h-4 w-4" /> New Tag</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Create Tag</DialogTitle></DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="tag-name">Name *</Label>
                <Input id="tag-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="AI, Gym, University…" autoFocus required />
              </div>
              <div className="space-y-1.5">
                <Label>Color</Label>
                <div className="flex gap-2">
                  {PRESET_COLORS.map((c) => (
                    <button key={c} type="button" onClick={() => setColor(c)}
                      className={`h-7 w-7 rounded-full border-2 transition-transform ${color === c ? "border-white scale-110" : "border-transparent"}`}
                      style={{ backgroundColor: c }} />
                  ))}
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="ghost" onClick={() => setDialogOpen(false)}>Cancel</Button>
                <Button type="submit" variant="primary" disabled={!name.trim()}>Create Tag</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex flex-wrap gap-3">
        {displayed.map((tag) => (
          <Link
            key={tag.id}
            href={`/tags/${tag.id}`}
            className="flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-900 px-4 py-2.5 hover:border-slate-700 hover:bg-slate-800/60 transition-colors"
          >
            <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: tag.color }} />
            <span className="text-sm text-slate-300">{tag.name}</span>
            <span className="text-xs text-slate-600">{tag._count.tasks}</span>
          </Link>
        ))}
        {displayed.length === 0 && (
          <p className="text-slate-500 text-sm">No tags yet.</p>
        )}
      </div>
    </div>
  );
}
