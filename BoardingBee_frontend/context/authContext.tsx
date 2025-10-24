"use client";
import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useRouter } from "next/navigation";

export interface AuthUser {
  id: number;
  username: string;
  email: string;
  role: string;
  token: string;
}

interface AuthContextType {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isOwner: boolean;
  login: (user: AuthUser) => void;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const router = useRouter();

  useEffect(() => {
    // Load user from localStorage or cookie if available
    const stored = typeof window !== "undefined" ? localStorage.getItem("authUser") : null;
    if (stored) setUser(JSON.parse(stored));
  }, []);

  useEffect(() => {
    console.debug("[AuthContext] User state changed:", user);
  }, [user]);

  const login = (user: AuthUser) => {
    setUser(user);
    localStorage.setItem("authUser", JSON.stringify(user));
  };

  const logout = () => {
  setUser(null);
  localStorage.removeItem("authUser");
  console.debug("[AuthContext] User after logout:", user, "localStorage:", localStorage.getItem("authUser"));
  router.push("/login");
  };

  const isAuthenticated = !!user;
  const isOwner = user?.role?.toUpperCase() === "OWNER";

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, isOwner, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
