import { useEffect } from "react";
import type { ReactNode } from "react";
import { createPortal } from "react-dom";

/** 열려 있는 모달 수. 겹쳐 열렸다 하나만 닫혀도 독이 돌아오면 안 된다. */
let openCount = 0;

/**
 * 모달을 body 바로 아래로 옮겨 그린다.
 *
 * 바깥 프레임(Layout의 카드)에 `backdrop-blur`가 걸려 있다. backdrop-filter는
 * 그 요소를 position:fixed 자손의 컨테이닝 블록으로 만들어 버려서, 모달의
 * `fixed inset-0`이 화면이 아니라 프레임 박스를 기준으로 잡히고 프레임의
 * `overflow-hidden`에 잘렸다. z-index도 프레임(z-10) 안에 갇혀, 하단 독(z-50)이
 * 모달 위로 올라왔다. 포털로 빼면 셋 다 사라진다.
 *
 * 포털로 빼고 나면 모달이 독보다 위에 오는데, 모달 판이 반투명이라 어두운
 * 독이 비쳐 얼룩처럼 보인다. 열려 있는 동안은 독을 접어 둔다.
 */
export default function ModalPortal({ children }: { children: ReactNode }) {
  useEffect(() => {
    openCount += 1;
    document.documentElement.classList.add("modal-open");
    return () => {
      openCount -= 1;
      if (openCount === 0) {
        document.documentElement.classList.remove("modal-open");
      }
    };
  }, []);

  return createPortal(children, document.body);
}
