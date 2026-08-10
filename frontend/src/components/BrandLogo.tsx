type Props = {
  /** 두 이미지에 함께 적용된다. 높이만 주고 폭은 w-auto로 두는 걸 권장. */
  className?: string;
};

/**
 * SubFlow 워드마크. 라이트 모드에서는 검정, 다크 모드에서는 흰색이 보인다.
 * 테마 전환은 <html>의 .dark 클래스를 보고 CSS가 처리하므로 JS 상태가 필요 없다.
 */
export default function BrandLogo({ className = "" }: Props) {
  return (
    <>
      <img
        src="/brand/subflow-logo-black.png"
        alt="SubFlow"
        className={`brand-logo-light ${className}`}
      />
      <img
        src="/brand/subflow-logo-white.png"
        alt=""
        aria-hidden="true"
        className={`brand-logo-dark ${className}`}
      />
    </>
  );
}
