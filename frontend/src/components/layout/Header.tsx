import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { Moon, Sun } from "lucide-react";
import { useAuthStore } from "../../store/authStore";
import NotificationBell from "./NotificationBell";

export default function Header() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const savedTheme = localStorage.getItem("subflow-theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const shouldUseDark = savedTheme ? savedTheme === "dark" : prefersDark;

    document.documentElement.classList.toggle("dark", shouldUseDark);
    setIsDark(shouldUseDark);
  }, []);

  const toggleTheme = () => {
    const nextIsDark = !isDark;
    document.documentElement.classList.toggle("dark", nextIsDark);
    localStorage.setItem("subflow-theme", nextIsDark ? "dark" : "light");
    setIsDark(nextIsDark);
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <header className="flex items-center justify-end gap-3 pb-4 sm:gap-5">
      <button
        type="button"
        onClick={() => toast("AI 추천 기능은 다음 단계에서 연결할게요.")}
        className="flex items-center gap-2 rounded-full bg-indigo-50 px-4 py-2 text-sm font-semibold text-indigo-700 transition hover:bg-indigo-100"
      >
        <div className="h-4 w-4 rounded-full bg-gradient-to-r from-indigo-400 to-violet-400" />
        Ask AI
      </button>
      <button
        type="button"
        onClick={toggleTheme}
        aria-label={isDark ? "라이트 모드로 변경" : "야간 모드로 변경"}
        className="flex h-10 w-10 items-center justify-center rounded-full bg-white/50 text-slate-600 transition hover:bg-white/80 dark:bg-white/90 dark:text-slate-900 dark:hover:bg-white"
      >
        {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
      </button>
      <NotificationBell />
      <button
        type="button"
        onClick={handleLogout}
        className="hidden rounded-full bg-white/50 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-white/80 sm:block"
      >
        로그아웃
      </button>
      <div className="flex items-center gap-2 pl-2">
        <div className="flex h-10 w-10 overflow-hidden rounded-full border-2 border-white shadow-sm">
          <img
            src={`https://api.dicebear.com/7.x/notionists/svg?seed=${user?.username || "Elena"}`}
            alt="Profile"
            className="h-full w-full bg-indigo-50 object-cover"
          />
        </div>
        <span className="hidden text-sm font-semibold text-slate-700 sm:block">{user?.username ?? "Elena C."}</span>
      </div>
    </header>
  );
}
