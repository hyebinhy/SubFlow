export interface Category {
  id: number;
  name: string;
  icon?: string;
  color?: string;
  is_default: boolean;
  /** 내가 직접 만든 카테고리인지 (기본 카탈로그는 false) */
  is_custom?: boolean;
}
