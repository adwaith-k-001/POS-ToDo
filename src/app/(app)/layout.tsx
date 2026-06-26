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
      <div className="flex h-screen bg-slate-950 text-slate-100 overflow-hidden">
        <Sidebar userEmail={userEmail} />
        <main className="flex-1 overflow-y-auto">
          <div className="p-8">{children}</div>
        </main>
      </div>
    </SWRProvider>
  );
}
