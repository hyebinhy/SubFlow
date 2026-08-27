import type { ReactNode } from "react";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}

export default function SubscriptionModal({ isOpen, onClose, title, children }: Props) {
  if (!isOpen) return null;

  return (
    // 하단 독(.floating-dock)도 z-index 50이라 같은 층에서는 나중에 그려지는
    // 독이 위로 올라온다. 실제로 '구독 수정'의 저장 버튼이 독에 가려 눌리지
    // 않았다. 모달은 한 층 위에 둔다.
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      {/* 폼이 길어지면(구독 수정은 칸이 열 개가 넘는다) 화면 밖으로 넘쳐
          위아래가 잘렸다. 높이를 화면 안으로 묶고 내용만 스크롤시킨다. */}
      <div className="relative z-10 flex max-h-[90vh] w-full max-w-lg flex-col rounded-2xl border border-white/60 bg-white/70 shadow-xl backdrop-blur-xl">
        <div className="flex shrink-0 items-center justify-between px-6 pb-4 pt-6">
          <h2 className="text-lg font-bold text-slate-900">{title}</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-500"
            aria-label="닫기"
          >
            ✕
          </button>
        </div>
        <div className="custom-scrollbar min-h-0 flex-1 overflow-y-auto px-6 pb-6">
          {children}
        </div>
      </div>
    </div>
  );
}
