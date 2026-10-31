import type { User, AuthState, UserRole, AuthTokenResponse, RefreshTokenResponse } from '../types/auth';
import { API_BASE_URL } from './api';

const TOKEN_KEY = 'lm_auth_token';
const REFRESH_TOKEN_KEY = 'lm_refresh_token';
const USER_KEY = 'lm_auth_user';

export const DEMO_ACCOUNTS: any[] = [];
export const DEFAULT_OFFICER_USER: any = null;
export const DEFAULT_ADMIN_USER: any = null;

export class AuthService {
  /**
   * Reads stored session credentials from localStorage.
   */
  static getStoredAuth(): { user: User | null; token: string | null; refreshToken: string | null } {
    try {
      const token = localStorage.getItem(TOKEN_KEY);
      const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
      const userStr = localStorage.getItem(USER_KEY);
      const user = userStr ? (JSON.parse(userStr) as User) : null;
      return { user, token, refreshToken };
    } catch {
      return { user: null, token: null, refreshToken: null };
    }
  }

  static getInitialState(): AuthState {
    const { user, token, refreshToken } = this.getStoredAuth();
    return {
      user,
      token,
      refreshToken,
      isAuthenticated: Boolean(token && user),
      isLoading: false
    };
  }

  static setSession(user: User, token: string, refreshToken?: string | null): void {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    if (refreshToken) {
      localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
    }
  }

  static clearSession(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  }

  static getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  static getRefreshToken(): string | null {
    return localStorage.getItem(REFRESH_TOKEN_KEY);
  }

  static isAuthenticated(): boolean {
    const { token, user } = this.getStoredAuth();
    return Boolean(token && user);
  }

  /**
   * Helper to handle API response parsing and error throwing.
   */
  private static async handleResponse<T>(res: Response): Promise<T> {
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const detail = data?.detail;
      let errorMsg = 'An unexpected error occurred.';
      if (typeof detail === 'string') {
        errorMsg = detail;
      } else if (Array.isArray(detail) && detail[0]?.msg) {
        errorMsg = detail[0].msg;
      } else if (data?.message) {
        errorMsg = data.message;
      }
      throw new Error(errorMsg);
    }
    return data as T;
  }

  /**
   * Authenticate user with email and password via backend.
   */
  static async login(
    email: string,
    password: string,
    rememberMe = false
  ): Promise<AuthTokenResponse> {
    const res = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: email.trim().toLowerCase(),
        password,
        remember_me: rememberMe
      })
    });

    const data = await this.handleResponse<AuthTokenResponse>(res);
    this.setSession(data.user, data.access_token, data.refresh_token);
    return data;
  }

  /**
   * Register a new user account.
   */
  static async register(payload: {
    email: string;
    full_name: string;
    password: string;
    confirm_password: string;
    accept_terms: boolean;
  }): Promise<AuthTokenResponse> {
    const res = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...payload,
        email: payload.email.trim().toLowerCase()
      })
    });

    const data = await this.handleResponse<AuthTokenResponse>(res);
    this.setSession(data.user, data.access_token, data.refresh_token);
    return data;
  }

  /**
   * Log out the current user and revoke their refresh token.
   */
  static async logout(): Promise<void> {
    const token = this.getToken();
    const refreshToken = this.getRefreshToken();

    try {
      if (refreshToken) {
        await fetch(`${API_BASE_URL}/auth/logout`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {})
          },
          body: JSON.stringify({ refresh_token: refreshToken })
        });
      }
    } catch (e) {
      console.warn('Logout revocation error:', e);
    } finally {
      this.clearSession();
    }
  }

  /**
   * Refresh the access token using the stored refresh token.
   */
  static async refreshToken(): Promise<RefreshTokenResponse | null> {
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) {
      this.clearSession();
      return null;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token: refreshToken })
      });

      if (!res.ok) {
        this.clearSession();
        return null;
      }

      const data = (await res.json()) as RefreshTokenResponse;
      localStorage.setItem(TOKEN_KEY, data.access_token);
      if (data.refresh_token) {
        localStorage.setItem(REFRESH_TOKEN_KEY, data.refresh_token);
      }
      return data;
    } catch {
      this.clearSession();
      return null;
    }
  }

  /**
   * Fetch current user profile from backend to validate session.
   */
  static async getMe(): Promise<User> {
    const token = this.getToken();
    if (!token) throw new Error('Not authenticated');

    const res = await fetch(`${API_BASE_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (res.status === 401) {
      // Try refresh token rotation
      const refreshed = await this.refreshToken();
      if (refreshed) {
        const retryRes = await fetch(`${API_BASE_URL}/auth/me`, {
          headers: { Authorization: `Bearer ${refreshed.access_token}` }
        });
        const user = await this.handleResponse<User>(retryRes);
        localStorage.setItem(USER_KEY, JSON.stringify(user));
        return user;
      }
      throw new Error('Session expired');
    }

    const user = await this.handleResponse<User>(res);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    return user;
  }

  /**
   * Verify email address with token from verification link.
   */
  static async verifyEmail(token: string): Promise<{ message: string }> {
    const res = await fetch(`${API_BASE_URL}/auth/verify-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token })
    });
    return this.handleResponse<{ message: string }>(res);
  }

  /**
   * Request resending the verification email.
   */
  static async resendVerification(email: string): Promise<{ message: string }> {
    const res = await fetch(`${API_BASE_URL}/auth/resend-verification`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email.trim().toLowerCase() })
    });
    return this.handleResponse<{ message: string }>(res);
  }

  /**
   * Request password reset link.
   */
  static async forgotPassword(email: string): Promise<{ message: string }> {
    const res = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email.trim().toLowerCase() })
    });
    return this.handleResponse<{ message: string }>(res);
  }

  /**
   * Reset password using token from reset link.
   */
  static async resetPassword(
    token: string,
    newPassword: string,
    confirmPassword: string
  ): Promise<{ message: string }> {
    const res = await fetch(`${API_BASE_URL}/auth/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        token,
        new_password: newPassword,
        confirm_password: confirmPassword
      })
    });
    return this.handleResponse<{ message: string }>(res);
  }

  /**
   * Update current user profile fields (full_name, location_unit).
   */
  static async updateProfile(data: { full_name?: string; location_unit?: string }): Promise<User> {
    const token = this.getToken();
    if (!token) throw new Error('Not authenticated');

    const res = await fetch(`${API_BASE_URL}/auth/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(data)
    });

    const updatedUser = await this.handleResponse<User>(res);
    localStorage.setItem(USER_KEY, JSON.stringify(updatedUser));
    return updatedUser;
  }

  /**
   * Change user password.
   */
  static async changePassword(
    currentPassword: string,
    newPassword: string,
    confirmPassword: string
  ): Promise<{ message: string }> {
    const token = this.getToken();
    if (!token) throw new Error('Not authenticated');

    const res = await fetch(`${API_BASE_URL}/auth/change-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        current_password: currentPassword,
        new_password: newPassword,
        confirm_password: confirmPassword
      })
    });

    return this.handleResponse<{ message: string }>(res);
  }

  /**
   * Role check helper.
   */
  static hasPermission(userRole: UserRole | undefined, requiredRole: 'ADMIN' | 'OFFICER' | 'ANY'): boolean {
    if (requiredRole === 'ANY') return true;
    if (!userRole) return false;
    if (requiredRole === 'ADMIN') return userRole === 'SYSTEM_ADMIN';
    if (requiredRole === 'OFFICER') return userRole === 'SYSTEM_ADMIN' || userRole === 'ENFORCEMENT_OFFICER';
    return false;
  }
}
