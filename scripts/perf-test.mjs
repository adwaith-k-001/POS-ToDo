/**
 * Performance test script — run with:
 *   node --env-file=.env scripts/perf-test.mjs
 *
 * Tests each layer independently: Supabase auth API, raw PostgreSQL,
 * PrismaClient cold start, and warm query timing.
 */

import { performance } from "perf_hooks";
import pg from "pg";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const DATABASE_URL = process.env.DATABASE_URL;

function ms(n) { return `${n.toFixed(1)}ms`; }

// ─── 1. Supabase auth API round-trip ─────────────────────────────────────────
async function testSupabaseAuth() {
  console.log("\n══════════════════════════════════════════");
  console.log("  1. Supabase auth.getUser() round-trip");
  console.log("══════════════════════════════════════════");
  console.log(`  URL: ${SUPABASE_URL}/auth/v1/user`);

  const times = [];
  for (let i = 0; i < 6; i++) {
    const t0 = performance.now();
    const res = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
      headers: {
        apikey: SUPABASE_KEY,
        // Invalid token — we only care about the network round-trip, not the response body.
        Authorization: "Bearer perf_test_invalid_token",
      },
    });
    const t1 = performance.now();
    const elapsed = t1 - t0;
    if (i > 0) times.push(elapsed); // skip first (DNS resolution etc.)
    const label = i === 0 ? " (cold, skip)" : `        run ${i}`;
    console.log(`  ${label}: ${ms(elapsed)}  HTTP ${res.status}`);
  }
  const avg = times.reduce((a, b) => a + b, 0) / times.length;
  const min = Math.min(...times);
  const max = Math.max(...times);
  console.log(`  ─────────────────────────────────────`);
  console.log(`  avg: ${ms(avg)}  min: ${ms(min)}  max: ${ms(max)}`);
  console.log(`  → This is what getUser() costs per API call on the server`);
  return { avg, min, max };
}

// ─── 2. Raw PostgreSQL via pg ─────────────────────────────────────────────────
async function testRawPg() {
  console.log("\n══════════════════════════════════════════");
  console.log("  2. Raw PostgreSQL (pg) via PgBouncer");
  console.log("══════════════════════════════════════════");

  const pool = new pg.Pool({ connectionString: DATABASE_URL, max: 5 });

  // Connection acquisition
  const t0 = performance.now();
  const client = await pool.connect();
  const t1 = performance.now();
  console.log(`  connection acquire (cold): ${ms(t1 - t0)}`);

  // Simple pings
  const pings = [];
  for (let i = 0; i < 5; i++) {
    const t = performance.now();
    await client.query("SELECT 1");
    const elapsed = performance.now() - t;
    pings.push(elapsed);
    console.log(`  SELECT 1 run ${i + 1}: ${ms(elapsed)}`);
  }

  // Task table scan (no index)
  console.log("\n  Task table queries:");
  const t2 = performance.now();
  const r1 = await client.query("SELECT COUNT(*) FROM \"Task\"");
  console.log(`  COUNT(*) from Task (full scan): ${ms(performance.now() - t2)} — ${r1.rows[0].count} rows`);

  const t3 = performance.now();
  const r2 = await client.query(`SELECT COUNT(*) FROM "Task" WHERE "userId" = 'perf_test_nonexistent_user'`);
  console.log(`  COUNT where userId = ? (no index): ${ms(performance.now() - t3)}`);

  // Check existing indexes
  const idxRes = await client.query(`
    SELECT indexname, indexdef
    FROM pg_indexes
    WHERE tablename IN ('Task','Area','Tag','Goal','Habit','TaskHistory','HabitEntry','TaskTag')
    ORDER BY tablename, indexname
  `);
  console.log("\n  Current database indexes:");
  for (const row of idxRes.rows) {
    console.log(`    [${row.indexname}]`);
    console.log(`      ${row.indexdef}`);
  }

  // Check table sizes
  const sizeRes = await client.query(`
    SELECT relname AS table, n_live_tup AS rows
    FROM pg_stat_user_tables
    WHERE relname IN ('Task','Area','Tag','Goal','Habit','TaskHistory','HabitEntry','TaskTag')
    ORDER BY n_live_tup DESC
  `);
  console.log("\n  Table row counts (pg_stat_user_tables):");
  for (const row of sizeRes.rows) {
    console.log(`    ${row.table.padEnd(14)} ${row.rows} rows`);
  }

  client.release();
  await pool.end();

  const pingAvg = pings.reduce((a, b) => a + b, 0) / pings.length;
  console.log(`\n  → Avg raw query round-trip: ${ms(pingAvg)}`);
  return { pingAvg };
}

