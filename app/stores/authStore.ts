import { create } from 'zustand';
import { isObject, isString } from 'lodash';
import {
  checkAuthStatus,
  loginWithCredentials,
  setupInitialAccount,
  logoutAuth,
  getStoredUsername,
  type AuthStatusResponse,
  type AuthUser
} from '../lib/authClient';

export interface AuthStoreState {
  isChecking: boolean;
  isInitialized: boolean;
  isAuthenticated: boolean;
  user: AuthUser | null;
  error: string;
  check: () => Promise<AuthStatusResponse | null>;
  login: (
    passwordOrParams: string | { username?: string; password: string; rememberMe?: boolean },
    rememberMe?: boolean,
    username?: string
  ) => Promise<{ success: boolean; error?: string }>;
  setup: (
    passwordOrParams: string | { username?: string; password: string },
    username?: string
  ) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthStoreState>((set) => ({
  isChecking: true,
  isInitialized: false,
  isAuthenticated: false,
  user: null,
  error: '',

  /**
   * 初始化检查当前是否登录或是否已设置密码
   */
  check: async () => {
    set({ isChecking: true, error: '' });
    try {
      const res = await checkAuthStatus();
      set({
        isChecking: false,
        isInitialized: Boolean(res?.isInitialized),
        isAuthenticated: Boolean(res?.isAuthenticated),
        user: res?.user || (res?.isAuthenticated ? { username: getStoredUsername() || 'admin' } : null)
      });
      return res;
    } catch {
      set({ isChecking: false, isAuthenticated: false, user: null });
      return null;
    }
  },

  /**
   * 提交账号与密码登录
   */
  login: async (passwordOrParams, rememberMe = true, username) => {
    set({ error: '' });

    let finalParams: { username?: string; password: string; rememberMe?: boolean };
    if (isObject(passwordOrParams) && !isString(passwordOrParams)) {
      finalParams = passwordOrParams;
    } else {
      finalParams = {
        password: String(passwordOrParams || ''),
        rememberMe,
        username: username || getStoredUsername() || undefined
      };
    }

    const res = await loginWithCredentials(finalParams);
    if (res?.success) {
      set({
        isAuthenticated: true,
        user: res.user || { username: finalParams.username || 'admin' },
        error: ''
      });
      return { success: true };
    }

    const msg = res?.error || '登录失败，请重试';
    set({ error: msg });
    return { success: false, error: msg };
  },

  /**
   * 首次创建管理员账号与密码
   */
  setup: async (passwordOrParams, username) => {
    set({ error: '' });

    let finalParams: { username?: string; password: string };
    if (isObject(passwordOrParams) && !isString(passwordOrParams)) {
      finalParams = passwordOrParams;
    } else {
      finalParams = {
        password: String(passwordOrParams || ''),
        username: username || 'admin'
      };
    }

    const res = await setupInitialAccount(finalParams);
    if (res?.success) {
      set({
        isAuthenticated: true,
        isInitialized: true,
        user: res.user || { username: finalParams.username || 'admin' },
        error: ''
      });
      return { success: true };
    }

    const msg = res?.error || '设置账号密码失败';
    set({ error: msg });
    return { success: false, error: msg };
  },

  /**
   * 退出登录 / 锁定
   */
  logout: async () => {
    await logoutAuth();
    set({ isAuthenticated: false, user: null, error: '' });
  }
}));
