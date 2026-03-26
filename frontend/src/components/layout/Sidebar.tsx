import { NavLink } from "react-router-dom";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const navItems = [
  { to: "/", label: "대시보드" },
  { to: "/services", label: "서비스 탐색" },
  { to: "/subscriptions", label: "내 구독" },
  { to: "/analytics", label: "지출 분석" },
  { to: "/calendar", label: "캘린더" },
  { to: "/settings", label: "설정" },
];

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  return (
    <>
      {/* Mobile overlay backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`glass-sidebar fixed inset-y-0 left-0 z-50 flex w-64 flex-col transition-transform duration-300 ease-in-out md:static md:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-16 items-center justify-between border-b border-white/30 px-6">
          <h1 className="text-lg font-bold">
            <span className="text-gray-900">Sub</span>
            <span className="text-indigo-500">Flow</span>
          </h1>
          {/* Mobile close button */}
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-gray-500 hover:bg-white/50 md:hidden"
            aria-label="Close sidebar"
          >
            ✕
          </button>
        </div>
        <nav className="flex-1 space-y-1 px-3 py-4">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/"}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-[12px] px-3 py-2 text-sm transition-colors ${
                  isActive
                    ? "bg-indigo-500/10 border border-indigo-500/15 text-indigo-500 font-semibold"
                    : "text-gray-600 font-medium hover:bg-white/50"
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>
    </>
  );
}
