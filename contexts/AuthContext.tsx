"use client";

import { api } from "@/lib/api";
import { useRouter } from "next/navigation";
import React, { createContext, useContext, useEffect, useState } from "react";

interface User {
  id: string;
  _id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: "patient" | "doctor" | "nurse" | "admin" | "receptionist";
  patientId?: string;
  specialization?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
  updateUser: (data: Partial<User>) => Promise<void>;
}

interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: string;
  phone?: string;
  dateOfBirth?: string;
  gender?: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  // Load user from localStorage on initial mount
  const [user, setUser] = useState<User | null>(() => {
    if (typeof window !== "undefined") {
      const storedUser = localStorage.getItem("user");
      const token = localStorage.getItem("token");
      if (storedUser && token) {
        try {
          const parsed = JSON.parse(storedUser);
          // Set token in API client
          api.setToken(token);
          return parsed;
        } catch (e) {
          return null;
        }
      }
    }
    return null;
  });
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // Set loading to false immediately after mount
  useEffect(() => {
    setLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const response = await api.login(email, password);
      // api.login() already calls api.setToken() which saves token to localStorage
      const userData = response.user;

      // Set user state and save to localStorage
      setUser(userData);
      localStorage.setItem("user", JSON.stringify(userData));

      // Navigate to dashboard
      router.replace(getDashboardPath(userData.role));
    } catch (error: any) {
      throw new Error(error.message || "Login failed");
    }
  };

  const register = async (data: RegisterData) => {
    try {
      const response = await api.register(data);
      // api.register() already calls api.setToken() which saves token to localStorage
      const userData = response.user;
      setUser(userData);
      // Save user data to localStorage
      localStorage.setItem("user", JSON.stringify(userData));
      router.push(getDashboardPath(userData.role));
    } catch (error: any) {
      throw new Error(error.message || "Registration failed");
    }
  };

  const logout = () => {
    setUser(null);
    api.setToken(null);
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    router.push("/login");
  };

  const updateUser = async (data: Partial<User>) => {
    try {
      const response = await api.updateProfile(data);
      const userData = response.user;
      setUser(userData);
      // Update localStorage
      localStorage.setItem("user", JSON.stringify(userData));
    } catch (error: any) {
      throw new Error(error.message || "Update failed");
    }
  };

  const getDashboardPath = (role: string) => {
    switch (role) {
      case "patient":
        return "/dashboard/patient";
      case "doctor":
      case "nurse":
        return "/dashboard/doctor";
      case "admin":
        return "/dashboard/admin";
      case "receptionist":
        return "/dashboard/receptionist";
      default:
        return "/dashboard";
    }
  };

  return (
    <AuthContext.Provider
      value={{ user, loading, login, register, logout, updateUser }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
