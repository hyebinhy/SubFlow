import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import toast from "react-hot-toast";
import { authApi } from "../../api/auth";
import { tr } from "../../i18n/translations";

// 국내 사용자가 많이 쓰는 순서. 직접 입력도 그대로 되고, 여기서 고르면
// @ 뒤만 갈아 끼운다(앞부분은 유지).
// daum.net과 hanmail.net은 같은 메일함이지만 가입 시기에 따라 주소가 달라 둘 다 둔다.
const EMAIL_DOMAINS = [
  "naver.com",
  "gmail.com",
  "daum.net",
  "hanmail.net",
  "kakao.com",
  "nate.com",
  "outlook.com",
  "hotmail.com",
  "icloud.com",
  "yahoo.com",
  "korea.com",
  "empas.com",
];

export default function RegisterForm() {
  // 이메일은 앞부분(로컬)과 도메인을 나눠 받는다. 아래 버튼은 도메인만 채우고,
  // 목록에 없는 주소는 도메인 칸에 직접 쓰면 된다.
  const [emailLocal, setEmailLocal] = useState("");
  const [emailDomain, setEmailDomain] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const email = emailLocal && emailDomain ? `${emailLocal}@${emailDomain}` : "";

  /**
   * '@'가 섞여 들어온 값을 로컬과 도메인으로 가른다. '@'가 없으면 null.
   * 도메인 쪽에 '@'가 더 있으면 떼어 낸다('a@b@c' → b c 가 아니라 bc).
   */
  const splitEmail = (value: string) => {
    const at = value.indexOf("@");
    if (at === -1) return null;
    return {
      local: value.slice(0, at).trim(),
      domain: value.slice(at + 1).replace(/@/g, "").trim(),
    };
  };

  // 앞칸에 'me@naver.com'처럼 통째로 붙여넣는 경우가 흔하다 — 그때는 알아서 쪼갠다.
  const handleLocalChange = (value: string) => {
    const parts = splitEmail(value);
    if (parts) {
      setEmailLocal(parts.local);
      setEmailDomain(parts.domain);
      return;
    }
    setEmailLocal(value);
  };

  /**
   * 뒤칸도 앞칸과 똑같이 쪼갠다. 크롬 자동완성은 이 칸까지 이메일 칸으로 보고
   * 전체 주소를 넣기 때문에, 여기서 '@'만 지우면 'me@naver.com'이
   * 'menaver.com'이 되어 주소가 me@menaver.com으로 망가진다.
   */
  const handleDomainChange = (value: string) => {
    const parts = splitEmail(value);
    if (parts) {
      // '@naver.com'처럼 앞이 비어 있으면 도메인만 고친다 — 앞칸에 쓴 걸 지우면 안 된다
      if (parts.local) setEmailLocal(parts.local);
      setEmailDomain(parts.domain);
      return;
    }
    setEmailDomain(value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast.error(tr("비밀번호가 일치하지 않습니다."));
      return;
    }
    if (password.length < 8) {
      toast.error(tr("비밀번호는 8자 이상이어야 합니다."));
      return;
    }
    setLoading(true);
    try {
      await authApi.register({ email, password, username });
      toast.success(tr("회원가입 성공! 로그인해주세요."));
      navigate("/login");
    } catch {
      toast.error(tr("회원가입에 실패했습니다. 이미 가입된 이메일일 수 있습니다."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-mesh">
      <div className="glass w-full max-w-md p-8">
        {/* 로그인 화면과 같은 펜 스타일 워드마크 */}
        <img
          src="/brand/subflow-logo-pen-point.png"
          alt="SubFlow"
          className="mx-auto mb-5 h-10 w-auto"
        />
        <h1 className="mb-6 text-center text-2xl font-bold text-slate-900">
          {tr("회원가입")}
        </h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-500">
              {tr("사용자 이름")}
            </label>
            <input
              type="text"
              name="name"
              autoComplete="name"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              minLength={2}
              className="glass-input mt-1 block w-full rounded-lg px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder={tr("홍길동")}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-500">
              {tr("이메일")}
            </label>
            <div className="mt-1 flex items-center gap-2">
              <input
                type="text"
                name="email-local"
                autoComplete="username"
                value={emailLocal}
                onChange={(e) => handleLocalChange(e.target.value)}
                required
                className="glass-input min-w-0 flex-1 rounded-lg px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="email"
              />
              <span className="shrink-0 text-slate-400">@</span>
              <input
                type="text"
                name="email-domain"
                autoComplete="off"
                value={emailDomain}
                onChange={(e) => handleDomainChange(e.target.value)}
                required
                className="glass-input min-w-0 flex-1 rounded-lg px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder={tr("직접입력")}
              />
            </div>
            {/* 도메인 빠른 선택 — 목록에 없으면 오른쪽 칸에 직접 입력하면 됩니다 */}
            <div className="mt-2 flex flex-wrap gap-1.5">
              {EMAIL_DOMAINS.map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setEmailDomain(d)}
                  className={`rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${
                    emailDomain === d
                      ? "bg-blue-600 text-white"
                      : "glass text-slate-500 hover:bg-white/40"
                  }`}
                >
                  @{d}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-500">
              {tr("비밀번호")}
            </label>
            <input
              type="password"
              name="new-password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              className="glass-input mt-1 block w-full rounded-lg px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder={tr("8자 이상")}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-500">
              {tr("비밀번호 확인")}
            </label>
            <input
              type="password"
              name="confirm-password"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className="glass-input mt-1 block w-full rounded-lg px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder={tr("비밀번호 재입력")}
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="btn-primary-glass w-full px-4 py-2 font-medium disabled:opacity-50"
          >
            {loading ? tr("가입 중...") : tr("회원가입")}
          </button>
        </form>
        <p className="mt-4 text-center text-sm text-slate-500">
          {tr("이미 계정이 있으신가요?")}{" "}
          <Link to="/login" className="text-blue-600 hover:underline">
            {tr("로그인")}
          </Link>
        </p>
      </div>
    </div>
  );
}
