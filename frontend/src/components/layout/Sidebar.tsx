import { NavLink } from "react-router-dom";

const navItems = [
  { to: "/", label: "대시보드", icon: "📊" },
  { to: "/services", label: "서비스 탐색", icon: "🔍" },
  { to: "/subscriptions", label: "내 구독", icon: "💳" },
  { to: "/analytics", label: "지출 분석", icon: "📈" },
  { to: "/calendar", label: "캘린더", icon: "📅" },
  { to: "/settings", label: "설정", icon: "⚙️" },
];

const groups: number[][] = [[0, 1, 2], [3, 4], [5]];

export default function FloatingDock() {
  return (
    <nav className="floating-dock">
      {groups.map((group, gi) => (
        <div key={gi} className="flex items-center gap-1.5">
          {gi > 0 && (
            <div className="mx-1 h-6 w-px bg-gray-300/50" />
          )}
          {group.map((idx) => {
            const item = navItems[idx];
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === "/"}
                className={({ isActive }) =>
                  `group relative flex h-12 w-12 items-center justify-center rounded-2xl text-xl transition-all duration-200 ${
                    isActive
                      ? "bg-gradient-to-br from-indigo-500 to-indigo-400 shadow-lg shadow-indigo-500/25 text-white"
                      : "text-gray-600 hover:bg-white/60"
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    {/* Tooltip */}
                    <span className="pointer-events-none absolute -top-9 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-lg bg-gray-800 px-2.5 py-1 text-xs font-medium text-white opacity-0 shadow-lg transition-all duration-200 group-hover:-top-10 group-hover:opacity-100">
                      {item.label}
                    </span>

                    {/* Icon with hover animation */}
                    <span className="transition-transform duration-200 group-hover:-translate-y-2 group-hover:scale-115">
                      {item.icon}
                    </span>

                    {/* Active dot indicator */}
                    {isActive && (
                      <span className="absolute -bottom-1 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-indigo-500" />
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
