/**
 * 前端认证辅助工具
 */

const TOKEN_KEY = 'fund_auth_token';

export function getStoredToken(): string {
  if (typeof window === 'undefined') return '';
  try {
    return localStorage.getItem(TOKEN_KEY) || '';
  } catch {
    return '';
  }
}

export function setStoredToken(token: string | null | undefined): void {
  if (typeof window === 'undefined') return;
  try {
    if (token) {
      localStorage.setItem(TOKEN_KEY, token);
    } else {
      localStorage.removeItem(TOKEN_KEY);
    }
  } catch {}
}

export function removeStoredToken(): void {
  setStoredToken(null);
}

export interface AuthStatusResponse {
  success: boolean;
  isAuthenticated?: boolean;
  isInitialized?: boolean;
  error?: string;
}

/**
 * 检查当前登录状态与初始化状态
 */
export async function checkAuthStatus(): Promise<AuthStatusResponse> {
  try {
    const token = getStoredToken();
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch('/api/auth', {
      method: 'GET',
      headers,
      cache: 'no-store'
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return data;
  } catch (err) {
    console.error('[authClient] checkAuthStatus error:', err);
    return { success: false, isAuthenticated: false, isInitialized: true };
  }
}

/**
 * 输入密码登录
 */
export async function loginWithPassword(password: string, rememberMe: boolean = true): Promise<any> {
  try {
    const res = await fetch('/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'login', password, rememberMe })
    });

    const data = await res.json();
    if (data.success && data.token) {
      setStoredToken(data.token);
    }
    return data;
  } catch (err: any) {
    return { success: false, error: err.message || '网络连接错误' };
  }
}

/**
 * 首次设置管理员密码
 */
export async function setupInitialPassword(password: string): Promise<any> {
  try {
    const res = await fetch('/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'setup', password })
    });

    const data = await res.json();
    if (data.success && data.token) {
      setStoredToken(data.token);
    }
    return data;
  } catch (err: any) {
    return { success: false, error: err.message || '网络连接错误' };
  }
}

/**
 * 退出登录 / 锁定
 */
export async function logoutAuth(): Promise<void> {
  try {
    const token = getStoredToken();
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    await fetch('/api/auth', {
      method: 'POST',
      headers,
      body: JSON.stringify({ action: 'logout' })
    });
  } finally {
    removeStoredToken();
  }
}
