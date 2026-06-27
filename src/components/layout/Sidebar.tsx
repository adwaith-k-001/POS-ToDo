"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const COMING_SOON = ["Habits", "Calendar", "Notes", "Finance", "Relationships", "AI Assistant"];

const A: React.CSSProperties = { textDecoration: "none" };

function NavBtn({
  href,
  label,
  icon,
  badge,
  active,
}: {
  href: string;
  label: string;
  icon: React.ReactNode;
  badge?: React.ReactNode;
  active: boolean;
}) {
  const base: React.CSSProperties = {
    display: "flex", alignItems: "center", gap: "11px",
    padding: "9px 11px", borderRadius: "10px",
    fontSize: "13.5px", cursor: "pointer", border: "none",
    width: "100%", textAlign: "left",
    color: active ? "var(--t1)" : "var(--t2)",
    fontWeight: active ? 500 : 400,
    background: active ? "rgba(215,172,97,0.16)" : "transparent",
    boxShadow: active ? "inset 0 0 0 1px rgba(215,172,97,0.25)" : "none",
    textDecoration: "none",
    transition: "background .2s, color .2s",
    fontFamily: "var(--font-sans)",
  };

  return (
    <Link href={href} style={base}>
      {icon}
      <span>{label}</span>
      {badge}
    </Link>
  );
}

interface SidebarProps {
  userEmail: string;
}

