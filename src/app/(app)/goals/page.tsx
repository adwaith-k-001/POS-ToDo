"use client";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { GoalsClient } from "./GoalsClient";
import { AreasClient } from "../areas/AreasClient";
import { TagsClient } from "../tags/TagsClient";

type View = "goals" | "areas" | "tags";

const VIEWS: { key: View; label: string }[] = [
  { key: "goals", label: "Goals" },
  { key: "areas", label: "Areas" },
  { key: "tags", label: "Tags" },
];

export default function GoalsPage() {
  const [view, setView] = useState<View>("goals");

  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-1">
        {VIEWS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setView(key)}
            className={cn(
              "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
              view === key
                ? "bg-slate-800 text-slate-100"
                : "text-slate-500 hover:bg-slate-800/60 hover:text-slate-300"
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {view === "goals" && <GoalsClient />}
      {view === "areas" && <AreasClient />}
      {view === "tags" && <TagsClient />}
    </div>
  );
}
