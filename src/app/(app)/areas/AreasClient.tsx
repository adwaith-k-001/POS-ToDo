"use client";
import { useState } from "react";
import Link from "next/link";
import { Plus, Layers, ChevronRight, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useAreas } from "@/hooks/useAreas";

const PRESET_COLORS = [
  "#6366f1", "#8b5cf6", "#ec4899", "#f43f5e",
  "#f97316", "#eab308", "#22c55e", "#06b6d4",
];

const PRESET_ICONS = ["📚", "💪", "💼", "💰", "❤️", "🧠", "🎯", "🏠"];

export function AreasClient() {
  const { areas, loading, createArea, deleteArea } = useAreas();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [name, setName] = useState("");
  const [color, setColor] = useState(PRESET_COLORS[0]);
  const [icon, setIcon] = useState(PRESET_ICONS[0]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    await createArea({ name: name.trim(), color, icon });
    setDialogOpen(false);
    setName("");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 style={{ fontFamily: "var(--font-serif)", fontSize: "30px", fontWeight: 600, color: "var(--t1)" }}>Areas</h1>
          <p style={{ fontSize: "13.5px", color: "var(--t3)", marginTop: "4px" }}>Broad life categories for your tasks.</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="primary" size="sm"><Plus className="h-4 w-4" /> New Area</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Create Area</DialogTitle></DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-1.5">
                <Label>Icon</Label>
                <div className="flex flex-wrap gap-2">
                  {PRESET_ICONS.map((i) => (
                    <button
                      key={i} type="button" onClick={() => setIcon(i)}
                      className={`h-9 w-9 rounded-lg border text-xl flex items-center justify-center transition-colors ${icon === i ? "border-indigo-500 bg-indigo-900/30" : "border-slate-700 hover:border-slate-500"}`}
                    >{i}</button>
                  ))}
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="area-name">Name *</Label>
                <Input id="area-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Study, Health, Career…" autoFocus required />
              </div>
              <div className="space-y-1.5">
                <Label>Color</Label>
                <div className="flex gap-2">
                  {PRESET_COLORS.map((c) => (
                    <button
                      key={c} type="button" onClick={() => setColor(c)}
                      className={`h-7 w-7 rounded-full border-2 transition-transform ${color === c ? "border-white scale-110" : "border-transparent"}`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="ghost" onClick={() => setDialogOpen(false)}>Cancel</Button>
                <Button type="submit" variant="primary" disabled={!name.trim()}>Create Area</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-20 rounded-xl bg-slate-800/50 animate-pulse" />
          ))}
        </div>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2">
        {areas.map((area) => (
          <Link
            key={area.id}
            href={`/areas/${area.id}`}
            className="flex items-center gap-4 rounded-xl border border-slate-800 bg-slate-900 p-4 hover:border-slate-700 hover:bg-slate-800/60 transition-colors group"
          >
            <div
              className="flex h-10 w-10 items-center justify-center rounded-xl text-xl shrink-0"
              style={{ backgroundColor: `${area.color}20` }}
            >
              {area.icon ?? <Layers className="h-5 w-5" style={{ color: area.color }} />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-slate-200">{area.name}</p>
              <p className="text-xs text-slate-500">{area._count.tasks} tasks</p>
            </div>
            <ChevronRight className="h-4 w-4 text-slate-700 group-hover:text-slate-500 transition-colors" />
          </Link>
        ))}
      </div>

      {!loading && areas.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-800 py-16 text-center">
          <p className="text-slate-500 text-sm">No areas yet. Create your first life category.</p>
        </div>
      )}
    </div>
  );
}
