/**
 * 前端认证辅助工具
 */

const TOKEN_KEY = 'fund_auth_token';

export function getStoredToken() {
  if (typeof window === 'undefined') return '';
  try {
    return localStorage.getItem(TOKEN_KEY) || '';
  } catch {
    return '';
  }
}

export function setStoredToken(token) {
  if (typeof window === 'undefined') return;
  try {
    if (token) {
      localStorage.setItem(TOKEN_KEY, token);
    } else {
      localStorage.removeItem(TOKEN_KEY);
    }
  } catch {}
}

export function removeStoredToken() {
  setStoredToken(null);
}

/**
 * 检查当前登录状态与初始化状态
 */
export async function checkAuthStatus() {
  try {
    const token = getStoredToken();
    const headers = {};
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
export async function loginWithPassword(password, rememberMe = true) {
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
  } catch (err) {
    return { success: false, error: err.message || '网络连接错误' };
  }
}

/**
 * 首次设置管理员密码
 */
export async function setupInitialPassword(password) {
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
  } catch (err) {
    return { success: false, error: err.message || '网络连接错误' };
  }
}

/**
 * 退出登录 / 锁定
 */
export async function logoutAuth() {
  try {
    const token = getStoredToken();
    const headers = { 'Content-Type': 'application/json' };
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
