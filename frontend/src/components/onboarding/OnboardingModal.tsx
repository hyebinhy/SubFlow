import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  BarChart3,
  BellRing,
  CreditCard,
  PiggyBank,
  type LucideIcon,
} from "lucide-react";

interface Step {
  icon: LucideIcon;
  title: string;
  description: string;
}

const STEPS: Step[] = [
  {
    icon: CreditCard,
    title: "구독을 한곳에 모아보세요",
    description:
      "넷플릭스, 유튜브, 스포티파이처럼 흩어진 정기 결제를 한 화면에서 관리해요. 카탈로그에서 고르거나 직접 입력할 수 있어요.",
  },
  {
    icon: BarChart3,
    title: "지출을 분석하고 절약하세요",
    description:
      "월·연 지출과 카테고리별 비중을 자동 집계하고, 더 저렴한 요금제나 중복 구독을 찾아 절약 힌트를 드려요.",
  },
  {
    icon: PiggyBank,
    title: "가족과 나눠 쓰면 내 몫만",
    description:
      "함께 쓰는 인원을 입력하면 1인당 비용으로 계산돼요. 대시보드·분석에는 내가 실제 부담하는 금액만 반영됩니다.",
  },
  {
    icon: BellRing,
    title: "결제 전에 미리 알려드려요",
    description:
      "다가오는 결제일과 체험 만료, 가격 변동을 알림과 캘린더로 확인하세요. 자동 갱신도 알아서 처리돼요.",
  },
];

interface Props {
  onClose: () => void;
}

export default function OnboardingModal({ onClose }: Props) {
  const [step, setStep] = useState(0);
  const navigate = useNavigate();

  const isLast = step === STEPS.length - 1;
  const current = STEPS[step];
  const Icon = current.icon;

  const handleNext = () => {
    if (isLast) {
      onClose();
      navigate("/subscriptions");
    } else {
      setStep((s) => s + 1);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md rounded-2xl bg-white/80 backdrop-blur-xl border border-white/60 p-7 shadow-xl dark:bg-slate-800/80 dark:border-white/10">
        <div className="flex justify-end">
          <button
            onClick={onClose}
            className="text-xs font-medium text-slate-400 hover:text-slate-500"
          >
            건너뛰기
          </button>
        </div>

        <div className="mt-2 flex flex-col items-center text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 dark:bg-indigo-500/20">
            <Icon className="h-8 w-8" />
          </div>
          <h2 className="mt-5 text-xl font-bold text-slate-900 dark:text-white">
            {current.title}
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-slate-500 dark:text-slate-300">
            {current.description}
          </p>
        </div>

        {/* Progress dots */}
        <div className="mt-6 flex justify-center gap-2">
          {STEPS.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setStep(i)}
              className={`h-2 rounded-full transition-all ${
                i === step ? "w-6 bg-indigo-500" : "w-2 bg-slate-300 dark:bg-slate-600"
              }`}
              aria-label={`${i + 1}번째 안내로 이동`}
            />
          ))}
        </div>

        <div className="mt-6 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            disabled={step === 0}
            className="btn-secondary-glass px-4 py-2 text-sm font-medium disabled:opacity-0"
          >
            이전
          </button>
          <button
            type="button"
            onClick={handleNext}
            className="btn-primary-glass px-5 py-2 text-sm font-medium"
          >
            {isLast ? "구독 추가하러 가기" : "다음"}
          </button>
        </div>
      </div>
    </div>
  );
}
