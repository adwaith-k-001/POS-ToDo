"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard, Inbox, CheckSquare,
  BarChart2, Settings, LogOut,
  Target, Repeat2, Calendar, FileText, DollarSign, Users, Bot,
  ChevronRight, Grid3x3,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import { createClient } from "@/lib/supabase/client";

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  comingSoon?: boolean;
}

const primaryNav: NavItem[] = [
  { label: "Focus Mode", href: "/", icon: LayoutDashboard },
  { label: "Inbox", href: "/inbox", icon: Inbox },
  { label: "Tasks", href: "/tasks", icon: CheckSquare },
  { label: "Goals", href: "/goals", icon: Target },
  { label: "Tracker", href: "/tracker", icon: Grid3x3 },
];

const analyticsNav: NavItem[] = [
  { label: "Analytics", href: "/analytics", icon: BarChart2 },
];

const futureNav: NavItem[] = [
  { label: "Habits", href: "/habits", icon: Repeat2, comingSoon: true },
  { label: "Calendar", href: "/calendar", icon: Calendar, comingSoon: true },
  { label: "Notes", href: "/notes", icon: FileText, comingSoon: true },
  { label: "Finance", href: "/finance", icon: DollarSign, comingSoon: true },
  { label: "Relationships", href: "/relationships", icon: Users, comingSoon: true },
  { label: "AI Assistant", href: "/ai", icon: Bot, comingSoon: true },
];

function NavLink({ item }: { item: NavItem }) {
  const pathname = usePathname();
  const isActive = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
  const Icon = item.icon;

  if (item.comingSoon) {
    return (
      <TooltipProvider delayDuration={300}>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center gap-3 rounded-md px-3 py-2 text-sm text-slate-600 cursor-not-allowed select-none">
              <Icon className="h-4 w-4 shrink-0" />
              <span className="flex-1">{item.label}</span>
              <span className="text-[10px] text-slate-700 border border-slate-700 rounded px-1">Soon</span>
            </div>
          </TooltipTrigger>
          <TooltipContent side="right">Coming soon</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <Link
      href={item.href}
      className={cn(
        "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
        isActive
          ? "bg-slate-800 text-slate-100"
          : "text-slate-400 hover:bg-slate-800/60 hover:text-slate-200"
      )}
    >
      <Icon className="h-4 w-4 shrink-0" />
      <span className="flex-1">{item.label}</span>
      {isActive && <ChevronRight className="h-3 w-3 opacity-40" />}
    </Link>
  );
}

interface SidebarProps {
  userEmail: string;
}

export function Sidebar({ userEmail }: SidebarProps) {
  const router = useRouter();
  const initial = userEmail.charAt(0).toUpperCase() || "?";

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <aside className="flex h-full w-60 shrink-0 flex-col border-r border-slate-800 bg-slate-950">
      {/* Logo */}
      <div className="flex h-14 items-center gap-2 border-b border-slate-800 px-4">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-600 text-white font-bold text-sm">
          M
        </div>
        <span className="font-semibold text-slate-100 tracking-tight">Personal OS</span>
      </div>

      {/* Nav */}
      <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto p-2 scrollbar-thin">
        <div className="px-1 py-1">
          {primaryNav.map((item) => <NavLink key={item.href} item={item} />)}
        </div>

        <Separator className="my-2" />

        <div className="px-1 py-1">
          {analyticsNav.map((item) => <NavLink key={item.href} item={item} />)}
        </div>

        <Separator className="my-2" />

        <div className="px-1 pb-1">
          <p className="px-3 py-1 text-[11px] font-medium uppercase tracking-wider text-slate-600">
            Coming Soon
          </p>
          {futureNav.map((item) => <NavLink key={item.href} item={item} />)}
        </div>
      </nav>

      {/* User + Settings + Logout */}
      <div className="border-t border-slate-800 p-2 space-y-1">
        <div className="flex items-center gap-3 px-3 py-2">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-700 text-xs font-medium text-slate-200">
            {initial}
          </div>
          <span className="flex-1 truncate text-xs text-slate-400">{userEmail}</span>
        </div>

        <Link
          href="/settings"
          className="flex items-center gap-3 rounded-md px-3 py-2 text-sm text-slate-500 hover:bg-slate-800 hover:text-slate-300 transition-colors"
        >
          <Settings className="h-4 w-4" />
          Settings
        </Link>

        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-slate-500 hover:bg-slate-800 hover:text-red-400 transition-colors"
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </button>
      </div>
    </aside>
  );
}
