"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Inbox, Sun, CalendarDays, CheckSquare,
  Layers, Tag, BarChart2, Settings,
  Target, Repeat2, Calendar, FileText, DollarSign, Users, Bot,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  comingSoon?: boolean;
}

const primaryNav: NavItem[] = [
  { label: "Dashboard", href: "/", icon: LayoutDashboard },
  { label: "Inbox", href: "/inbox", icon: Inbox },
  { label: "Today", href: "/today", icon: Sun },
  { label: "Upcoming", href: "/upcoming", icon: CalendarDays },
  { label: "Tasks", href: "/tasks", icon: CheckSquare },
  { label: "Areas", href: "/areas", icon: Layers },
  { label: "Tags", href: "/tags", icon: Tag },
];

const analyticsNav: NavItem[] = [
  { label: "Analytics", href: "/analytics", icon: BarChart2 },
];

const futureNav: NavItem[] = [
  { label: "Goals", href: "/goals", icon: Target, comingSoon: true },
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

export function Sidebar() {
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

      {/* Settings */}
      <div className="border-t border-slate-800 p-2">
        <Link
          href="/settings"
          className="flex items-center gap-3 rounded-md px-3 py-2 text-sm text-slate-500 hover:bg-slate-800 hover:text-slate-300 transition-colors"
        >
          <Settings className="h-4 w-4" />
          Settings
        </Link>
      </div>
    </aside>
  );
}
