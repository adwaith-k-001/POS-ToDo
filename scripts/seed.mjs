/**
 * Run with: node scripts/seed.mjs
 * Seeds the database with sample data for development.
 */
const BASE = "http://localhost:3000";

async function post(path, data) {
  const res = await fetch(`${BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(`POST ${path} failed: ${json.error}`);
  return json.data;
}

// Areas
const [study, health, career, finance, personal] = await Promise.all([
  post("/api/areas", { name: "Study", color: "#6366f1", icon: "📚" }),
  post("/api/areas", { name: "Health", color: "#22c55e", icon: "💪" }),
  post("/api/areas", { name: "Career", color: "#f97316", icon: "💼" }),
  post("/api/areas", { name: "Finance", color: "#eab308", icon: "💰" }),
  post("/api/areas", { name: "Personal", color: "#ec4899", icon: "🧠" }),
]);
console.log("✓ Areas created");

// Tags
const [ml, uni, gym, ai] = await Promise.all([
  post("/api/tags", { name: "ML", color: "#8b5cf6" }),
  post("/api/tags", { name: "University", color: "#06b6d4" }),
  post("/api/tags", { name: "Gym", color: "#22c55e" }),
  post("/api/tags", { name: "AI", color: "#f43f5e" }),
]);
console.log("✓ Tags created");

const tomorrow = new Date(Date.now() + 86400000).toISOString();
const nextWeek = new Date(Date.now() + 7 * 86400000).toISOString();

// Tasks
const flatTask = await post("/api/tasks", {
  title: "Learn FLAT (Formal Languages)",
  description: "Cover automata theory, CFGs, and Turing machines for exam",
  priority: "HIGH",
  areaId: study.id,
  tagIds: [uni.id],
  deadline: nextWeek,
});

// Subtasks
await Promise.all([
  post("/api/tasks", { title: "Watch lecture videos", priority: "HIGH", areaId: study.id, parentTaskId: flatTask.id }),
  post("/api/tasks", { title: "Read textbook notes", priority: "MEDIUM", areaId: study.id, parentTaskId: flatTask.id }),
  post("/api/tasks", { title: "Solve PYQs", priority: "HIGH", areaId: study.id, parentTaskId: flatTask.id }),
]);

await Promise.all([
  post("/api/tasks", { title: "Go to Gym", priority: "MEDIUM", areaId: health.id, tagIds: [gym.id], repeatEnabled: true, repeatPattern: "DAILY" }),
  post("/api/tasks", { title: "Update resume", priority: "URGENT", areaId: career.id, deadline: tomorrow }),
  post("/api/tasks", { title: "Read Attention Is All You Need paper", priority: "HIGH", tagIds: [ml.id, ai.id] }),
  post("/api/tasks", { title: "Learn Docker", priority: "MEDIUM" }),
  post("/api/tasks", { title: "Buy noise-cancelling headphones", priority: "LOW" }),
  post("/api/tasks", { title: "Ask professor about internship", priority: "HIGH", areaId: career.id, deadline: tomorrow }),
]);

console.log("✓ Tasks + subtasks created");
console.log("\nSeed complete! Open http://localhost:3000");
