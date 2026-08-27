import type { ReactNode } from "react";
import ModalPortal from "../common/ModalPortal";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}

export default function SubscriptionModal({ isOpen, onClose, title, children }: Props) {
  if (!isOpen) return null;

  return (
    // 바깥 프레임에 갇히지 않게 body로 빼서 그린다(ModalPortal 주석 참고).
    // 덕분에 화면 기준으로 자리를 잡고, 프레임 밖으로 넘어가도 잘리지 않는다.
    <ModalPortal>
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-3 sm:p-6">
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

        {/* 폼이 길어지면(구독 수정은 칸이 열 개가 넘는다) 화면 밖으로 넘쳐
            위아래가 잘렸다. 높이를 화면 안으로 묶고 내용만 스크롤시킨다.
            바깥 프레임(90vh)보다 크게 잡아, 독처럼 프레임 위로 걸치게 둔다. */}
        <div className="relative z-10 flex max-h-[calc(100dvh-1.5rem)] w-full max-w-xl flex-col rounded-2xl border border-white/60 bg-white/70 shadow-2xl backdrop-blur-xl sm:max-h-[calc(100dvh-3rem)]">
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
    </ModalPortal>
  );
}
