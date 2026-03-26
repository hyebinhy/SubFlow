import { useAuthStore } from "../../store/authStore";
import { useNavigate } from "react-router-dom";

export default function Header() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-white/30 bg-white/40 backdrop-blur-xl px-6">
      <h1 className="text-lg font-bold">
        <span className="text-gray-900">Sub</span>
        <span className="text-indigo-500">Flow</span>
      </h1>
      <div className="flex items-center gap-4">
        <span className="text-sm text-gray-600">
          {user?.username ?? "사용자"}
        </span>
        <button
          onClick={handleLogout}
          className="btn-secondary-glass px-3 py-1.5 text-sm"
        >
          로그아웃
        </button>
        <div className="flex h-9 w-9 items-center justify-center rounded-[14px] bg-indigo-500 text-sm font-semibold text-white">
          {(user?.username ?? "U").charAt(0).toUpperCase()}
        </div>
      </div>
    </header>
  );
}
