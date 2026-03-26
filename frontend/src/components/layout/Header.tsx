import { useAuthStore } from "../../store/authStore";
import { useNavigate } from "react-router-dom";

interface HeaderProps {
  onMenuToggle: () => void;
}

export default function Header({ onMenuToggle }: HeaderProps) {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <header className="flex h-16 items-center justify-between border-b border-gray-200 bg-white px-6">
      {/* Hamburger menu button - visible only on mobile */}
      <button
        onClick={onMenuToggle}
        className="rounded-lg p-2 text-gray-600 hover:bg-gray-100 md:hidden"
        aria-label="Open menu"
      >
        <span className="text-xl">☰</span>
      </button>
      <div className="hidden md:block" />
      <div className="flex items-center gap-4">
        <span className="text-sm text-gray-600">
          {user?.username ?? "사용자"}
        </span>
        <button
          onClick={handleLogout}
          className="rounded-lg px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100"
        >
          로그아웃
        </button>
      </div>
    </header>
  );
}
