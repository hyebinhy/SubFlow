import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Search,
  CreditCard,
  TrendingUp,
  Calendar,
  Settings,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
}

const navItems: NavItem[] = [
  { to: "/", label: "대시보드", icon: LayoutDashboard },
  { to: "/services", label: "서비스 탐색", icon: Search },
  { to: "/subscriptions", label: "내 구독", icon: CreditCard },
  { to: "/analytics", label: "지출 분석", icon: TrendingUp },
  { to: "/calendar", label: "캘린더", icon: Calendar },
  { to: "/settings", label: "설정", icon: Settings },
];

const groups: number[][] = [[0, 1, 2], [3, 4], [5]];

export default function FloatingDock() {
  return (
    <nav className="floating-dock">
      {groups.map((group, gi) => (
        <div key={gi} className="flex items-center gap-1">
          {gi > 0 && (
            <div className="mx-1.5 h-6 w-px bg-white/10" />
          )}
          {group.map((idx) => {
            const item = navItems[idx];
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === "/"}
                className={({ isActive }) =>
                  `group relative flex h-11 w-11 items-center justify-center rounded-xl transition-all duration-200 ${
                    isActive
                      ? "bg-white/15 text-white shadow-lg shadow-white/5"
                      : "text-slate-400 hover:text-white hover:bg-white/10"
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    {/* Tooltip */}
                    <span className="pointer-events-none absolute -top-9 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-lg bg-slate-800 px-2.5 py-1 text-[11px] font-medium text-white opacity-0 shadow-lg transition-all duration-200 group-hover:-top-10 group-hover:opacity-100">
                      {item.label}
                    </span>

                    {/* Icon with hover animation */}
                    <span className="transition-transform duration-200 group-hover:-translate-y-1 group-hover:scale-110">
                      <Icon size={20} strokeWidth={isActive ? 2.2 : 1.8} />
                    </span>

                    {/* Active dot indicator */}
                    {isActive && (
                      <span className="absolute -bottom-1 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-indigo-400" />
                    )}
                  </>
                )}
              </NavLink>
            );
          })}
        </div>
      ))}
    </nav>
  );
}
