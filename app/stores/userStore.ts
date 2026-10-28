import { create } from 'zustand';
import type { User } from '@supabase/supabase-js';

export interface UserStoreState {
  user: User | null;
  setUser: (next: User | null) => void;
  clearUser: () => void;
}

/**
 * 当前 Supabase 登录用户（与 session.user 一致）。
 * 会话持久化由 supabase-js 负责（localStorage）；本 store 仅维护内存中的用户快照，供全局订阅。
 */
export const useUserStore = create<UserStoreState>((set) => ({
  user: null,

  setUser: (next: User | null) => set({ user: next }),

  clearUser: () => set({ user: null })
}));

/** 在非 React 代码（如异步回调）中读取当前用户 */
export const getAuthUser = (): User | null => useUserStore.getState().user;

/** 在非 React 代码中写入用户 */
export const setAuthUser = (user: User | null): void => {
  useUserStore.getState().setUser(user);
};

export const clearAuthUser = (): void => {
  useUserStore.getState().clearUser();
};
