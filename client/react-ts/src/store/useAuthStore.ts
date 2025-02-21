import { create } from "zustand";
import { AxiosError } from "axios";
import axiosInstance from "../utils/axiosInstance";
import Cookies from "js-cookie";

interface User {
  id: string;
  email: string;
  name: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, name: string, password: string) => Promise<void>;
  logout: () => void;
}

// Create Zustand store for authentication
export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: Cookies.get("token") || null,

  // Login function
  login: async (email: string, password: string) => {
    try {
      const response = await axiosInstance.post("/auth/login", {
        email,
        password,
      });

      const { token, user } = response.data;

      Cookies.set("token", token, {
        expires: 7,
        secure: true,
        sameSite: "Strict",
      });

      set({ user, token });
    } catch (error) {
      if (error instanceof AxiosError) {
        throw new Error(error.response?.data?.message || "Login failed");
      } else {
        throw new Error("Unexpected error occurred");
      }
    }
  },

  // Register function
  register: async (email: string, name: string, password: string) => {
    try {
      const response = await axiosInstance.post("/auth/register", {
        email,
        name,
        password,
      });

      const { token, user } = response.data;

      Cookies.set("token", token, {
        expires: 7,
        secure: true,
        sameSite: "Strict",
      });

      set({ user, token });
    } catch (error) {
      if (error instanceof AxiosError) {
        throw new Error(error.response?.data?.message || "Registration failed");
      } else {
        throw new Error("Unexpected error occurred");
      }
    }
  },

  // Logout function
  logout: () => {
    Cookies.remove("token");
    set({ user: null, token: null });
  },
}));
