/**
 * 前端认证辅助工具
 */

const TOKEN_KEY = 'fund_auth_token';
const USERNAME_KEY = 'fund_last_username';

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

export function getStoredUsername(): string {
  if (typeof window === 'undefined') return '';
  try {
    return localStorage.getItem(USERNAME_KEY) || '';
  } catch {
    return '';
  }
}

export function setStoredUsername(username: string | null | undefined): void {
  if (typeof window === 'undefined') return;
  try {
    if (username) {
      localStorage.setItem(USERNAME_KEY, username);
    } else {
      localStorage.removeItem(USERNAME_KEY);
    }
  } catch {}
}

export interface AuthUser {
  username: string;
}

export interface AuthStatusResponse {
  success: boolean;
  isAuthenticated?: boolean;
  isInitialized?: boolean;
  user?: AuthUser | null;
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
    return { success: false, isAuthenticated: false, isInitialized: false };
  }
}

export interface LoginParams {
  username?: string;
  password: string;
  rememberMe?: boolean;
}

/**
 * 输入账号与密码登录
 */
export async function loginWithCredentials({ username, password, rememberMe = true }: LoginParams): Promise<any> {
  try {
    const res = await fetch('/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'login', username, password, rememberMe })
    });

    const data = await res.json();
    if (data.success && data.token) {
      setStoredToken(data.token);
      if (data.user?.username || username) {
        setStoredUsername(data.user?.username || username);
      }
    }
    return data;
  } catch (err: any) {
    return { success: false, error: err.message || '网络连接错误' };
  }
}

/**
 * 兼容旧版本的输入密码登录（默认或自动带出用户名）
 */
export async function loginWithPassword(password: string, rememberMe: boolean = true, username?: string): Promise<any> {
  return loginWithCredentials({
    username: username || getStoredUsername() || undefined,
    password,
    rememberMe
  });
}

export interface SetupParams {
  username?: string;
  password: string;
}

/**
 * 首次设置管理员账号与密码
 */
export async function setupInitialAccount({ username, password }: SetupParams): Promise<any> {
  try {
    const res = await fetch('/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'setup', username, password })
    });

    const data = await res.json();
    if (data.success && data.token) {
      setStoredToken(data.token);
      if (data.user?.username || username) {
        setStoredUsername(data.user?.username || username);
      }
    }
    return data;
  } catch (err: any) {
    return { success: false, error: err.message || '网络连接错误' };
  }
}

/**
 * 兼容旧版本的首次设置管理员密码
 */
export async function setupInitialPassword(password: string, username: string = 'admin'): Promise<any> {
  return setupInitialAccount({ username, password });
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
