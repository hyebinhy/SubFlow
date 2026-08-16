import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import { authApi } from "../api/auth";
import { tr } from "../i18n/translations";

export default function ResetPasswordPage() {
  const [params] = useSearchParams();
  const token = params.get("token") ?? "";
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) {
      toast.error(tr("비밀번호가 서로 다릅니다."));
      return;
    }
    setLoading(true);
    try {
      await authApi.resetPassword(token, password);
      toast.success(tr("비밀번호가 변경되었습니다. 새 비밀번호로 로그인해주세요."));
      navigate("/login");
    } catch (err: unknown) {
      const detail = (err as { response?: { data?: { detail?: unknown } } })
        ?.response?.data?.detail;
      // 서버 검증 실패(422)는 detail이 배열로 온다
      const msg =
        typeof detail === "string"
          ? detail
          : tr("영문과 숫자를 포함해 8자 이상으로 입력해주세요.");
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  // 토큰 없이 들어온 경우(주소만 직접 친 경우) 폼을 보여줄 이유가 없다
  if (!token) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-mesh">
        <div className="glass w-full max-w-md p-8 text-center">
          <h1 className="text-lg font-bold text-slate-900">
            {tr("유효하지 않은 링크입니다")}
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            {tr("재설정 링크를 다시 요청해주세요.")}
          </p>
          <Link
            to="/forgot-password"
            className="btn-primary-glass mt-6 inline-block px-4 py-2 text-sm font-medium"
          >
            {tr("재설정 링크 받기")}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-mesh">
      <div className="glass w-full max-w-md p-8">
        <h1 className="text-center text-lg font-bold text-slate-900">
          {tr("새 비밀번호 설정")}
        </h1>
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-500">
              {tr("새 비밀번호")}
            </label>
            <input
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              className="glass-input mt-1 block w-full rounded-lg px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="••••••••"
            />
            <p className="mt-1 text-xs text-slate-400">
              {tr("영문과 숫자를 포함해 8자 이상")}
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-500">
              {tr("새 비밀번호 확인")}
            </label>
            <input
              type="password"
              autoComplete="new-password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
              className="glass-input mt-1 block w-full rounded-lg px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="••••••••"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="btn-primary-glass w-full px-4 py-2 font-medium disabled:opacity-50"
          >
            {loading ? tr("변경 중...") : tr("비밀번호 변경")}
          </button>
        </form>
      </div>
    </div>
  );
}
