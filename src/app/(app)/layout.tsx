import { redirect } from "next/navigation";
import { getCachedUser } from "@/lib/supabase/server";
import { Sidebar } from "@/components/layout/Sidebar";
import { SWRProvider } from "./SWRProvider";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getCachedUser();
  if (!user) redirect("/login");

  const userEmail = user.email ?? "";

  return (
    <SWRProvider>
      <div style={{ background: "var(--bg)", height: "100vh", overflow: "hidden", position: "relative" }}>

        {/* Ambient glow */}
        <div style={{
          position: "absolute", inset: 0, zIndex: 0, pointerEvents: "none",
          background: "radial-gradient(900px 700px at 60% 20%, rgba(215,172,97,0.18), transparent 60%)",
        }} />

        {/* Hex motif */}
        <div style={{
          position: "absolute", inset: 0, zIndex: 0, pointerEvents: "none",
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='28' height='49' viewBox='0 0 28 49'%3E%3Cpath d='M13.99 9.25l13 7.5v15l-13 7.5L1 31.75v-15l12.99-7.5zM3 17.9v12.7l11 6.35 11-6.35V17.9l-11-6.35L3 17.9z' fill='%23D7AC61'/%3E%3C/svg%3E")`,
          backgroundSize: "48px 84px",
          opacity: 0.07,
        }} />

        {/* Film grain */}
        <div style={{
          position: "absolute", inset: 0, zIndex: 0, pointerEvents: "none",
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='140' height='140'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
          backgroundSize: "150px 150px",
          opacity: 0.055,
          mixBlendMode: "overlay",
        }} />

        {/* App shell */}
        <div style={{
          position: "relative", zIndex: 1,
          display: "grid", gridTemplateColumns: "248px 1fr",
          height: "100vh", overflow: "hidden",
        }}>
          <Sidebar userEmail={userEmail} />
          <main style={{ overflowY: "auto", position: "relative" }}>
            <div style={{ maxWidth: "960px", margin: "0 auto", padding: "34px 40px 60px" }}>
              {children}
            </div>
          </main>
        </div>

      </div>
    </SWRProvider>
  );
}
