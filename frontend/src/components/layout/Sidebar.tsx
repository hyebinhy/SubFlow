import { NavLink } from "react-router-dom";

const navItems = [
  { to: "/", label: "대시보드", icon: "📊" },
  { to: "/services", label: "서비스 탐색", icon: "🔍" },
  { to: "/subscriptions", label: "내 구독", icon: "💳" },
  { to: "/analytics", label: "지출 분석", icon: "📈" },
  { to: "/calendar", label: "캘린더", icon: "📅" },
  { to: "/settings", label: "설정", icon: "⚙️" },
];

export default function Sidebar() {
  return (
    <aside className="flex h-screen w-64 flex-col border-r border-gray-200 bg-white">
      <div className="flex h-16 items-center border-b border-gray-200 px-6">
        <h1 className="text-lg font-bold text-blue-600">SubManager</h1>
      </div>
      <nav className="flex-1 space-y-1 px-3 py-4">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === "/"}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                isActive
                  ? "bg-blue-50 text-blue-700"
                  : "text-gray-700 hover:bg-gray-100"
              }`
            }
          >
            <span>{item.icon}</span>
            {item.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