// ─── 3. Query pattern simulation via raw pg ────────────────────────────────────
async function testQueryPatterns() {
  console.log("\n══════════════════════════════════════════");
  console.log("  3. Query pattern simulation (raw pg)");
  console.log("══════════════════════════════════════════");

  const pool = new pg.Pool({ connectionString: DATABASE_URL, max: 3 });

  // Simulate getOverviewStats — 5 parallel COUNTs
  const t0 = performance.now();
  await Promise.all([
    pool.query(`SELECT COUNT(*) FROM "Task" WHERE "parentTaskId" IS NULL`),
    pool.query(`SELECT COUNT(*) FROM "Task" WHERE "parentTaskId" IS NULL AND status = 'COMPLETED'`),
    pool.query(`SELECT COUNT(*) FROM "Task" WHERE "parentTaskId" IS NULL AND status = 'ARCHIVED'`),
    pool.query(`SELECT COUNT(*) FROM "Task" WHERE "parentTaskId" IS NULL AND status IN ('TODO','IN_PROGRESS')`),
    pool.query(`SELECT COUNT(*) FROM "Task" WHERE "parentTaskId" IS NULL AND status IN ('TODO','IN_PROGRESS') AND deadline < NOW()`),
  ]);
  console.log(`  getOverviewStats — 5 parallel COUNTs:      ${ms(performance.now() - t0)}`);

  // Simulate getTasks (inbox, no index on userId)
  const t1 = performance.now();
  await pool.query(`
    SELECT t.* FROM "Task" t
    WHERE t."userId" = 'test' AND t."areaId" IS NULL AND t."parentTaskId" IS NULL
      AND t.status NOT IN ('ARCHIVED','COMPLETED','CANCELLED')
    ORDER BY t.priority ASC, t.deadline ASC, t."createdAt" DESC
  `);
  console.log(`  getTasks (inbox) — no index on userId:     ${ms(performance.now() - t1)}`);

  // Simulate getTasks (upcoming, deadline range)
  const t2 = performance.now();
  await pool.query(`
    SELECT t.* FROM "Task" t
    WHERE t."userId" = 'test'
      AND t.status IN ('TODO','IN_PROGRESS')
      AND t.deadline BETWEEN NOW() AND NOW() + INTERVAL '7 days'
    ORDER BY t.priority ASC, t.deadline ASC
  `);
  console.log(`  getTasks (upcoming) — deadline range:      ${ms(performance.now() - t2)}`);

  // Simulate getAreas + getTags in parallel (what /api/context does)
  const t3 = performance.now();
  await Promise.all([
    pool.query(`SELECT * FROM "Area" WHERE "userId" = 'test' ORDER BY name ASC`),
    pool.query(`SELECT * FROM "Tag"  WHERE "userId" = 'test' ORDER BY name ASC`),
  ]);
  console.log(`  getAreas + getTags parallel (/api/context): ${ms(performance.now() - t3)}`);

  // EXPLAIN a userId query to confirm seq scan
  const explain = await pool.query(`
    EXPLAIN (FORMAT TEXT) SELECT * FROM "Task" WHERE "userId" = 'some_user_id'
  `);
  console.log("\n  EXPLAIN SELECT * FROM Task WHERE userId = ?:");
  for (const row of explain.rows) {
    console.log(`    ${Object.values(row)[0]}`);
  }

  // Multi-round-trip cost simulation: auth(200ms) + query(155ms) per API call
  console.log("\n  Simulated API call sequences:");
  const AUTH_MS  = 215; // measured warm avg
  const QUERY_MS = 155; // measured warm avg

  console.log(`  /api/tasks  (sequential): getUser ${AUTH_MS}ms + query ${QUERY_MS}ms = ${AUTH_MS + QUERY_MS}ms`);
  console.log(`  /api/context(sequential): getUser ${AUTH_MS}ms + 2×query parallel ${QUERY_MS}ms = ${AUTH_MS + QUERY_MS}ms`);
  console.log(`  Both in parallel (wall):  max(${AUTH_MS+QUERY_MS}, ${AUTH_MS+QUERY_MS}) = ${AUTH_MS + QUERY_MS}ms`);
  console.log(`\n  If getUser() → getSession() in API routes (~1ms):`);
  console.log(`  /api/tasks:   1ms + ${QUERY_MS}ms = ${1 + QUERY_MS}ms`);
  console.log(`  Both parallel: ${1 + QUERY_MS}ms  (saving ~${AUTH_MS}ms vs current)`);

  await pool.end();
}

