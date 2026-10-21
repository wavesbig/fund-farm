import { create } from 'zustand';
import { checkAuthStatus, loginWithPassword, setupInitialPassword, logoutAuth } from '../lib/authClient';

export const useAuthStore = create((set, get) => ({
  isChecking: true,
  isInitialized: true,
  isAuthenticated: false,
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
        isInitialized: res?.isInitialized !== false,
        isAuthenticated: Boolean(res?.isAuthenticated)
      });
      return res;
    } catch (e) {
      set({ isChecking: false, isAuthenticated: false });
      return null;
    }
  },

  /**
   * 提交密码登录
   */
  login: async (password, rememberMe = true) => {
    set({ error: '' });
    const res = await loginWithPassword(password, rememberMe);
    if (res?.success) {
      set({ isAuthenticated: true, error: '' });
      return { success: true };
    }
    const msg = res?.error || '登录失败，请重试';
    set({ error: msg });
    return { success: false, error: msg };
  },

  /**
   * 首次创建管理员密码
   */
  setup: async (password) => {
    set({ error: '' });
    const res = await setupInitialPassword(password);
    if (res?.success) {
      set({ isAuthenticated: true, isInitialized: true, error: '' });
      return { success: true };
    }
    const msg = res?.error || '设置密码失败';
    set({ error: msg });
    return { success: false, error: msg };
  },

  /**
   * 退出登录 / 锁定
   */
  logout: async () => {
    await logoutAuth();
    set({ isAuthenticated: false, error: '' });
  }
}));
