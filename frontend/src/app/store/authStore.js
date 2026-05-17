import { create } from "zustand";
import api from "../services/api";

// Helper to get a stored user from localStorage
const getStoredUser = () => {
  try {
    const stored = localStorage.getItem('user_data');
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
};

export const useAuthStore = create((set) => ({
  user: getStoredUser(),
  login: async (email, password) => {
    try {
      const response = await api.post('/auth/login/', { email, password });
      const { access, refresh } = response.data;
      localStorage.setItem('access_token', access);
      localStorage.setItem('refresh_token', refresh);
      const userData = { email, name: email.split("@")[0], avatar: null, plan: "Free" };
      localStorage.setItem('user_data', JSON.stringify(userData));
      set({ user: userData });
    } catch (error) {
      console.error("Login failed", error);
      throw error;
    }
  },
  signup: async (email, password, name) => {
    try {
      await api.post('/auth/signup/', { email, password, first_name: name });
      const response = await api.post('/auth/login/', { email, password });
      const { access, refresh } = response.data;
      localStorage.setItem('access_token', access);
      localStorage.setItem('refresh_token', refresh);
      const userData = { email, name, avatar: null, plan: "Free" };
      localStorage.setItem('user_data', JSON.stringify(userData));
      set({ user: userData });
    } catch (error) {
      console.error("Signup failed", error);
      throw error;
    }
  },
  logout: () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user_data');
    set({ user: null });
    window.location.href = '/login';
  },
}));