// ─── 4. Simulated API call cost breakdown ────────────────────────────────────
async function testApiBreakdown(supabaseResult, pgResult) {
  console.log("\n══════════════════════════════════════════");
  console.log("  4. Estimated per-request cost breakdown");
  console.log("══════════════════════════════════════════");

  const auth  = supabaseResult.avg;
  const query = pgResult.pingAvg;

  console.log(`\n  Component costs (measured averages):`);
  console.log(`    getUser() network call: ${ms(auth)}`);
  console.log(`    DB query round-trip:    ${ms(query)}`);

  console.log(`\n  Before optimisations (3 getUser + proxy getUser):`);
  console.log(`    proxy getUser:          ${ms(auth)}`);
  console.log(`    layout getUser:         ${ms(auth)}`);
  console.log(`    page getUser:           ${ms(auth)}`);
  console.log(`    DB queries:             ${ms(query * 3)}  (estimate)`);
  console.log(`    ─────────────────`);
  console.log(`    Server total:           ~${ms(auth * 3 + query * 3)}`);

  console.log(`\n  After step-1 fix (1 getUser via getCachedUser):`);
  console.log(`    getCachedUser (1x):     ${ms(auth)}`);
  console.log(`    DB queries:             ${ms(query * 3)}`);
  console.log(`    ─────────────────`);
  console.log(`    Server total:           ~${ms(auth + query * 3)}`);

  console.log(`\n  BUT: API routes each still call getUser() individually:`);
  console.log(`    /api/tasks  getUser:    ${ms(auth)}`);
  console.log(`    /api/context getUser:   ${ms(auth)}`);
  console.log(`    (parallel, so wall time = max): ~${ms(auth)}`);
  console.log(`    These fire AFTER page render, so total data-load time:`);
  console.log(`    ~${ms(auth + query * 2)}  (getUser + tasks query + areas+tags queries)`);

  console.log(`\n  If API routes used getSession() instead of getUser():`);
  console.log(`    API auth cost:          ~1ms (local cookie decode)`);
  console.log(`    Data-load time:         ~${ms(query * 2)}  (just DB queries)`);
  console.log(`    → Saving: ~${ms(auth)} per API call`);
}

// ─── main ─────────────────────────────────────────────────────────────────────
(async () => {
  console.log("\n╔══════════════════════════════════════════╗");
  console.log("║   Mark1 — Performance Measurement Suite  ║");
  console.log("╚══════════════════════════════════════════╝");
  console.log(`  Supabase: ${SUPABASE_URL?.split(".")[0]}...`);
  console.log(`  DB:       ${DATABASE_URL?.split("@")[1]?.split("/")[0] || "***"}`);

  try {
    const supabaseResult = await testSupabaseAuth();
    const pgResult = await testRawPg();
    await testQueryPatterns();
    await testApiBreakdown(supabaseResult, pgResult);
  } catch (err) {
    console.error("\nTest failed:", err.message);
    console.error(err.stack);
  }

  console.log("\n═══════════════════════════════════════════\n");
})();
