import { useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { CheckCircle2, XCircle } from "lucide-react";
import { authApi } from "../api/auth";
import { tr } from "../i18n/translations";

type State = "checking" | "done" | "failed";

export default function VerifyEmailPage() {
  const [params] = useSearchParams();
  const token = params.get("token") ?? "";
  const [state, setState] = useState<State>(token ? "checking" : "failed");
  // React 18 StrictMode는 effect를 두 번 돌린다 — 인증 요청이 두 번 나가지 않게 막는다
  const fired = useRef(false);

  useEffect(() => {
    if (!token || fired.current) return;
    fired.current = true;
    authApi
      .verifyEmail(token)
      .then(() => setState("done"))
      .catch(() => setState("failed"));
  }, [token]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-mesh">
      <div className="glass w-full max-w-md p-8 text-center">
        {state === "checking" && (
          <>
            <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
            <p className="mt-4 text-sm text-slate-500">{tr("확인 중...")}</p>
          </>
        )}

        {state === "done" && (
          <>
            <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-600" />
            <h1 className="mt-4 text-lg font-bold text-slate-900">
              {tr("이메일 주소가 확인되었습니다")}
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              {tr("이제 결제일 알림 메일을 받아보실 수 있습니다.")}
            </p>
          </>
        )}

        {state === "failed" && (
          <>
            <XCircle className="mx-auto h-12 w-12 text-rose-500" />
            <h1 className="mt-4 text-lg font-bold text-slate-900">
              {tr("확인하지 못했습니다")}
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              {tr("링크가 만료되었거나 유효하지 않습니다. 설정에서 다시 보낼 수 있습니다.")}
            </p>
          </>
        )}

        <Link
          to="/"
          className="btn-primary-glass mt-6 inline-block px-4 py-2 text-sm font-medium"
        >
          {tr("SubFlow로 이동")}
        </Link>
      </div>
    </div>
  );
}
