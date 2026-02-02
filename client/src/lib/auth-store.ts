import { create } from 'zustand';
import { api, type User } from './api';

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isInitialized: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  register: (name: string, email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: false,
  isInitialized: false,

  login: async (email, password) => {
    set({ isLoading: true });
    try {
      const user = await api.login(email, password);
      set({ user, isLoading: false });
      return true;
    } catch (error) {
      set({ isLoading: false });
      return false;
    }
  },

  register: async (name, email, password) => {
    set({ isLoading: true });
    try {
      const user = await api.register(name, email, password);
      set({ user, isLoading: false });
      return true;
    } catch (error) {
      set({ isLoading: false });
      return false;
    }
  },

  logout: async () => {
    try {
      await api.logout();
      set({ user: null });
    } catch (error) {
      console.error('Logout failed:', error);
    }
  },

  checkAuth: async () => {
    try {
      const user = await api.getCurrentUser();
      set({ user, isInitialized: true });
    } catch (error) {
      set({ user: null, isInitialized: true });
    }
  },
}));
