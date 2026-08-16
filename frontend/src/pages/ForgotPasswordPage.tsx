import { useState } from "react";
import { Link } from "react-router-dom";
import { MailCheck } from "lucide-react";
import { authApi } from "../api/auth";
import { tr } from "../i18n/translations";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await authApi.forgotPassword(email);
    } finally {
      // 성공/실패를 구분해 보여주지 않는다. 가입된 주소인지 알려주는 셈이 되기 때문.
      // 서버도 같은 이유로 항상 200을 준다.
      setLoading(false);
      setSent(true);
    }
  };

  if (sent) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-mesh">
        <div className="glass w-full max-w-md p-8 text-center">
          <MailCheck className="mx-auto h-12 w-12 text-blue-600" />
          <h1 className="mt-4 text-lg font-bold text-slate-900">
            {tr("메일을 확인해주세요")}
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            {tr("가입된 주소라면 재설정 링크를 보냈습니다. 링크는 30분 뒤 만료됩니다.")}
          </p>
          <Link
            to="/login"
            className="btn-primary-glass mt-6 inline-block px-4 py-2 text-sm font-medium"
          >
            {tr("로그인으로 돌아가기")}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-mesh">
      <div className="glass w-full max-w-md p-8">
        <h1 className="text-center text-lg font-bold text-slate-900">
          {tr("비밀번호 재설정")}
        </h1>
        <p className="mt-2 text-center text-sm text-slate-500">
          {tr("가입하신 이메일로 재설정 링크를 보내드립니다.")}
        </p>
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-500">
              {tr("이메일")}
            </label>
            <input
              type="email"
              name="email"
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="glass-input mt-1 block w-full rounded-lg px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="email@example.com"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="btn-primary-glass w-full px-4 py-2 font-medium disabled:opacity-50"
          >
            {loading ? tr("보내는 중...") : tr("재설정 링크 받기")}
          </button>
        </form>
        <p className="mt-4 text-center text-sm text-slate-500">
          <Link to="/login" className="text-blue-600 hover:underline">
            {tr("로그인으로 돌아가기")}
          </Link>
        </p>
      </div>
    </div>
  );
}
