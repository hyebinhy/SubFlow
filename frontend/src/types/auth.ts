export interface User {
  id: string;
  email: string;
  username: string;
  is_active: boolean;
  /** 이메일 주소 확인 여부. 미확인이면 알림 메일이 나가지 않는다. */
  email_verified: boolean;
  created_at: string;
}

export interface TokenPair {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  username: string;
}
