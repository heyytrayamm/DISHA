export type UserRole = 'SYSTEM_ADMIN' | 'ENFORCEMENT_OFFICER' | 'USER';

export interface User {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  location_unit?: string;
  is_active: boolean;
  email_verified?: boolean;
  created_at?: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface AuthTokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  user: User;
}

export interface RefreshTokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

export interface MessageResponse {
  message: string;
}