export function Sidebar({ userEmail }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const initials = userEmail.slice(0, 2).toUpperCase();
  const displayName = userEmail.split("@")[0];

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  const is = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  // Goals is active for /goals, /areas, /tags
  const goalsActive = ["/goals", "/areas", "/tags"].some((p) => pathname.startsWith(p));
  // Tasks is active for /tasks, /today, /upcoming, /completed
  const tasksActive = ["/tasks", "/today", "/upcoming", "/completed"].some(
    (p) => pathname === p || pathname.startsWith(p + "/")
  );

  return (
    <aside style={{
      display: "flex", flexDirection: "column",
      borderRight: "1px solid rgba(215,172,97,0.16)",
      background: "var(--glass2)",
      WebkitBackdropFilter: "blur(26px) saturate(1.3)",
      backdropFilter: "blur(26px) saturate(1.3)",
      padding: "20px 14px",
    }}>

      {/* Logo */}
      <div style={{ display: "flex", alignItems: "center", gap: "11px", padding: "6px 8px 22px" }}>
        <div style={{
          width: "34px", height: "34px", borderRadius: "10px",
          background: "var(--accent)",
          display: "flex", alignItems: "center", justifyContent: "center",
          color: "var(--ink)",
          fontFamily: "var(--font-serif)", fontSize: "20px", fontWeight: 600,
          boxShadow: "0 4px 16px rgba(215,172,97,0.40)",
          flexShrink: 0,
        }}>P</div>
        <div style={{ display: "flex", flexDirection: "column", gap: "1px" }}>
          <span style={{ fontFamily: "var(--font-serif)", fontSize: "16px", fontWeight: 600, color: "var(--t1)", lineHeight: 1 }}>PAIOS</span>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: "9.5px", letterSpacing: "0.14em", color: "var(--t3)" }}>PERSONAL OS</span>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ display: "flex", flexDirection: "column", gap: "2px", flex: 1, overflowY: "auto" }}>

        <NavBtn href="/" active={is("/")} label="Focus Mode" icon={
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
            <circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="1.7" />
            <circle cx="12" cy="12" r="3.4" fill="currentColor" />
          </svg>
        } badge={
          <span style={{ marginLeft: "auto", fontFamily: "var(--font-mono)", fontSize: "9px", letterSpacing: "0.1em", color: "var(--accent)", border: "1px solid rgba(215,172,97,0.4)", borderRadius: "5px", padding: "1px 5px", whiteSpace: "nowrap" }}>ENTER</span>
        } />

        <NavBtn href="/inbox" active={is("/inbox")} label="Inbox" icon={
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
            <path d="M4 13h4l1.5 3h5L16 13h4M5 13l2-7h10l2 7v5a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1v-5Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
          </svg>
        } />

        <NavBtn href="/tasks" active={tasksActive} label="Tasks" icon={
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
            <rect x="4" y="4" width="16" height="16" rx="4" stroke="currentColor" strokeWidth="1.7" />
            <path d="M8.5 12l2.2 2.2L15.5 9.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        } />

        <NavBtn href="/goals" active={goalsActive} label="Goals" icon={
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
            <path d="M6 21V4M6 4h11l-2 4 2 4H6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        } />

        <NavBtn href="/tracker" active={is("/tracker")} label="Tracker" icon={
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
            <rect x="4" y="4" width="16" height="16" rx="2.5" stroke="currentColor" strokeWidth="1.7" />
            <path d="M4 9.5h16M9.5 4v16" stroke="currentColor" strokeWidth="1.4" />
          </svg>
        } />

        <div style={{ height: "1px", background: "rgba(215,172,97,0.12)", margin: "10px 8px" }} />

        <NavBtn href="/analytics" active={is("/analytics")} label="Analytics" icon={
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
            <path d="M5 19V5M5 19h14M9 16v-5M13 16V8M17 16v-3" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
          </svg>
        } />

        <div style={{ height: "1px", background: "rgba(215,172,97,0.12)", margin: "10px 8px" }} />

        <div style={{ fontFamily: "var(--font-mono)", fontSize: "9px", letterSpacing: "0.16em", color: "var(--t3)", padding: "4px 10px 6px" }}>
          COMING SOON
        </div>
        {COMING_SOON.map((label) => (
          <div key={label} style={{
            display: "flex", alignItems: "center", gap: "11px",
            padding: "8px 11px", borderRadius: "9px", opacity: 0.4, cursor: "default",
          }}>
            <span style={{ width: "6px", height: "6px", borderRadius: "2px", border: "1px solid var(--t3)", flexShrink: 0 }} />
            <span style={{ fontSize: "13px", color: "var(--t2)" }}>{label}</span>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div style={{ display: "flex", flexDirection: "column", gap: "10px", paddingTop: "14px", borderTop: "1px solid rgba(215,172,97,0.12)", marginTop: "8px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "4px 6px" }}>
          <div style={{
            width: "32px", height: "32px", borderRadius: "50%",
            background: "rgba(215,172,97,0.18)", border: "1px solid rgba(215,172,97,0.30)",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "var(--accent)", fontSize: "12px", fontWeight: 600, flexShrink: 0,
          }}>{initials}</div>
          <div style={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
            <span style={{ fontSize: "12.5px", color: "var(--t1)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{displayName}</span>
            <span style={{ fontSize: "10.5px", color: "var(--t3)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{userEmail}</span>
          </div>
        </div>
        <div style={{ display: "flex", gap: "8px", padding: "0 4px" }}>
          <Link href="/settings" style={{
            flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "6px",
            fontSize: "11.5px", color: "var(--t2)",
            background: "transparent", border: "1px solid rgba(215,172,97,0.18)",
            borderRadius: "8px", padding: "7px", cursor: "pointer",
            textDecoration: "none",
          }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.7" />
              <path d="M19.4 13a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-2.7 1.1V21a2 2 0 1 1-4 0v-.2A1.6 1.6 0 0 0 7 19.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1A1.6 1.6 0 0 0 4.7 13H4.5a2 2 0 1 1 0-4h.2A1.6 1.6 0 0 0 6.4 6.3L6.3 6.2A2 2 0 1 1 9.1 3.4l.1.1A1.6 1.6 0 0 0 11 4V3.8a2 2 0 1 1 4 0V4a1.6 1.6 0 0 0 2.7 1.1l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0-.3 1.8" stroke="currentColor" strokeWidth="1.5" />
            </svg>
            Settings
          </Link>
          <button onClick={handleLogout} title="Sign out" style={{
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "var(--t2)", background: "transparent",
            border: "1px solid rgba(215,172,97,0.18)",
            borderRadius: "8px", padding: "7px 11px", cursor: "pointer",
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path d="M15 4h3a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1h-3M10 8l-4 4 4 4M6 12h10" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      </div>
    </aside>
  );
}
